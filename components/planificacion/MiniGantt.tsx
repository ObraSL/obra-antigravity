"use client";

import clsx from "clsx";
import type { Tarea } from "@/lib/types";
import { estadoTarea, posicionBarra, rangoObra, type EstadoTarea } from "@/lib/gantt";

const COLOR: Record<EstadoTarea, string> = {
  hecha: "bg-obra-green",
  en_marcha: "bg-obra-yellow",
  retrasada: "bg-obra-red",
  pendiente: "bg-obra-text-faint/45",
};

/**
 * El Gantt en miniatura para la portada: solo las barras, sin nombres ni
 * fechas. La lista entera de capítulos ocupaba media pantalla; así se ve de
 * un vistazo la forma del plan y con un toque se abre el grande.
 */
export function MiniGantt({ tareas, hoy }: { tareas: Tarea[]; hoy: string }) {
  const rango = rangoObra(tareas);
  if (!rango) return null;

  return (
    <div className="flex flex-col gap-[3px]">
      {tareas.map((t) => {
        const { izquierda, ancho } = posicionBarra(t, rango);
        return (
          <div key={t.id} className="relative h-[5px] w-full rounded-full bg-obra-bg">
            <div
              className={clsx("absolute inset-y-0 rounded-full", COLOR[estadoTarea(t, hoy)])}
              style={{ left: `${izquierda}%`, width: `${ancho}%`, minWidth: "5px" }}
            />
          </div>
        );
      })}
    </div>
  );
}
