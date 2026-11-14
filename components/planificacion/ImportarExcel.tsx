"use client";

import { useRef, useState } from "react";
import { Download, FileSpreadsheet, Loader2, Upload } from "lucide-react";
import type { ResultadoImport } from "@/lib/importar-excel";
import { fmtDate, fmtEUR } from "@/lib/format";
import { PrimaryButton, GhostButton } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { tr, trJsx, trN } from "@/lib/i18n";

/**
 * Carga del Gantt desde el Excel de la obra.
 *
 * Antes de guardar nada se enseña lo que se ha entendido del archivo, para
 * que se pueda comprobar de un vistazo: los Gantt de Excel se dibujan
 * pintando celdas y el año ni siquiera está escrito, así que conviene ver
 * las fechas antes de meterlas.
 */
export function ImportarExcel({
  hayTareas,
  onImportar,
}: {
  hayTareas: number;
  onImportar: (r: ResultadoImport, reemplazar: boolean) => Promise<string | null>;
}) {
  const [archivo, setArchivo] = useState<File | null>(null);
  const [resultado, setResultado] = useState<ResultadoImport | null>(null);
  const [leyendo, setLeyendo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [reemplazar, setReemplazar] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const leer = async (f: File, anio?: number) => {
    setLeyendo(true);
    setError("");
    try {
      // Se carga aquí y no arriba a propósito: la librería que lee Excel
      // pesa casi un mega y no tiene por qué descargarse en el móvil de
      // quien nunca va a importar nada.
      const { leerArchivoExcel } = await import("@/lib/importar-excel");
      setResultado(await leerArchivoExcel(f, anio));
      setArchivo(f);
    } catch (e) {
      setResultado(null);
      setError(e instanceof Error ? e.message : tr("No he podido leer el archivo."));
    }
    setLeyendo(false);
  };

  const cambiarAnio = async (delta: number) => {
    if (!archivo || !resultado) return;
    await leer(archivo, resultado.anio + delta);
  };

  const guardar = async () => {
    if (!resultado) return;
    setGuardando(true);
    const err = await onImportar(resultado, reemplazar);
    setGuardando(false);
    if (err) setError(err);
  };

  if (!resultado) {
    return (
      <div>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={leyendo}
          className="flex w-full flex-col items-center gap-2 rounded-xl border-[1.5px] border-dashed border-obra-line py-8 text-obra-text-dim"
        >
          {leyendo ? (
            <Loader2 size={26} className="animate-spin text-obra-yellow" />
          ) : (
            <FileSpreadsheet size={26} />
          )}
          <span className="text-[13.5px] font-semibold">
            {leyendo ? tr("Leyendo el archivo…") : tr("Elegir el Excel del Gantt")}
          </span>
        </button>

        <div className="mt-3 text-[12.5px] leading-relaxed text-obra-text-faint">
          {tr("Vale el Gantt tal cual lo tienes: con la fila de semanas arriba (")}<span className="text-obra-text-dim">{tr("WEEK 1 16.03-20.03")}</span>{tr("…) y las casillas pintadas de color. Cada capítulo se convierte en una tarea, con sus fechas y lo que tiene presupuestado.")}
        </div>

        <a
          href="/plantilla-plan-obra.xlsx"
          download
          className="mt-3 flex items-center gap-1.5 text-[13px] font-semibold text-obra-yellow"
        >
          <Download size={14} /> {tr("¿No tienes el plan en Excel? Descarga la plantilla")}
        </a>

        {error && <div className="mt-3 text-[13px] text-obra-red-text">{error}</div>}

        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xlsm,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) leer(f);
          }}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 text-[12.5px] text-obra-text-faint">
        {trJsx("Hoja {hoja}", { hoja: <span className="font-semibold text-obra-text-dim">{resultado.hoja}</span> })} ·{" "}
        {trN(resultado.semanas, "{n} semana", "{n} semanas")} · {trN(resultado.secciones.length, "{n} capítulo", "{n} capítulos")}
      </div>

      <Field label={tr("Año del plan")}>
        <div className="flex items-center gap-2">
          <GhostButton className="w-auto px-4 py-2" onClick={() => cambiarAnio(-1)} disabled={leyendo}>
            −
          </GhostButton>
          <div className="flex-1 text-center font-mono-obra text-xl font-bold text-obra-text">
            {resultado.anio}
          </div>
          <GhostButton className="w-auto px-4 py-2" onClick={() => cambiarAnio(1)} disabled={leyendo}>
            +
          </GhostButton>
        </div>
        <div className="mt-1.5 text-[11.5px] text-obra-text-faint">
          {tr("El Excel no guarda el año. He puesto el que hace que la primera semana empiece en lunes — compruébalo en las fechas de abajo.")}
        </div>
      </Field>

      <div className="mb-3.5 flex flex-col gap-1.5">
        {resultado.secciones.map((s, i) => (
          <div
            key={i}
            className="rounded-xl border border-obra-card-border bg-obra-card px-3 py-2.5"
          >
            <div className="truncate text-[13px] font-semibold text-obra-text">{s.nombre}</div>
            <div className="mt-0.5 flex items-center justify-between gap-2 text-[11.5px] text-obra-text-faint">
              <span className="truncate">
                {fmtDate(s.fecha_inicio)} – {fmtDate(s.fecha_fin)} · {trN(s.lineas, "{n} línea", "{n} líneas")}
              </span>
              <span className="shrink-0 font-mono-obra font-bold text-obra-text-dim">
                {fmtEUR(s.presupuesto)}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mb-3.5 flex items-center justify-between rounded-xl bg-obra-bg px-3.5 py-3 text-[13px]">
        <span className="font-semibold text-obra-text-dim">{tr("Presupuesto total")}</span>
        <span className="font-mono-obra font-bold text-obra-text">
          {fmtEUR(resultado.totalPresupuesto)}
        </span>
      </div>

      {resultado.avisos.length > 0 && (
        <div className="mb-3.5 rounded-xl bg-obra-red-bg px-3.5 py-3 text-[12.5px] text-obra-red-text">
          {resultado.avisos.map((a, i) => (
            <div key={i}>{a}</div>
          ))}
        </div>
      )}

      {hayTareas > 0 && (
        <button
          onClick={() => setReemplazar((v) => !v)}
          className="mb-3.5 flex w-full items-start gap-2.5 rounded-xl border border-obra-card-border bg-obra-card p-3 text-left"
        >
          <div
            className={`mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded border-2 ${
              reemplazar ? "border-obra-red bg-obra-red" : "border-obra-line"
            }`}
          >
            {reemplazar && <span className="text-[10px] font-bold text-white">✓</span>}
          </div>
          <span className="text-[12.5px] leading-snug text-obra-text-dim">
            {trN(hayTareas, "Borrar la {n} tarea que ya hay y dejar solo estas.", "Borrar las {n} tareas que ya hay y dejar solo estas.")}
            <span className="block text-obra-text-faint">
              {tr("Si lo dejas sin marcar, estas se añaden a las de ahora.")}
            </span>
          </span>
        </button>
      )}

      {error && <div className="mb-3.5 text-[13px] text-obra-red-text">{error}</div>}

      <PrimaryButton onClick={guardar} disabled={guardando || leyendo}>
        {guardando ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
        {reemplazar
          ? trN(resultado.secciones.length, "Reemplazar por este {n} capítulo", "Reemplazar por estos {n} capítulos")
          : trN(resultado.secciones.length, "Añadir este {n} capítulo", "Añadir estos {n} capítulos")}
      </PrimaryButton>

      <GhostButton
        className="mt-2.5"
        onClick={() => {
          setResultado(null);
          setArchivo(null);
          setError("");
        }}
      >
        {tr("Elegir otro archivo")}
      </GhostButton>
    </div>
  );
}
