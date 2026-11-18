"use client";

import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { fmtDateLong, shiftDay, todayStr } from "@/lib/format";
import { tr } from "@/lib/i18n";
import clsx from "clsx";

export function DayNav({
  fecha,
  onChange,
}: {
  fecha: string;
  onChange: (fecha: string) => void;
}) {
  const esHoy = fecha === todayStr();
  return (
    <div className="mb-4 flex items-center justify-between rounded-[20px] border border-white/12 bg-[#0e120f]/80 px-2 py-1.5 backdrop-blur-xl shadow-[0_8px_20px_rgba(0,0,0,0.22),inset_0_1px_1px_rgba(255,255,255,0.08)]">
      <button
        type="button"
        onClick={() => onChange(shiftDay(fecha, -1))}
        aria-label={tr("Día anterior")}
        className="flex h-9 w-9 items-center justify-center rounded-xl text-white/75 transition-colors hover:bg-white/10 hover:text-white active:scale-95"
      >
        <ChevronLeft size={18} />
      </button>

      <div className="flex min-w-0 flex-1 items-center justify-center gap-2 px-2 text-center">
        <span className="truncate text-[14.5px] font-medium tracking-tight text-white capitalize">
          {fmtDateLong(fecha)}
        </span>
        {!esHoy && (
          <button
            type="button"
            onClick={() => onChange(todayStr())}
            className="flex items-center gap-1 rounded-full border border-white/14 bg-[#1c221e] px-2.5 py-0.5 text-[11px] font-medium text-[#d7dc9a] transition hover:bg-[#252e28]"
          >
            <RotateCcw size={10} />
            <span>{tr("Volver a hoy")}</span>
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={() => onChange(shiftDay(fecha, 1))}
        disabled={esHoy}
        aria-label={tr("Día siguiente")}
        className={clsx(
          "flex h-9 w-9 items-center justify-center rounded-xl transition-colors",
          esHoy
            ? "cursor-not-allowed opacity-30 text-white/40"
            : "text-white/75 hover:bg-white/10 hover:text-white active:scale-95"
        )}
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
