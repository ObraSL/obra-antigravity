"use client";

import { Calendar, ChevronLeft, ChevronRight, X } from "lucide-react";
import { currentMonth, monthLabel, shiftMonth } from "@/lib/format";
import { IconButton } from "./Button";
import { tr } from "@/lib/i18n";

/** Filtro "todas / un mes concreto" con flechas, para listas largas (facturas, gastos...). */
export function MonthFilter({
  mes,
  onChange,
  onClear,
}: {
  mes: string | null;
  onChange: (mes: string) => void;
  onClear: () => void;
}) {
  if (!mes) {
    return (
      <button
        onClick={() => onChange(currentMonth())}
        className="mb-3.5 flex items-center gap-1.5 text-[13px] font-semibold text-obra-text-dim"
      >
        <Calendar size={14} /> {tr("Filtrar por mes")}
      </button>
    );
  }

  return (
    <div className="mb-3.5 flex items-center justify-between rounded-xl border border-obra-card-border bg-obra-card px-2 py-1.5">
      <IconButton onClick={() => onChange(shiftMonth(mes, -1))} className="h-8 w-8 border-none bg-transparent">
        <ChevronLeft size={16} />
      </IconButton>
      <span className="text-[13.5px] font-semibold text-obra-text">{monthLabel(mes)}</span>
      <div className="flex items-center gap-1">
        <IconButton onClick={() => onChange(shiftMonth(mes, 1))} className="h-8 w-8 border-none bg-transparent">
          <ChevronRight size={16} />
        </IconButton>
        <button onClick={onClear} className="flex items-center gap-1 px-2 text-xs font-semibold text-obra-text-faint">
          <X size={13} /> {tr("Ver todas")}
        </button>
      </div>
    </div>
  );
}
