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

/**
 * Las clases van escritas enteras a propósito: Tailwind busca los nombres de
 * clase tal cual en el código, así que algo como `bg-obra-${color}` no
 * generaría el color y la barra saldría transparente.
 */
/**
 * La barra lleva contorno además de relleno suave: una tarea al 0 % (que es
 * como quedan TODAS nada más traerlas del Excel) solo se veía como una
 * mancha pálida y no se distinguía cuándo tocaba hacerla. Con el borde se
 * ve el hueco planificado aunque no haya nada hecho.
 */
const COLOR: Record<EstadoTarea, { barra: string; fondo: string; texto: string }> = {
  hecha: {
    barra: "bg-obra-green",
    fondo: "bg-obra-green/20 border border-obra-green/40",
    texto: "text-obra-green",
  },
  en_marcha: {
    barra: "bg-obra-yellow border border-obra-text/15",
    fondo: "bg-obra-yellow/25 border border-obra-yellow/60",
    texto: "text-obra-accent-ink",
  },
  retrasada: {
    barra: "bg-obra-red",
    fondo: "bg-obra-red/20 border border-obra-red/40",
    texto: "text-obra-red-text",
  },
  pendiente: {
    barra: "bg-[#8E9E93]",
    fondo: "bg-[#8E9E93]/20 border border-[#8E9E93]/40",
    texto: "text-obra-text-faint",
  },
};

const ETIQUETA: Record<EstadoTarea, string> = {
  hecha: "Terminada",
  en_marcha: "En marcha",
  retrasada: "Retrasada",
  pendiente: "Pendiente",
};

/**
 * Diagrama de Gantt de la obra. Toda la obra se aprieta en el ancho de la
 * pantalla (cada barra se coloca en porcentaje), así se ve el plan entero de
 * un vistazo y no hace falta deslizar de lado — que en el iPhone daba
 * problemas y encima obliga a buscar dónde está cada cosa.
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
      {/* Escala de meses */}
      <div className="flex border-b border-obra-line pb-1">
        {meses.map((m, i) => (
          <div
            key={i}
            className="overflow-hidden whitespace-nowrap text-[10px] font-semibold uppercase tracking-wide text-obra-text-faint"
            style={{ width: `${m.ancho}%` }}
          >
            {m.etiqueta}
          </div>
        ))}
      </div>

      {/* Línea de hoy: cruza todas las tareas para ver de un golpe qué
          debería estar ya terminado y qué no. Va antes que las filas para
          quedar por detrás del texto. */}
      {posHoy !== null && (
        <div
          className="pointer-events-none absolute bottom-0 top-5 w-px bg-obra-orange/40"
          style={{ left: `${posHoy}%` }}
        >
          <div className="absolute -top-[18px] -translate-x-1/2 rounded-full bg-obra-orange px-1.5 py-px text-[9px] font-bold uppercase text-white">
            {tr("Hoy")}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3.5 pt-3">
        {tareas.map((t) => {
          const estado = estadoTarea(t, hoy);
          const color = COLOR[estado];
          const { izquierda, ancho } = posicionBarra(t, rango);

          return (
            <button key={t.id} onClick={() => onTocar(t)} className="block w-full text-left">
              <div className="flex items-baseline justify-between gap-2">
                <span className="truncate text-[13.5px] font-semibold text-obra-text">
                  {t.nombre}
                </span>
                <span
                  className={clsx("shrink-0 font-mono-obra text-[11.5px] font-bold", color.texto)}
                >
                  {t.avance}%
                </span>
              </div>

              <div className="relative mt-1.5 h-2.5 w-full rounded-full bg-obra-bg">
                <div
                  className={clsx("absolute inset-y-0 rounded-full", color.fondo)}
                  // El mínimo evita que una tarea de un día en una obra de un
                  // año quede tan fina que no se vea.
                  style={{ left: `${izquierda}%`, width: `${ancho}%`, minWidth: "6px" }}
                >
                  <div
                    className={clsx("h-full rounded-full", color.barra)}
                    style={{ width: `${t.avance}%` }}
                  />
                </div>
              </div>

              <div className="mt-1 flex items-center gap-1.5 text-[11px] text-obra-text-faint">
                <span className={clsx("font-semibold", color.texto)}>{tr(ETIQUETA[estado])}</span>
                <span>·</span>
                <span className="truncate">
                  {fmtDate(t.fecha_inicio)} – {fmtDate(t.fecha_fin)} · {trN(duracionDias(t), "{n} día", "{n} días")}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
