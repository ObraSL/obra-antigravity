"use client";

import clsx from "clsx";
import type { Tarea } from "@/lib/types";
import { fmtDate } from "@/lib/format";
import {
  duracionDias,
  estadoTarea,
  mesesDelRango,
  posicionBarra,
  posicionDia,
  rangoObra,
  type EstadoTarea,
} from "@/lib/gantt";
import { tr, trN } from "@/lib/i18n";

const COLOR: Record<
  EstadoTarea,
  { barra: string; fondo: string; texto: string; nodo: string }
> = {
  hecha: {
    barra: "bg-[#d7dc9a]",
    fondo: "bg-[#d7dc9a]/20 border border-[#d7dc9a]/40",
    texto: "text-[#d7dc9a]",
    nodo: "bg-[#d7dc9a]",
  },
  en_marcha: {
    barra: "bg-[#d7dc9a]",
    fondo: "bg-white/20 border border-white/30",
    texto: "text-white",
    nodo: "bg-white",
  },
  retrasada: {
    barra: "bg-[#e0826d]",
    fondo: "bg-[#e0826d]/20 border border-[#e0826d]/40",
    texto: "text-[#ffdad2]",
    nodo: "bg-[#e0826d]",
  },
  pendiente: {
    barra: "bg-white/40",
    fondo: "bg-white/10 border border-white/15",
    texto: "text-white/60",
    nodo: "bg-white/50",
  },
};

const ETIQUETA: Record<EstadoTarea, string> = {
  hecha: "Terminada",
  en_marcha: "En marcha",
  retrasada: "Retrasada",
  pendiente: "Pendiente",
};

/**
 * Diagrama de Gantt arquitectónico de alta precisión.
 * Carriles esbeltos, indicadores proporcionales y láser de "Hoy".
 */
export function Gantt({
  tareas,
  hoy,
  onTocar,
}: {
  tareas: Tarea[];
  hoy: string;
  onTocar: (t: Tarea) => void;
}) {
  const rango = rangoObra(tareas);
  if (!rango) return null;

  const meses = mesesDelRango(rango);
  const posHoy = posicionDia(hoy, rango);

  return (
    <div className="relative select-none">
      {/* Línea de hoy con puntero láser de precisión */}
      {posHoy !== null && (
        <div
          className="pointer-events-none absolute bottom-7 top-1 z-20 border-l border-dashed border-[#d7dc9a]"
          style={{ left: `${posHoy}%` }}
        >
          <span className="absolute -left-[3px] -top-1 h-2 w-2 rounded-full bg-[#d7dc9a] shadow-xs" />
          <div className="font-mono-obra absolute -bottom-5 -translate-x-1/2 rounded-full border border-[#d7dc9a]/40 bg-[#141a16] px-2 py-0.5 text-[9px] font-bold uppercase text-[#d7dc9a] shadow-md backdrop-blur-md">
            {tr("Hoy")}
          </div>
        </div>
      )}

      <div className="relative flex flex-col gap-3.5 pt-2 pb-4">
        {tareas.map((t) => {
          const estado = estadoTarea(t, hoy);
          const color = COLOR[estado];
          const { izquierda, ancho } = posicionBarra(t, rango);

          return (
            <button
              key={t.id}
              onClick={() => onTocar(t)}
              className="group block w-full text-left rounded-xl p-2 transition hover:bg-white/5 active:scale-[0.99]"
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="truncate text-[13.5px] font-semibold text-white group-hover:text-[#d7dc9a] transition-colors">
                  {t.nombre}
                </span>
                <span
                  className={clsx(
                    "shrink-0 font-mono-obra text-[12px] font-bold",
                    color.texto
                  )}
                >
                  {t.avance}%
                </span>
              </div>

              {/* Carril arquitectónico de precisión (fino y minimalista) */}
              <div className="relative mt-2 h-2 w-full rounded-full bg-white/10 overflow-hidden">
                <div
                  className={clsx(
                    "absolute inset-y-0 rounded-full transition-all duration-300",
                    color.fondo
                  )}
                  style={{ left: `${izquierda}%`, width: `${ancho}%`, minWidth: "10px" }}
                >
                  {/* Relleno de avance dentro de la ventana de la tarea */}
                  <div
                    className={clsx(
                      "h-full rounded-full transition-all duration-300",
                      color.barra
                    )}
                    style={{ width: `${Math.max(0, Math.min(100, t.avance))}%` }}
                  />
                </div>
              </div>

              <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-white/55">
                <span className={clsx("font-semibold", color.texto)}>
                  {tr(ETIQUETA[estado])}
                </span>
                <span>·</span>
                <span className="truncate font-mono-obra">
                  {fmtDate(t.fecha_inicio)} – {fmtDate(t.fecha_fin)} ·{" "}
                  {trN(duracionDias(t), "{n} día", "{n} días")}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Escala temporal de meses */}
      <div className="mt-2 flex border-t border-white/10 pt-2.5">
        {meses.map((m, i) => (
          <div
            key={i}
            className="overflow-hidden whitespace-nowrap text-[10px] font-semibold uppercase tracking-wider text-white/50"
            style={{ width: `${m.ancho}%` }}
          >
            {m.etiqueta}
          </div>
        ))}
      </div>
    </div>
  );
}
