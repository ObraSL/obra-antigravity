"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { Clock, Receipt, Truck, ArrowRight, ArrowUpRight, Wallet, TriangleAlert, ShieldCheck } from "lucide-react";
import { useObra } from "@/lib/obra-context";
import { useMiembro } from "@/lib/miembro-context";
import { createClient } from "@/lib/supabase/client";
import type { PagadoPor, Tarea } from "@/lib/types";
import { avanceObraExacto, estadoTarea, posicionDia, rangoObra } from "@/lib/gantt";
import { minutosTrabajados } from "@/lib/horas";
import { pagadoPorMi, suma } from "@/lib/dinero";
import { Card } from "@/components/ui/Card";
import { CifraAvance } from "@/components/marca/CifraAvance";
import { Varillas, varillasPresupuesto, type Varilla } from "@/components/marca/Varillas";
import { Medidor } from "@/components/marca/Medidor";
import { MiniGantt } from "@/components/planificacion/MiniGantt";
import { InicioTrabajador } from "@/components/inicio/InicioTrabajador";
import { FotoEdificio } from "@/components/ui/FotoEdificio";
import {
  fmtEUR,
  fmtEURCorto,
  todayStr,
  currentMonth,
  shiftDay,
  monthBounds,
  fmtDate,
} from "@/lib/format";
import { tr, trJsx, trN } from "@/lib/i18n";

export default function InicioPage() {
  const { esTrabajador } = useMiembro();
  return esTrabajador ? <InicioTrabajador /> : <InicioGestor />;
}

/** Días que se ven en el gráfico de barras de la portada. */
const DIAS_GRAFICO = 14;

type GastoCorto = { importe: number; pagado_por: PagadoPor; fecha: string };

function InicioGestor() {
  const { obraActual } = useObra();
  const { rol, modulos } = useMiembro();
  const supabase = useMemo(() => createClient(), []);
  // Lo que paga el cliente (y por tanto el balance) no lo ve el jefe de obra
  const veDinero = rol === "dueno" || rol === "manager";

  const [fichadosHoy, setFichadosHoy] = useState<number | null>(null);
  const [cochesHoy, setCochesHoy] = useState<number | null>(null);
  const [gastos, setGastos] = useState<GastoCorto[]>([]);
  const [cobrado, setCobrado] = useState(0);
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [horasDia, setHorasDia] = useState<number[]>(Array(DIAS_GRAFICO).fill(0));
  const [horasMes, setHorasMes] = useState(0);

  const hoy = todayStr();

  useEffect(() => {
    if (!obraActual) return;
    const mes = currentMonth();
    const desdeGrafico = shiftDay(hoy, -(DIAS_GRAFICO - 1));
    const { desde: mesDesde, hasta: mesHasta } = monthBounds(mes);

    (async () => {
      const [fichajes, usos, gastosObra, cobros, plan, jornadas] = await Promise.all([
        supabase
          .from("fichajes")
          .select("id", { count: "exact", head: true })
          .eq("obra_id", obraActual.id)
          .eq("fecha", hoy)
          .not("hora_entrada", "is", null),
        supabase
          .from("usos_vehiculo")
          .select("vehiculo_id")
          .eq("obra_id", obraActual.id)
          .eq("fecha", hoy),
        // Todos los gastos de la obra (con las facturas, que ya van dentro):
        // el total de la obra y, de ahí, lo del mes.
        supabase.from("gastos").select("importe,pagado_por,fecha").eq("obra_id", obraActual.id),
        veDinero
          ? supabase.from("cobros").select("importe").eq("obra_id", obraActual.id)
          : Promise.resolve({ data: [] as { importe: number }[] }),
        supabase
          .from("tareas")
          .select("*")
          .eq("obra_id", obraActual.id)
          .order("orden")
          .order("fecha_inicio"),
        // Horas fichadas de las últimas dos semanas: son las barras del gráfico
        supabase
          .from("fichajes")
          .select("fecha,hora_entrada,hora_salida")
          .eq("obra_id", obraActual.id)
          .gte("fecha", desdeGrafico),
      ]);

      setFichadosHoy(fichajes.count ?? 0);
      // Coches distintos que hoy han ido a esta obra (ya no se cuentan km)
      setCochesHoy(new Set((usos.data ?? []).map((u) => u.vehiculo_id)).size);
      setGastos(gastosObra.data ?? []);
      setCobrado(suma(cobros.data ?? []));
      setTareas(plan.data ?? []);

      const porDia = new Map<string, number>();
      let delMes = 0;
      for (const f of jornadas.data ?? []) {
        const min = minutosTrabajados(f.hora_entrada, f.hora_salida) ?? 0;
        porDia.set(f.fecha, (porDia.get(f.fecha) ?? 0) + min);
        if (f.fecha >= mesDesde && f.fecha < mesHasta) delMes += min;
      }
      const serie: number[] = [];
      for (let i = DIAS_GRAFICO - 1; i >= 0; i--) serie.push(porDia.get(shiftDay(hoy, -i)) ?? 0);
      setHorasDia(serie);
      setHorasMes(delMes);
    })();
  }, [obraActual, supabase, hoy, veDinero]);

  if (!obraActual) return null;

  const avance = avanceObraExacto(tareas);
  const rango = rangoObra(tareas);
  const retrasadas = tareas.filter((t) => estadoTarea(t, hoy) === "retrasada").length;
  const tiempo = rango
    ? (hoy < rango.desde ? 0 : hoy > rango.hasta ? 100 : Math.round(posicionDia(hoy, rango) ?? 0))
    : null;

  const maxHoras = Math.max(1, ...horasDia);
  const hayHoras = horasDia.some((h) => h > 0);
  const varillasHoras: Varilla[] = horasDia.map((min, i) => ({
    alto: min > 0 ? Math.max(0.12, min / maxHoras) : 0.05,
    tono: min === 0 ? "apagado" : i === horasDia.length - 1 ? "lima" : "blanco",
    titulo: `${Math.round(min / 60)}h`,
  }));

  const mes = currentMonth();
  const gastosMes = gastos.filter((g) => g.fecha.slice(0, 7) === mes);
  const gastado = suma(gastos);
  const balance = Math.round((cobrado - gastado) * 100) / 100;
  const presupuesto = suma(tareas.map((t) => ({ importe: t.presupuesto })));
  const pctPresupuesto = presupuesto > 0 ? Math.round((gastado / presupuesto) * 100) : 0;

  return (
    <div className="space-y-4">
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

      {/* Cabecera estilo Dribbble Screen 2: Active Projects + See More */}
      <div className="mb-2 mt-0.5 flex items-baseline justify-between px-1">
        <h1 className="text-[15px] font-medium tracking-tight text-white/90">
          {tr("Active Projects")}
        </h1>
        <Link
          href="/planificacion"
          className="text-[12.5px] font-normal text-white/65 transition hover:text-white"
        >
          {tr("See More")}
        </Link>
      </div>

      {/* Fotografía atmosférica de la obra con grúa torre y badge de estado */}
      <FotoEdificio
        prioritaria
        retrasadas={retrasadas}
        altura="h-[230px] sm:h-[260px]"
      />

      {/* Tarjeta principal ejecutiva en vidrio obsidiana táctico */}
      <div className="relative z-10 -mt-8 overflow-hidden rounded-[26px] border border-white/14 bg-[#141a16]/92 p-5 backdrop-blur-2xl shadow-[0_20px_48px_rgba(0,0,0,0.38)]">
        <div className="relative">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-[11.5px] font-semibold uppercase tracking-wider text-white/50">
                {tr("Avance de la obra")}
              </h2>
              <CifraAvance valor={avance} tamano="gigante" className="mt-1" />
            </div>
            <Link
              href="/planificacion"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#d7dc9a]/40 bg-[#d7dc9a] text-[#141a16] shadow-sm transition hover:bg-[#e4e8a8] active:scale-95"
              aria-label={tr("Ver la planificación")}
            >
              <ArrowUpRight size={20} strokeWidth={2.5} />
            </Link>
          </div>

          {/* Gráfico arquitectónico de varillas: horas reales trabajadas los últimos 14 días */}
          <div className="mt-5">
            {hayHoras ? (
              <Varillas
                varillas={varillasHoras}
                alto={68}
                grosor={0.48}
                resumen={`${tr("Últimas 2 semanas")}: ${tr("Horas fichadas")}`}
              />
            ) : (
              <div className="flex h-[68px] items-center justify-center rounded-xl border border-white/10 bg-white/5 px-3 text-center text-[12px] text-white/60">
                {tr("Sin horas fichadas estas dos semanas")}
              </div>
            )}
          </div>

          <div className="mt-3.5 flex items-end justify-between border-t border-white/10 pt-3 text-[12px]">
            <div className="min-w-0">
              <div className="text-white/50">
                {rango?.hasta ? tr("Fin previsto") : tr("Últimas 2 semanas")}
              </div>
              <div className="font-mono-obra font-semibold text-white mt-0.5">
                {rango?.hasta ? fmtDate(rango.hasta) : tr("Horas fichadas")}
              </div>
            </div>
            <div className="min-w-0 text-right">
              <div className="text-white/50">{tr("Horas del mes")}</div>
              <div className="font-mono-obra font-semibold text-white mt-0.5">
                {Math.round(horasMes / 60)} h
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Doble telemetría de precisión: Medidor semicircular de avance vs calendario + KPIs de equipo y alertas */}
      <div className="grid grid-cols-2 gap-3">
        {/* Medidor: arco de avance vs aguja de calendario */}
        <Link
          href="/planificacion"
          className="flex flex-col justify-between rounded-[22px] border border-white/12 bg-[#141a16]/85 p-3.5 backdrop-blur-xl shadow-lg transition hover:border-white/20 active:scale-[0.99]"
        >
          <div className="text-[11.5px] font-semibold text-white/60 truncate">
            {tr("Avance de la obra")}
          </div>
          <div className="my-1.5">
            <Medidor
              avance={avance}
              tiempo={tiempo ?? 0}
              titulo={`${tr("Avance de la obra")}: ${Math.round(avance)}% · ${tr("Tiempo transcurrido")}: ${tiempo ?? 0}%`}
              className="mx-auto max-w-[125px]"
            />
          </div>
          <div className="font-mono-obra flex items-center justify-center gap-2 text-[10.5px]">
            <span className="flex items-center gap-1 text-[#d7dc9a]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#d7dc9a]" />
              {tr("Avance {a} %", { a: Math.round(avance) })}
            </span>
            <span className="flex items-center gap-1 text-white/70">
              <span className="h-0.5 w-2 rounded-full bg-white" />
              {tr("Tiempo {t} %", { t: tiempo ?? 0 })}
            </span>
          </div>
        </Link>

        {/* KPIs operativos: Fichados hoy + Tareas con retraso */}
        <div className="grid grid-rows-2 gap-2.5">
          <Link
            href="/fichajes"
            className="flex items-center justify-between rounded-[20px] border border-white/12 bg-[#141a16]/85 px-3.5 py-2.5 backdrop-blur-xl shadow-lg transition hover:border-white/20 active:scale-[0.99]"
          >
            <div>
              <div className="text-[11px] font-medium text-white/60">{tr("Fichados hoy")}</div>
              <div className="font-mono-obra mt-0.5 text-[18px] font-bold text-white">
                {fichadosHoy != null ? fichadosHoy : "—"}
              </div>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-[#d7dc9a]">
              <Clock size={16} />
            </div>
          </Link>

          <Link
            href="/planificacion"
            className={clsx(
              "flex items-center justify-between rounded-[20px] border px-3.5 py-2.5 backdrop-blur-xl shadow-lg transition active:scale-[0.99]",
              retrasadas > 0
                ? "border-[#e0826d]/40 bg-[#e0826d]/10 hover:border-[#e0826d]/60"
                : "border-white/12 bg-[#141a16]/85 hover:border-white/20"
            )}
          >
            <div>
              <div className="text-[11px] font-medium text-white/60">{tr("Tareas con retraso")}</div>
              <div
                className={clsx(
                  "font-mono-obra mt-0.5 text-[18px] font-bold",
                  retrasadas > 0 ? "text-[#ffdad2]" : "text-white"
                )}
              >
                {retrasadas}
              </div>
            </div>
            <div
              className={clsx(
                "flex h-8 w-8 items-center justify-center rounded-xl border",
                retrasadas > 0
                  ? "border-[#e0826d]/40 bg-[#e0826d]/20 text-[#ffdad2]"
                  : "border-white/10 bg-white/5 text-white/60"
              )}
            >
              <TriangleAlert size={16} />
            </div>
          </Link>
        </div>
      </div>

      {/* Planificación en miniatura con MiniGantt */}
      {tareas.length > 0 && rango && (
        <Link href="/planificacion" className="block">
          <Card className="p-4 border-white/14 bg-[#141a16]/85 backdrop-blur-xl shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-white/60">
                {tr("Planificación")}
              </span>
              <ArrowRight size={15} className="text-white/40" />
            </div>
            <div className="mb-3 mt-1 text-[12.5px] text-white/55">
              {trN(tareas.length, "{n} capítulo", "{n} capítulos")} · {tr("hasta {fecha}", { fecha: fmtDate(rango.hasta) })}
              {retrasadas > 0 && (
                <span className="font-semibold text-[#ffdad2]"> · {tr("{n} con retraso", { n: retrasadas })}</span>
              )}
            </div>
            <MiniGantt tareas={tareas} hoy={hoy} />
          </Card>
        </Link>
      )}

      {/* Finanzas de la obra con regla de 40 varillas de presupuesto */}
      <Link href={veDinero ? "/dinero" : "/gastos"} className="block">
        <Card className="p-4 border-white/14 bg-[#141a16]/85 backdrop-blur-xl shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-white/60">
              {tr("Dinero de la obra")}
            </span>
            <ArrowRight size={15} className="text-white/40" />
          </div>

          {veDinero ? (
            <div className="mt-2.5 grid grid-cols-3 gap-2">
              <Cifra etiqueta={tr("Cobrado")} valor={fmtEURCorto(cobrado)} />
              <Cifra etiqueta={tr("Gastado")} valor={fmtEURCorto(gastado)} />
              <Cifra
                etiqueta={tr("Balance")}
                valor={`${balance >= 0 ? "+" : ""}${fmtEURCorto(balance)}`}
                color={balance >= 0 ? "text-[#d7dc9a]" : "text-[#ffdad2]"}
              />
            </div>
          ) : (
            <div className="mt-1.5">
              <Cifra etiqueta={tr("Gastado en total")} valor={fmtEUR(gastado)} />
            </div>
          )}

          <div className="mt-2.5 border-t border-white/10 pt-2.5 text-[12.5px] text-white/55">
            {trJsx("Este mes: {importe}", {
              importe: <span className="font-semibold text-white/80">{fmtEUR(suma(gastosMes))}</span>,
            })}
            {pagadoPorMi(gastosMes) > 0 && (
              <>
                {" · "}
                {trJsx("pagado por ti {importe}", {
                  importe: <span className="font-semibold text-[#d7dc9a]">{fmtEUR(pagadoPorMi(gastosMes))}</span>,
                })}
              </>
            )}
          </div>

          {presupuesto > 0 && (
            <div className="mt-3.5 border-t border-white/10 pt-3">
              <div className="flex items-center justify-between text-[11.5px] text-white/60">
                <span>{tr("Presupuesto {importe}", { importe: fmtEURCorto(presupuesto) })}</span>
                <span
                  className={clsx(
                    "font-mono-obra font-bold",
                    pctPresupuesto > 100 ? "text-[#ffdad2]" : "text-[#d7dc9a]"
                  )}
                >
                  {pctPresupuesto}% {tr("del presupuesto gastado")}
                </span>
              </div>
              <div className="mt-2">
                <Varillas
                  varillas={varillasPresupuesto(pctPresupuesto)}
                  alto={18}
                  grosor={0.5}
                  resumen={tr("Presupuesto")}
                />
              </div>
            </div>
          )}
        </Card>
      </Link>
    </div>
  );
}

function Cifra({
  etiqueta,
  valor,
  color,
}: {
  etiqueta: string;
  valor: string;
  color?: string;
}) {
  return (
    <div className="min-w-0">
      <div className="truncate text-[11px] font-medium text-white/55">{etiqueta}</div>
      <div className={clsx("font-mono-obra truncate text-base font-bold text-white", color)}>
        {valor}
      </div>
    </div>
  );
}
