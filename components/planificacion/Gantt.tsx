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

const COLOR: Record<EstadoTarea, { barra: string; fondo: string; texto: string; nodo: string }> = {
  hecha: {
    barra: "bg-[#d7dc9a]",
    fondo: "bg-[#d7dc9a]/30 border border-[#d7dc9a]/60",
    texto: "text-[#d7dc9a]",
    nodo: "border-[#141814] bg-[#d7dc9a]",
  },
  en_marcha: {
    barra: "bg-[#d7dc9a]",
    fondo: "bg-[#d7dc9a]/35 border border-[#d7dc9a]/75",
    texto: "text-[#d7dc9a]",
    nodo: "border-[#141814] bg-white",
  },
  retrasada: {
    barra: "bg-[#e0826d]",
    fondo: "bg-[#e0826d]/30 border border-[#e0826d]/65",
    texto: "text-[#ffdad2]",
    nodo: "border-[#141814] bg-[#e0826d]",
  },
  pendiente: {
    barra: "bg-white/55",
    fondo: "bg-white/15 border border-white/28",
    texto: "text-white/75",
    nodo: "border-white/70 bg-[#556058]",
  },
};

const ETIQUETA: Record<EstadoTarea, string> = {
  hecha: "Terminada",
  en_marcha: "En marcha",
  retrasada: "Retrasada",
  pendiente: "Pendiente",
};

/**
 * Diagrama de Gantt escalonado (Screen 3 de la referencia Dribbble):
 * Líneas verticales discontinuas con nodos circulares, cápsulas escalonadas
 * en Pistachio-Lime (#D7DC9A) y vidrio oliva traslúcido, y aguja de "Hoy".
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
    <div className="relative">
      {/* Líneas guía verticales discontinuas estilo Dribbble Screen 3 */}
      <div className="pointer-events-none absolute inset-x-0 bottom-7 top-2 flex justify-between px-4">
        <div className="h-full border-l border-dashed border-white/20" />
        <div className="h-full border-l border-dashed border-white/20" />
        <div className="h-full border-l border-dashed border-white/20" />
      </div>

      {/* Línea de hoy con nodo circular superior */}
      {posHoy !== null && (
        <div
          className="pointer-events-none absolute bottom-6 top-1 z-10 border-l border-dashed border-[#d7dc9a]/85"
          style={{ left: `${posHoy}%` }}
        >
          <span className="absolute -left-[5px] -top-1 h-2.5 w-2.5 rounded-full border-2 border-[#d7dc9a] bg-[#556058]" />
          <div className="absolute -bottom-5 -translate-x-1/2 rounded-full bg-[#d7dc9a] px-2 py-0.5 text-[9.5px] font-bold uppercase text-[#141814] shadow-xs">
            {tr("Hoy")}
          </div>
        </div>
      )}

      <div className="relative flex flex-col gap-3.5 pt-2 pb-3">
        {tareas.map((t) => {
          const estado = estadoTarea(t, hoy);
          const color = COLOR[estado];
          const { izquierda, ancho } = posicionBarra(t, rango);

          return (
            <button
              key={t.id}
              onClick={() => onTocar(t)}
              className="group block w-full text-left"
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="truncate text-[13.5px] font-semibold text-white group-hover:text-[#d7dc9a] transition-colors">
                  {t.nombre}
                </span>
                <span
                  className={clsx("shrink-0 font-mono-obra text-[11.5px] font-bold", color.texto)}
                >
                  {t.avance}%
                </span>
              </div>

              {/* Pista de la barra escalonada con cápsula estilo Dribbble */}
              <div className="relative mt-1.5 h-5 w-full rounded-[10px] bg-[#48524a]/75 p-0.5">
                <div
                  className={clsx(
                    "absolute inset-y-0.5 flex items-center overflow-hidden rounded-[8px] transition-all",
                    color.fondo
                  )}
                  style={{ left: `${izquierda}%`, width: `${ancho}%`, minWidth: "18px" }}
                >
                  <div
                    className={clsx("h-full rounded-[7px] transition-all", color.barra)}
                    style={{ width: `${Math.max(12, t.avance)}%` }}
                  />
                  {/* Nodo circular táctico dentro de la barra como en Screen 3 */}
                  <span
                    className={clsx(
                      "pointer-events-none absolute right-1.5 h-2.5 w-2.5 rounded-full border-2",
                      color.nodo
                    )}
                  />
                </div>
              </div>

              <div className="mt-1 flex items-center gap-1.5 text-[11px] text-white/70">
                <span className={clsx("font-semibold", color.texto)}>{tr(ETIQUETA[estado])}</span>
                <span>·</span>
                <span className="truncate">
                  {fmtDate(t.fecha_inicio)} – {fmtDate(t.fecha_fin)} ·{" "}
                  {trN(duracionDias(t), "{n} día", "{n} días")}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Escala inferior de meses (Sep 2026 · Today · Nov 2026) */}
      <div className="mt-1 flex border-t border-white/14 pt-2">
        {meses.map((m, i) => (
          <div
            key={i}
            className="overflow-hidden whitespace-nowrap text-[10.5px] font-semibold uppercase tracking-wide text-white/75"
            style={{ width: `${m.ancho}%` }}
          >
            {m.etiqueta}
          </div>
        ))}
      </div>
    </div>
  );
}
