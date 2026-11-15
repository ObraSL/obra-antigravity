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
import { tr, trJsx, trN } from "@/lib/i18n";

/**
 * Planificación de la obra (Screen 3 de la referencia Dribbble):
 * Cabecera 3D del edificio en construcción, tarjeta de vidrio oliva esmerilado,
 * panel oscuro "Budget Used" con ecualizador de 40 barras (Blanco -> Pistachio-Lime -> Coral)
 * y diagrama de Gantt escalonado con líneas guía discontinuas.
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
      {/* Fotografía atmosférica de la obra con grúa torre (Screen 3 Dribbble) */}
      <FotoEdificio
        prioritaria
        retrasadas={retrasadas}
        altura="h-[210px] sm:h-[240px]"
      />

      {/* Tarjeta contenedora principal de vidrio esmerilado oliva (Screen 3 Dribbble) */}
      <div className="relative z-10 -mt-6 overflow-hidden rounded-[30px] border border-white/18 bg-[#68746a]/92 p-5 backdrop-blur-xl shadow-[0_18px_42px_rgba(12,16,13,0.3)]">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(110% 90% at 85% 0%, rgba(238,195,142,0.22) 0%, rgba(215,220,154,0.08) 40%, transparent 70%)",
          }}
        />

        <div className="relative">
          {/* Título de la obra + porcentaje de avance */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="truncate text-[19px] font-bold leading-snug text-white">
                {obraActual.nombre}
              </h1>
              <div className="mt-0.5 truncate text-[12.5px] text-white/75">
                {obraActual.direccion ||
                  (tareas.length === 0
                    ? tr("Todavía no hay plan")
                    : tr("{hechas} de {total} tareas terminadas", {
                        hechas,
                        total: tareas.length,
                      }))}
              </div>
            </div>
            <div className="shrink-0 rounded-full border border-white/18 bg-white/12 px-3 py-1 font-mono-obra text-[14px] font-bold text-[#d7dc9a]">
              {avance}%
            </div>
          </div>

          {/* Tarjeta oscura "Budget Used" con ecualizador de 40 barras (Screen 3 Dribbble) */}
          <div className="mt-4 rounded-[24px] border border-white/12 bg-[#525b53]/95 p-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-[14px] font-bold text-white">
                  {presupuestado > 0 ? tr("Presupuestado") : tr("Avance de la obra")}
                </div>
                <div className="mt-0.5 font-mono-obra text-[18px] font-bold text-[#d7dc9a]">
                  {presupuestado > 0 ? fmtEUR(presupuestado) : `${avance}%`}
                </div>
              </div>

              {/* Etiquetas con líneas verticales discontinuas estilo Day Left / Pending */}
              <div className="flex items-center gap-5 text-right">
                <div className="relative">
                  <div className="text-[10.5px] text-white/70">
                    {rango ? trN(rango.dias, "{n} día", "{n} días") : "Days"}
                  </div>
                  <div className="font-mono-obra text-[12.5px] font-bold text-white">
                    {hechas}/{tareas.length}
                  </div>
                </div>
                <div className="relative">
                  <div className="text-[10.5px] text-white/70">{tr("Pendiente")}</div>
                  <div className="font-mono-obra text-[12.5px] font-bold text-[#e0826d]">
                    {Math.max(0, tareas.length - hechas)}
                  </div>
                </div>
              </div>
            </div>

            {/* Ecualizador de código de barras de 40 segmentos (Blanco -> Pistachio-Lime -> Coral) */}
            <div className="relative mt-4 flex h-[38px] items-end justify-between gap-[2px] pt-2" aria-hidden>
              {Array.from({ length: 40 }).map((_, idx) => {
                const color =
                  idx < 14 ? "#ffffff" : idx < 28 ? "#d7dc9a" : "#e0826d";
                const altura =
                  idx === 14 || idx === 28
                    ? "100%"
                    : idx % 5 === 0
                      ? "88%"
                      : idx % 3 === 0
                        ? "72%"
                        : "80%";
                return (
                  <div key={idx} className="relative flex h-full flex-1 items-end justify-center">
                    {(idx === 14 || idx === 28) && (
                      <span className="absolute -top-2 h-2 w-2 rounded-full border border-white bg-[#525b53]" />
                    )}
                    <span
                      className="w-full max-w-[3.5px] rounded-full"
                      style={{ height: altura, background: color }}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Botones de acción (Añadir tarea / Desde Excel) */}
          <div className="mb-4 mt-4 grid grid-cols-2 gap-2.5">
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

          {/* Sección Project Timeline (Gantt) */}
          {tareas.length === 0 ? (
            <Empty
              icon={CalendarRange}
              title={tr("Sin planificación todavía")}
              sub={tr("Añade las tareas de la obra con sus fechas y verás aquí el diagrama y el avance.")}
            />
          ) : (
            <div className="mt-2 rounded-[24px] border border-white/14 bg-[#535c54]/85 p-4">
              <div className="mb-3 flex items-center justify-between border-b border-white/14 pb-2.5">
                <span className="text-[15px] font-bold text-white">
                  {tr("Planificación")}
                </span>
                {rango && (
                  <span className="text-[11.5px] text-white/75">
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
