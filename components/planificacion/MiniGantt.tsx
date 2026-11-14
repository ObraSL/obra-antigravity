"use client";

import clsx from "clsx";
import type { Tarea } from "@/lib/types";
import { estadoTarea, posicionBarra, rangoObra, type EstadoTarea } from "@/lib/gantt";

const COLOR: Record<EstadoTarea, string> = {
  hecha: "bg-[#d7dc9a]",
  en_marcha: "bg-[#d7dc9a]",
  retrasada: "bg-[#e0826d]",
  pendiente: "bg-white/40",
};

/**
 * El Gantt en miniatura para la portada: barras escalonadas en Pistachio-Lime
 * (#D7DC9A) y Coral (#E0826D) sobre pistas de vidrio oliva oscuro.
 */
export function MiniGantt({ tareas, hoy }: { tareas: Tarea[]; hoy: string }) {
  const rango = rangoObra(tareas);
  if (!rango) return null;

  return (
    <div className="flex flex-col gap-[5px]">
      {tareas.map((t) => {
        const { izquierda, ancho } = posicionBarra(t, rango);
        return (
          <div key={t.id} className="relative h-[7px] w-full rounded-full bg-[#48524a]/80">
            <div
              className={clsx("absolute inset-y-0 rounded-full", COLOR[estadoTarea(t, hoy)])}
              style={{ left: `${izquierda}%`, width: `${ancho}%`, minWidth: "8px" }}
            />
          </div>
        );
      })}
    </div>
  );
}
