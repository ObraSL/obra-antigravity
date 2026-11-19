"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarRange, FileSpreadsheet, Plus } from "lucide-react";
import { useObra } from "@/lib/obra-context";
import { createClient } from "@/lib/supabase/client";
import type { Tarea } from "@/lib/types";
import type { ResultadoImport } from "@/lib/importar-excel";
import { fmtDate, fmtEUR, todayStr } from "@/lib/format";
import { avanceObra, estadoTarea, rangoObra } from "@/lib/gantt";
import { GhostButton, PrimaryButton } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { Empty } from "@/components/ui/Empty";
import { Gantt } from "@/components/planificacion/Gantt";
import { ImportarExcel } from "@/components/planificacion/ImportarExcel";
import { TareaForm, type DatosTarea } from "@/components/planificacion/TareaForm";
import { FotoEdificio } from "@/components/ui/FotoEdificio";
import { CifraAvance } from "@/components/marca/CifraAvance";
import { Varillas, varillasPresupuesto } from "@/components/marca/Varillas";
import { tr, trJsx, trN } from "@/lib/i18n";

/**
 * Planificación de la obra de nivel empresarial:
 * Cabecera atmosférica, tarjeta ejecutiva de obsidiana táctica,
 * telemetría de avance arquitectónico, resumen presupuestario real
 * y diagrama de Gantt de alta precisión.
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

  /** Mete en el plan los capítulos leídos del Excel. */
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
    <div className="space-y-4">
      {/* Fotografía atmosférica de la obra con badge de estado */}
      <FotoEdificio
        prioritaria
        retrasadas={retrasadas}
        altura="h-[210px] sm:h-[240px]"
      />

      {/* Tarjeta contenedora ejecutiva en vidrio obsidiana táctico */}
      <div className="relative z-10 -mt-8 overflow-hidden rounded-[26px] border border-white/14 bg-[#141a16]/92 p-5 backdrop-blur-2xl shadow-[0_20px_48px_rgba(0,0,0,0.38)]">
        <div className="relative">
          {/* Título de la obra + Cifra de avance */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="truncate text-[18px] font-semibold leading-snug tracking-tight text-white">
                {obraActual.nombre}
              </h1>
              <div className="mt-0.5 truncate text-[12.5px] text-white/60">
                {obraActual.direccion ||
                  (tareas.length === 0
                    ? tr("Todavía no hay plan")
                    : tr("{hechas} de {total} tareas terminadas", {
                        hechas,
                        total: tareas.length,
                      }))}
              </div>
            </div>
            <span className="flex items-center gap-1.5 rounded-full border border-[#d7dc9a]/30 bg-[#d7dc9a]/12 px-3 py-1 font-mono-obra text-[12px] font-bold text-[#d7dc9a]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#d7dc9a] animate-pulse" />
              {avance}%
            </span>
          </div>

          {/* Panel de métricas clave */}
          <div className="mt-4 rounded-[20px] border border-white/10 bg-white/5 p-4 backdrop-blur-md">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-[11.5px] font-medium uppercase tracking-wider text-white/55">
                  {presupuestado > 0 ? tr("Presupuesto total") : tr("Avance de la obra")}
                </div>
                <div className="mt-1 font-mono-obra text-[20px] font-bold text-white">
                  {presupuestado > 0 ? fmtEUR(presupuestado) : `${avance}%`}
                </div>
              </div>

              {/* Indicadores de estado de tareas */}
              <div className="flex items-center gap-4 text-right">
                <div>
                  <div className="text-[10.5px] text-white/55">
                    {rango ? trN(rango.dias, "{n} día", "{n} días") : "Días"}
                  </div>
                  <div className="font-mono-obra text-[13px] font-bold text-white">
                    {hechas}/{tareas.length}
                  </div>
                </div>
                <div>
                  <div className="text-[10.5px] text-white/55">{tr("Pendiente")}</div>
                  <div className="font-mono-obra text-[13px] font-bold text-[#e0826d]">
                    {Math.max(0, tareas.length - hechas)}
                  </div>
                </div>
              </div>
            </div>

            {/* Regla de varillas arquitectónicas */}
            <div className="mt-3.5">
              <Varillas
                varillas={varillasPresupuesto(avance)}
                alto={20}
                grosor={0.5}
                resumen={tr("Avance de la obra")}
              />
            </div>
          </div>

          {/* Botones de acción */}
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <PrimaryButton onClick={() => setAnadiendo(true)}>
              <Plus size={16} /> {tr("Añadir tarea")}
            </PrimaryButton>
            <GhostButton
              onClick={() => setImportando(true)}
              className="flex items-center justify-center gap-2 border border-white/12 bg-white/5 text-white hover:bg-white/10"
            >
              <FileSpreadsheet size={15} /> {tr("Desde Excel")}
            </GhostButton>
          </div>

          {error && (
            <div className="mt-3 rounded-xl bg-obra-red-bg px-3.5 py-3 text-[13px] text-obra-red-text">
              {tr("No se ha podido guardar:")} {error}
            </div>
          )}

          {/* Sección Diagrama de Gantt */}
          {tareas.length === 0 ? (
            <div className="mt-4">
              <Empty
                icon={CalendarRange}
                title={tr("Sin planificación todavía")}
                sub={tr("Añade las tareas de la obra con sus fechas y verás aquí el diagrama y el avance.")}
              />
            </div>
          ) : (
            <div className="mt-4 rounded-[22px] border border-white/12 bg-[#121613]/85 p-4 shadow-lg backdrop-blur-xl">
              <div className="mb-3 flex items-center justify-between border-b border-white/10 pb-2.5">
                <span className="text-[14px] font-bold text-white">
                  {tr("Planificación")}
                </span>
                {rango && (
                  <span className="font-mono-obra text-[11px] text-white/60">
                    {trJsx("Del {desde} al {hasta}", {
                      desde: <span className="font-semibold text-white">{fmtDate(rango.desde)}</span>,
                      hasta: <span className="font-semibold text-white">{fmtDate(rango.hasta)}</span>,
                    })}
                  </span>
                )}
              </div>

              <Gantt tareas={tareas} hoy={hoy} onTocar={setEditando} />
            </div>
          )}
        </div>
      </div>

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
