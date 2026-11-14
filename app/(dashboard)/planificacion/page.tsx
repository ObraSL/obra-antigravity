"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarRange, FileSpreadsheet, Plus, TrendingUp } from "lucide-react";
import { useObra } from "@/lib/obra-context";
import { createClient } from "@/lib/supabase/client";
import type { Tarea } from "@/lib/types";
import type { ResultadoImport } from "@/lib/importar-excel";
import { fmtDate, fmtEUR, todayStr } from "@/lib/format";
import { avanceObra, estadoTarea, rangoObra } from "@/lib/gantt";
import { Card, HeroStatCard } from "@/components/ui/Card";
import { GhostButton, PrimaryButton } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { Empty } from "@/components/ui/Empty";
import { Gantt } from "@/components/planificacion/Gantt";
import { ImportarExcel } from "@/components/planificacion/ImportarExcel";
import { TareaForm, type DatosTarea } from "@/components/planificacion/TareaForm";
import { tr, trJsx, trN } from "@/lib/i18n";

/**
 * Planificación de la obra: el diagrama de Gantt con las tareas, sus fechas
 * y cuánto lleva hecho cada una. De aquí sale el porcentaje de avance que se
 * ve en la portada.
 */
export default function PlanificacionPage() {
  const { obraActual } = useObra();
  const supabase = useMemo(() => createClient(), []);
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [anadiendo, setAnadiendo] = useState(false);
  const [importando, setImportando] = useState(false);
  const [editando, setEditando] = useState<Tarea | null>(null);
  const [error, setError] = useState("");
  const hoy = todayStr();

  const cargar = useCallback(async () => {
    if (!obraActual) return;
    const { data, error: err } = await supabase
      .from("tareas")
      .select("*")
      .eq("obra_id", obraActual.id)
      .order("orden")
      .order("fecha_inicio");
    // Si algo falla, que se vea: si no, la pantalla se queda vacía sin
    // explicar por qué y parece que la app se ha comido las tareas.
    setError(err ? err.message : "");
    setTareas(data ?? []);
  }, [obraActual, supabase]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  if (!obraActual) return null;

  const anadir = async (d: DatosTarea) => {
    const orden = tareas.length === 0 ? 0 : Math.max(...tareas.map((t) => t.orden)) + 1;
    const { error: err } = await supabase
      .from("tareas")
      .insert({ obra_id: obraActual.id, ...d, orden });
    if (err) {
      setError(err.message);
      return;
    }
    setAnadiendo(false);
    await cargar();
  };

  const guardarCambios = async (d: DatosTarea) => {
    if (!editando) return;
    const { error: err } = await supabase.from("tareas").update(d).eq("id", editando.id);
    if (err) {
      setError(err.message);
      return;
    }
    setEditando(null);
    await cargar();
  };

  /** Mete en el plan los capítulos leídos del Excel. Devuelve el fallo, si lo hay. */
  const importar = async (r: ResultadoImport, reemplazar: boolean): Promise<string | null> => {
    if (reemplazar) {
      const { error: errBorrar } = await supabase
        .from("tareas")
        .delete()
        .eq("obra_id", obraActual.id);
      if (errBorrar) return errBorrar.message;
    }

    const desde = reemplazar || tareas.length === 0 ? 0 : Math.max(...tareas.map((t) => t.orden)) + 1;
    const { error: errMeter } = await supabase.from("tareas").insert(
      r.secciones.map((s, i) => ({
        obra_id: obraActual.id,
        nombre: s.nombre,
        fecha_inicio: s.fecha_inicio,
        fecha_fin: s.fecha_fin,
        avance: 0,
        orden: desde + i,
        presupuesto: s.presupuesto,
      }))
    );
    if (errMeter) return errMeter.message;

    setImportando(false);
    await cargar();
    return null;
  };

  const borrar = async () => {
    if (!editando) return;
    const { error: err } = await supabase.from("tareas").delete().eq("id", editando.id);
    if (err) {
      setError(err.message);
      return;
    }
    setEditando(null);
    await cargar();
  };

  const avance = avanceObra(tareas);
  const rango = rangoObra(tareas);
  const hechas = tareas.filter((t) => t.avance >= 100).length;
  const retrasadas = tareas.filter((t) => estadoTarea(t, hoy) === "retrasada").length;
  const presupuestado = tareas.reduce((s, t) => s + Number(t.presupuesto || 0), 0);

  return (
    <div>
      <HeroStatCard
        label={tr("Avance de la obra")}
        value={`${avance}%`}
        sub={
          tareas.length === 0
            ? tr("Todavía no hay plan")
            : tr("{hechas} de {total} tareas terminadas", { hechas, total: tareas.length }) +
              (retrasadas > 0 ? ` · ${tr("{n} con retraso", { n: retrasadas })}` : "")
        }
        icon={<TrendingUp size={16} />}
      />

      <div className="mb-4 mt-3.5 grid grid-cols-2 gap-2.5">
        <PrimaryButton onClick={() => setAnadiendo(true)}>
          <Plus size={16} /> {tr("Añadir tarea")}
        </PrimaryButton>
        <GhostButton
          onClick={() => setImportando(true)}
          className="flex items-center justify-center gap-2"
        >
          <FileSpreadsheet size={15} /> {tr("Desde Excel")}
        </GhostButton>
      </div>

      {error && (
        <div className="mb-4 rounded-xl bg-obra-red-bg px-3.5 py-3 text-[13px] text-obra-red-text">
          {tr("No se ha podido guardar:")} {error}
        </div>
      )}

      {tareas.length === 0 ? (
        <Empty
          icon={CalendarRange}
          title={tr("Sin planificación todavía")}
          sub={tr("Añade las tareas de la obra con sus fechas y verás aquí el diagrama y el avance.")}
        />
      ) : (
        <Card className="p-4">
          {rango && (
            <div className="mb-3 border-b border-obra-card-border pb-3 text-[11.5px] text-obra-text-faint">
              <div className="flex items-center justify-between">
                <span>
                  {trJsx("Del {desde} al {hasta}", {
                    desde: <span className="font-semibold text-obra-text-dim">{fmtDate(rango.desde)}</span>,
                    hasta: <span className="font-semibold text-obra-text-dim">{fmtDate(rango.hasta)}</span>,
                  })}
                </span>
                <span className="font-mono-obra font-bold text-obra-text">{trN(rango.dias, "{n} día", "{n} días")}</span>
              </div>
              {presupuestado > 0 && (
                <div className="mt-1 flex items-center justify-between">
                  <span>{tr("Presupuestado")}</span>
                  <span className="font-mono-obra font-bold text-obra-text">
                    {fmtEUR(presupuestado)}
                  </span>
                </div>
              )}
            </div>
          )}

          <Gantt tareas={tareas} hoy={hoy} onTocar={setEditando} />
        </Card>
      )}

      {anadiendo && (
        <Sheet title={tr("Nueva tarea")} onClose={() => setAnadiendo(false)}>
          <TareaForm onGuardar={anadir} />
        </Sheet>
      )}

      {importando && (
        <Sheet title={tr("Traer el plan del Excel")} onClose={() => setImportando(false)}>
          <ImportarExcel hayTareas={tareas.length} onImportar={importar} />
        </Sheet>
      )}

      {editando && (
        <Sheet title={tr("Tarea")} onClose={() => setEditando(null)}>
          <TareaForm tarea={editando} onGuardar={guardarCambios} onBorrar={borrar} />
        </Sheet>
      )}
    </div>
  );
}
