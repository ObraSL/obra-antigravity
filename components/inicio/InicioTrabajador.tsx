"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Clock, LogIn, LogOut, MapPin, Mic, ShieldCheck } from "lucide-react";
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
  const { miembro, modulos } = useMiembro();
  const supabase = useMemo(() => createClient(), []);

  const [hoyFichaje, setHoyFichaje] = useState<Fichaje | null>(null);
  const [mes, setMes] = useState({ trabajados: 0, extra: 0, dias: 0 });
  const [avance, setAvance] = useState<number | null>(null);
  const [trabInfo, setTrabInfo] = useState<{ tipo_tarifa?: "hora" | "dia"; tarifa?: number | null } | null>(null);

  const trabajadorId = miembro?.trabajador_id ?? null;

  const cargar = useCallback(async () => {
    if (!trabajadorId) return;
    const { desde, hasta } = monthBounds(currentMonth());
    const [hoy, delMes, delTrab] = await Promise.all([
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
      supabase
        .from("trabajadores")
        .select("tipo_tarifa,tarifa")
        .eq("id", trabajadorId)
        .maybeSingle(),
    ]);

    setHoyFichaje((hoy.data?.[0] as Fichaje) ?? null);
    const filas = delMes.data ?? [];
    const t = totalesFichajes(filas, jornadaHoras);
    setMes({ trabajados: t.trabajados, extra: t.extra, dias: filas.length });
    if (delTrab.data) {
      setTrabInfo(delTrab.data as { tipo_tarifa?: "hora" | "dia"; tarifa?: number | null });
    }
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

  const tipoTarifa = trabInfo?.tipo_tarifa ?? "hora";
  const tarifa = trabInfo?.tarifa ?? null;
  let gananciasEstimadas: number | null = null;
  if (tarifa && tarifa > 0) {
    if (tipoTarifa === "dia") {
      gananciasEstimadas = mes.dias * tarifa;
    } else {
      gananciasEstimadas = Math.round((mes.trabajados / 60) * tarifa * 100) / 100;
    }
  }

  return (
    <div className="space-y-3.5 pb-28">
      {/* Banner de acceso a la Consola de Administración */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-[#d7dc9a]/35 bg-[#17201a]/90 p-3.5 backdrop-blur-md shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#d7dc9a]/18 text-[#d7dc9a]">
            <ShieldCheck size={18} strokeWidth={2.3} />
          </div>
          <div>
            <div className="text-xs font-bold text-white">{tr("Consola de Administración de la Plataforma")}</div>
            <div className="text-[11px] text-white/65">{tr("Gestiona las 3 empresas de prueba, códigos de licencia y suscripciones.")}</div>
          </div>
        </div>
        <Link
          href="/admin"
          className="flex items-center justify-center gap-1.5 rounded-xl bg-[#d7dc9a] px-3.5 py-2 text-xs font-bold text-[#141a16] shadow transition hover:bg-[#c8cd8b] active:scale-95 shrink-0"
        >
          <span>{tr("Abrir /admin")}</span>
          <ArrowRight size={13} />
        </Link>
      </div>

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
        <div className="flex items-baseline justify-between mt-2">
          <div className="font-mono-obra text-[38px] font-light tracking-tight text-white leading-none">
            {fmtHoras(mes.trabajados)}
          </div>
          {modulos.mostrar_ganancias && gananciasEstimadas !== null && (
            <div className="text-right">
              <div className="font-mono text-xl font-bold text-[#d7dc9a]">
                ~{Math.round(gananciasEstimadas)} €
              </div>
              <div className="text-[10px] uppercase font-bold text-white/50 tracking-wider">
                {tr("Ganancias estimadas")}
              </div>
            </div>
          )}
        </div>
        <div className="mt-2 text-[12px] text-white/50 flex items-center justify-between">
          <span>{mes.extra > 0 ? tr("{horas} extra", { horas: fmtHoras(mes.extra) }) : tr("Total del mes")}</span>
          {modulos.mostrar_ganancias && tarifa && (
            <span className="text-white/40 font-mono text-[11px]">
              {tipoTarifa === "dia" ? `${tarifa} € / ${tr("día")}` : `${tarifa} € / ${tr("hora")}`}
            </span>
          )}
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
        className="flex items-center justify-between rounded-[20px] border border-[#d7dc9a]/35 bg-gradient-to-r from-[#172019] to-[#141a16] p-4 shadow-lg backdrop-blur-xl transition hover:border-[#d7dc9a]/60 active:scale-[0.99]"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#d7dc9a]/15 text-[#d7dc9a] border border-[#d7dc9a]/30 shadow-sm">
            <Mic size={20} strokeWidth={2.4} />
          </div>
          <div>
            <div className="text-[14px] font-bold text-white flex items-center gap-2">
              <span>{tr("Dictar informe del día")}</span>
              <span className="rounded-full bg-[#d7dc9a]/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#d7dc9a]">
                IA
              </span>
            </div>
            <div className="text-[11.5px] text-white/50">
              {tr("Diario de obra con IA")}
            </div>
          </div>
        </div>
        <ArrowRight size={18} className="text-[#d7dc9a]" />
      </Link>
    </div>
  );
}
