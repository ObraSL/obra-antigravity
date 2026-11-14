"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Clock, LogIn, LogOut } from "lucide-react";
import { useObra } from "@/lib/obra-context";
import { useMiembro } from "@/lib/miembro-context";
import { createClient } from "@/lib/supabase/client";
import type { Fichaje } from "@/lib/types";
import { currentMonth, monthBounds, monthLabel, todayStr } from "@/lib/format";
import { fmtHoras, totalesFichajes } from "@/lib/horas";
import { HeroStatCard, StatCard } from "@/components/ui/Card";
import { NumeroGrande } from "@/components/ui/NumeroGrande";
import { tr } from "@/lib/i18n";

/**
 * Inicio de un trabajador: su obra, el avance general y sus horas. Nada de
 * dinero, presupuestos ni horas de los demás.
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
    <div>
      <div className="mb-5">
        <div className="font-display text-2xl font-bold uppercase text-obra-text">
          {obraActual.nombre}
        </div>
        {obraActual.direccion && (
          <div className="text-sm text-obra-text-faint">{obraActual.direccion}</div>
        )}
      </div>

      {avance != null && (
        <div className="mb-3.5 rounded-[20px] border border-obra-card-border bg-obra-card p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-obra-text-dim">
            {tr("Avance de la obra")}
          </div>
          <NumeroGrande valor={avance} />
        </div>
      )}

      <HeroStatCard
        label={tr("Mis horas · {mes}", { mes: monthLabel(currentMonth()) })}
        value={fmtHoras(mes.trabajados)}
        sub={mes.extra > 0 ? tr("{horas} extra", { horas: fmtHoras(mes.extra) }) : tr("Total del mes")}
        icon={<Clock size={16} />}
      />

      <div className="mt-3 grid grid-cols-3 gap-3">
        <StatCard label={tr("Entrada")} value={hoyFichaje?.hora_entrada || "—"} icon={<LogIn size={18} />} />
        <StatCard label={tr("Salida")} value={hoyFichaje?.hora_salida || "—"} icon={<LogOut size={18} />} />
        <StatCard label={tr("Días")} value={String(mes.dias)} icon={<Clock size={18} />} />
      </div>

      <Link
        href="/fichajes"
        className="mt-6 flex items-center justify-between rounded-2xl border border-obra-card-border bg-obra-card p-4 transition-colors hover:border-obra-text-faint"
      >
        <div className="flex items-center gap-2.5">
          <Clock size={18} className="text-obra-yellow" />
          <span className="text-[14.5px] font-semibold text-obra-text">
            {hoyFichaje?.hora_entrada && !hoyFichaje?.hora_salida
              ? tr("Marcar mi salida")
              : hoyFichaje?.hora_entrada
                ? tr("Mis horas de hoy")
                : tr("Marcar mi entrada")}
          </span>
        </div>
        <ArrowRight size={16} className="text-obra-text-faint" />
      </Link>
    </div>
  );
}
