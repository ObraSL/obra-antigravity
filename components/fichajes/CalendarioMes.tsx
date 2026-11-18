"use client";

import { useMemo, useState } from "react";
import { Calendar, ChevronDown, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import clsx from "clsx";
import { currentMonth, monthLabel, shiftMonth, todayStr } from "@/lib/format";
import { tr, trN } from "@/lib/i18n";

interface CalendarioMesProps {
  mes: string;
  onMesChange: (mes: string) => void;
  fechaSeleccionada: string;
  onSelectFecha: (fecha: string) => void;
  diasFichados: Set<string>;
  diasIncompletos?: Set<string>;
  totalHorasMes?: string;
  inicialAbierto?: boolean;
}

const DIAS_SEMANA_CORTO = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"];

export function CalendarioMes({
  mes,
  onMesChange,
  fechaSeleccionada,
  onSelectFecha,
  diasFichados,
  diasIncompletos = new Set(),
  totalHorasMes,
  inicialAbierto = true,
}: CalendarioMesProps) {
  const [abierto, setAbierto] = useState(inicialAbierto);
  const hoy = todayStr();

  const celdas = useMemo(() => {
    const [y, m] = mes.split("-").map(Number);
    const primerDia = new Date(y, m - 1, 1);
    // getDay() devuelve 0 para domingo; convertimos a 0 para lunes (0 = Lu ... 6 = Do)
    const diaSemanaInicio = (primerDia.getDay() + 6) % 7;
    const diasEnMes = new Date(y, m, 0).getDate();

    const arr: ({ fecha: string; dia: number; esMesActual: boolean } | null)[] = [];

    // Huecos vacíos del inicio de semana
    for (let i = 0; i < diaSemanaInicio; i++) {
      arr.push(null);
    }

    // Días del mes actual
    for (let d = 1; d <= diasEnMes; d++) {
      const fechaIso = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      arr.push({ fecha: fechaIso, dia: d, esMesActual: true });
    }

    return arr;
  }, [mes]);

  const numDiasTrabajados = diasFichados.size;

  return (
    <div className="mb-3.5 overflow-hidden rounded-[22px] border border-white/14 bg-[#141a16]/85 backdrop-blur-xl shadow-lg transition-all">
      {/* Botón de cabecera / acordeón */}
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        className="flex w-full items-center justify-between p-3.5 text-left transition hover:bg-white/5 active:scale-[0.99]"
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/15 bg-white/8 text-[#d7dc9a]">
            <Calendar size={16} />
          </div>
          <div>
            <div className="text-[13.5px] font-bold text-white">
              {tr("Calendario de asistencia")} · <span className="text-[#d7dc9a]">{monthLabel(mes)}</span>
            </div>
            <div className="text-[11.5px] text-white/65">
              {trN(numDiasTrabajados, "{n} día trabajado", "{n} días trabajados")}
              {totalHorasMes ? ` · ${totalHorasMes}` : ""}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 rounded-full border border-[#d7dc9a]/30 bg-[#d7dc9a]/12 px-2.5 py-0.5 text-[11px] font-bold text-[#d7dc9a]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#d7dc9a] animate-pulse" />
            {numDiasTrabajados}
          </span>
          <ChevronDown
            size={16}
            className={clsx("text-white/60 transition-transform duration-200", abierto && "rotate-180 text-white")}
          />
        </div>
      </button>

      {/* Contenido desplegable del mes */}
      {abierto && (
        <div className="border-t border-white/10 p-3.5 pt-3">
          {/* Navegador de mes */}
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => onMesChange(shiftMonth(mes, -1))}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/12 bg-white/5 text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-[13px] font-bold text-white">{monthLabel(mes)}</span>
            <button
              type="button"
              onClick={() => onMesChange(shiftMonth(mes, 1))}
              disabled={mes >= currentMonth()}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/12 bg-white/5 text-white/80 transition hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Días de la semana */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {DIAS_SEMANA_CORTO.map((dia, idx) => (
              <div
                key={dia}
                className={clsx(
                  "text-[10.5px] font-semibold",
                  idx >= 5 ? "text-white/40" : "text-white/60"
                )}
              >
                {dia}
              </div>
            ))}
          </div>

          {/* Rejilla de días */}
          <div className="grid grid-cols-7 gap-1">
            {celdas.map((celda, idx) => {
              if (!celda) {
                return <div key={`vacio-${idx}`} className="h-9 w-full" />;
              }

              const { fecha, dia } = celda;
              const fichado = diasFichados.has(fecha);
              const incompleto = diasIncompletos.has(fecha);
              const seleccionada = fecha === fechaSeleccionada;
              const esDiaHoy = fecha === hoy;

              return (
                <button
                  key={fecha}
                  type="button"
                  onClick={() => onSelectFecha(fecha)}
                  className={clsx(
                    "relative flex h-9 w-full flex-col items-center justify-center rounded-xl text-[12px] font-semibold transition-all active:scale-[0.95]",
                    seleccionada
                      ? "border border-[#d7dc9a] bg-[#d7dc9a]/25 text-white shadow-[0_0_10px_rgba(215,220,154,0.3)] font-bold"
                      : fichado
                        ? "border border-emerald-500/35 bg-emerald-500/15 text-white hover:bg-emerald-500/25"
                        : "border border-transparent bg-white/5 text-white/70 hover:bg-white/10 hover:text-white",
                    esDiaHoy && !seleccionada && "ring-1 ring-white/35"
                  )}
                >
                  <span>{dia}</span>

                  {/* Indicador de asistencia (punto verde) o incompleto (amarillo) */}
                  {fichado && (
                    <span
                      className={clsx(
                        "absolute bottom-1 h-1.5 w-1.5 rounded-full",
                        incompleto ? "bg-amber-400" : "bg-[#d7dc9a] shadow-[0_0_4px_#d7dc9a]"
                      )}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Leyenda rápida */}
          <div className="mt-3 flex items-center justify-center gap-4 border-t border-white/8 pt-2.5 text-[10.5px] text-white/65">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#d7dc9a]" />
              <span>{tr("Trabajado")}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full border border-white/40 bg-white/10" />
              <span>{tr("Sin fichar")}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              <span>{tr("Sin salida")}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
