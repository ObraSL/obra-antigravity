"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Clock, LogIn, LogOut, MapPin, Mic } from "lucide-react";
import { useObra } from "@/lib/obra-context";
import { useMiembro } from "@/lib/miembro-context";
import { createClient } from "@/lib/supabase/client";
import type { Fichaje } from "@/lib/types";
import { currentMonth, monthBounds, monthLabel, todayStr } from "@/lib/format";
import { fmtHoras, totalesFichajes } from "@/lib/horas";
import { CifraAvance } from "@/components/marca/CifraAvance";
import { tr } from "@/lib/i18n";

/**
 * Inicio de un trabajador: su obra, el avance arquitectónico y sus horas.
 * Diseño profesional de alta gama con vidrio obsidiana táctico.
 */
export function InicioTrabajador() {
  const { obraActual, jornadaHoras } = useObra();
  const { miembro } = useMiembro();
  const supabase = useMemo(() => createClient(), []);

  const [hoyFichaje, setHoyFichaje] = useState<Fichaje | null>(null);
  const [mes, setMes] = useState({ trabajados: 0, extra: 0, dias: 0 });
  const [avance, setAvance] = useState<number | null>(null);

  const trabajadorId = miembro?.trabajador_id ?? null;

  const cargar = useCallback(async () => {
    if (!trabajadorId) return;
    const { desde, hasta } = monthBounds(currentMonth());
    const [hoy, delMes] = await Promise.all([
      supabase
        .from("fichajes")
        .select("*")
        .eq("trabajador_id", trabajadorId)
        .eq("fecha", todayStr())
        .limit(1),
      supabase
        .from("fichajes")
        .select("hora_entrada,hora_salida")
        .eq("trabajador_id", trabajadorId)
        .gte("fecha", desde)
        .lt("fecha", hasta),
    ]);

    setHoyFichaje((hoy.data?.[0] as Fichaje) ?? null);
    const filas = delMes.data ?? [];
    const t = totalesFichajes(filas, jornadaHoras);
    setMes({ trabajados: t.trabajados, extra: t.extra, dias: filas.length });
  }, [trabajadorId, jornadaHoras, supabase]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  useEffect(() => {
    if (!obraActual) return;
    supabase
      .rpc("avance_obra", { o_id: obraActual.id })
      .then(({ data }) => setAvance(typeof data === "number" ? data : null));
  }, [obraActual, supabase]);

  if (!obraActual) return null;

  return (
    <div className="space-y-3.5">
      {/* Cabecera con datos de la obra */}
      <div className="mb-2 px-1">
        <h1 className="text-[20px] font-bold uppercase tracking-tight text-white">
          {obraActual.nombre}
        </h1>
        {obraActual.direccion && (
          <div className="mt-0.5 flex items-center gap-1.5 text-[12.5px] text-white/60">
            <MapPin size={13} className="shrink-0 text-white/50" />
            <span className="truncate">{obraActual.direccion}</span>
          </div>
        )}
      </div>

      {/* Tarjeta de avance arquitectónico */}
      {avance != null && (
        <div className="overflow-hidden rounded-[24px] border border-white/14 bg-[#141a16]/90 p-5 backdrop-blur-xl shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-white/50">
                {tr("Avance de la obra")}
              </div>
              <CifraAvance valor={avance} tamano="cifra" className="mt-1" />
            </div>
            <span className="flex items-center gap-1.5 rounded-full border border-[#d7dc9a]/30 bg-[#d7dc9a]/12 px-3 py-1 text-[11px] font-bold text-[#d7dc9a]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#d7dc9a] animate-pulse" />
              {tr("En plazo")}
            </span>
          </div>
          {/* Pista de progreso fina de alta precisión */}
          <div className="mt-3.5 h-1.5 w-full overflow-hidden rounded-full bg-white/12">
            <div
              className="h-full rounded-full bg-[#d7dc9a] transition-all duration-500"
              style={{ width: `${Math.max(2, Math.min(100, Math.round(avance)))}%` }}
            />
          </div>
        </div>
      )}

      {/* Tarjeta de horas mensuales del trabajador */}
      <div className="rounded-[24px] border border-white/14 bg-[#141a16]/90 p-5 backdrop-blur-xl shadow-lg">
        <div className="flex items-center justify-between">
          <span className="text-[12.5px] font-semibold text-white/60">
            {tr("Mis horas · {mes}", { mes: monthLabel(currentMonth()) })}
          </span>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-[#d7dc9a]">
            <Clock size={15} />
          </div>
        </div>
        <div className="font-mono-obra mt-2 text-[38px] font-light tracking-tight text-white leading-none">
          {fmtHoras(mes.trabajados)}
        </div>
        <div className="mt-1 text-[12px] text-white/50">
          {mes.extra > 0 ? tr("{horas} extra", { horas: fmtHoras(mes.extra) }) : tr("Total del mes")}
        </div>
      </div>

      {/* Grid de 3 KPIs de la jornada */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="rounded-[18px] border border-white/12 bg-[#141a16]/85 p-3 backdrop-blur-xl shadow-sm">
          <div className="flex items-center justify-between text-white/50">
            <span className="text-[11px] font-medium">{tr("Entrada")}</span>
            <LogIn size={13} className="text-[#d7dc9a]" />
          </div>
          <div className="font-mono-obra mt-1 text-[15px] font-semibold text-white">
            {hoyFichaje?.hora_entrada || "—"}
          </div>
        </div>

        <div className="rounded-[18px] border border-white/12 bg-[#141a16]/85 p-3 backdrop-blur-xl shadow-sm">
          <div className="flex items-center justify-between text-white/50">
            <span className="text-[11px] font-medium">{tr("Salida")}</span>
            <LogOut size={13} className="text-[#ffdad2]" />
          </div>
          <div className="font-mono-obra mt-1 text-[15px] font-semibold text-white">
            {hoyFichaje?.hora_salida || "—"}
          </div>
        </div>

        <div className="rounded-[18px] border border-white/12 bg-[#141a16]/85 p-3 backdrop-blur-xl shadow-sm">
          <div className="flex items-center justify-between text-white/50">
            <span className="text-[11px] font-medium">{tr("Días")}</span>
            <Clock size={13} className="text-white/60" />
          </div>
          <div className="font-mono-obra mt-1 text-[15px] font-semibold text-white">
            {mes.dias}
          </div>
        </div>
      </div>

      {/* Botón de acceso directo para fichar */}
      <Link
        href="/fichajes"
        className="flex items-center justify-between rounded-[20px] border border-[#d7dc9a]/35 bg-[#141a16]/95 p-4 shadow-lg backdrop-blur-xl transition hover:border-[#d7dc9a]/60 active:scale-[0.99]"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#d7dc9a] text-[#141a16] shadow-sm">
            <Clock size={18} strokeWidth={2.5} />
          </div>
          <div>
            <div className="text-[14px] font-bold text-white">
              {hoyFichaje?.hora_entrada && !hoyFichaje?.hora_salida
                ? tr("Marcar mi salida")
                : hoyFichaje?.hora_entrada
                  ? tr("Mis horas de hoy")
                  : tr("Marcar mi entrada")}
            </div>
            <div className="text-[11.5px] text-white/50">
              {todayStr()}
            </div>
          </div>
        </div>
        <ArrowRight size={18} className="text-[#d7dc9a]" />
      </Link>

      {/* Botón de informe de voz del día */}
      <Link
        href="/notas"
        className="flex items-center justify-between rounded-[20px] border border-white/12 bg-[#141a16]/85 p-4 shadow-lg backdrop-blur-xl transition hover:border-white/20 active:scale-[0.99]"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-[#d7dc9a] border border-white/10 shadow-sm">
            <Mic size={18} strokeWidth={2.2} />
          </div>
          <div>
            <div className="text-[14px] font-bold text-white">
              {tr("Dictar informe del día")}
            </div>
            <div className="text-[11.5px] text-white/50">
              {tr("Diario de obra con IA")}
            </div>
          </div>
        </div>
        <ArrowRight size={18} className="text-white/40" />
      </Link>
    </div>
  );
}
