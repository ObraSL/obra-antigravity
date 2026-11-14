"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { Clock, Receipt, Truck, ArrowRight, ArrowUpRight, Wallet } from "lucide-react";
import { useObra } from "@/lib/obra-context";
import { useMiembro } from "@/lib/miembro-context";
import { createClient } from "@/lib/supabase/client";
import type { PagadoPor, Tarea } from "@/lib/types";
import { avanceObraExacto, estadoTarea, rangoObra } from "@/lib/gantt";
import { minutosTrabajados } from "@/lib/horas";
import { pagadoPorMi, suma } from "@/lib/dinero";
import { Card, StatCard } from "@/components/ui/Card";
import { NumeroGrande } from "@/components/ui/NumeroGrande";
import { BarrasProgreso } from "@/components/ui/BarrasProgreso";
import { MiniGantt } from "@/components/planificacion/MiniGantt";
import { InicioTrabajador } from "@/components/inicio/InicioTrabajador";
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

  const mes = currentMonth();
  const gastosMes = gastos.filter((g) => g.fecha.slice(0, 7) === mes);
  const gastado = suma(gastos);
  const balance = Math.round((cobrado - gastado) * 100) / 100;
  const presupuesto = suma(tareas.map((t) => ({ importe: t.presupuesto })));
  const pctPresupuesto = presupuesto > 0 ? Math.round((gastado / presupuesto) * 100) : 0;

  const accesos = [
    { href: "/fichajes", label: "Fichajes", icon: Clock },
    ...(modulos.vehiculos ? [{ href: "/vehiculos", label: "Vehículos", icon: Truck }] : []),
    { href: "/gastos", label: "Gastos", icon: Receipt },
    ...(veDinero ? [{ href: "/dinero", label: "Dinero", icon: Wallet }] : []),
  ];

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

      {/* Portada: el avance en grande y las horas de las dos últimas semanas,
          como en la referencia de diseño. */}
      <div className="relative overflow-hidden rounded-[28px] border border-obra-card-border bg-obra-card p-5 shadow-[0_10px_30px_rgba(33,28,21,0.08)]">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(120% 140% at 100% 0%, rgba(242,133,27,0.16) 0%, rgba(214,73,31,0.07) 32%, transparent 62%)",
          }}
        />
        <div className="relative">
          <div className="text-xs font-semibold uppercase tracking-wide text-obra-text-dim">
            {tr("Avance de la obra")}
          </div>

          <div className="mt-2.5 flex items-start justify-between gap-3">
            <NumeroGrande valor={avance} />
            <Link
              href="/planificacion"
              className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-obra-nav-bg text-white"
              aria-label={tr("Ver la planificación")}
            >
              <ArrowUpRight size={17} />
            </Link>
          </div>

          {/* Sin plan el número sería un 0 sin explicación: mejor decir por qué. */}
          {tareas.length === 0 && (
            <Link
              href="/planificacion"
              className="mt-1.5 block text-[12.5px] font-semibold text-obra-yellow"
            >
              {tr("Todavía no hay plan — añádelo o tráelo del Excel")}
            </Link>
          )}

          {/* Con la obra recién abierta no hay ni una hora fichada y el
              gráfico salía como una raya plana, que parece un fallo. */}
          {horasDia.some((h) => h > 0) ? (
            <BarrasProgreso valores={horasDia} className="mt-4 h-[74px]" />
          ) : (
            <div className="mt-4 flex h-[74px] items-center justify-center rounded-xl border border-dashed border-obra-line text-[12.5px] text-obra-text-faint">
              {tr("Sin horas fichadas estas dos semanas")}
            </div>
          )}

          <div className="mt-2.5 flex items-end justify-between border-t border-obra-card-border pt-2.5">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-obra-text-faint">
                {rango ? tr("Fin previsto") : tr("Últimas 2 semanas")}
              </div>
              <div className="text-[13.5px] font-bold text-obra-text">
                {rango ? fmtDate(rango.hasta) : tr("Horas fichadas")}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-obra-text-faint">
                {tr("Horas del mes")}
              </div>
              <div className="text-[13.5px] font-bold text-obra-text">
                {Math.round(horasMes / 60)} h
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* La lista entera de capítulos se comía media portada. Ahora es una
          tarjeta pequeña con el plan en miniatura: de un toque se abre el
          Gantt completo. */}
      {tareas.length > 0 && rango && (
        <Link href="/planificacion" className="mt-3.5 block">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-obra-text-dim">
                {tr("Planificación")}
              </span>
              <ArrowRight size={15} className="text-obra-text-faint" />
            </div>
            <div className="mb-3 mt-1 text-[12.5px] text-obra-text-faint">
              {trN(tareas.length, "{n} capítulo", "{n} capítulos")} · {tr("hasta {fecha}", { fecha: fmtDate(rango.hasta) })}
              {retrasadas > 0 && (
                <span className="font-semibold text-obra-red"> · {tr("{n} con retraso", { n: retrasadas })}</span>
              )}
            </div>
            <MiniGantt tareas={tareas} hoy={hoy} />
          </Card>
        </Link>
      )}

      {/* El dinero de la obra entera (no solo del mes): cuánto ha pagado el
          cliente, cuánto se ha gastado —tickets y facturas juntos— y cómo va. */}
      <Link href={veDinero ? "/dinero" : "/gastos"} className="mt-3.5 block">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-obra-text-dim">
              {tr("Dinero de la obra")}
            </span>
            <ArrowRight size={15} className="text-obra-text-faint" />
          </div>

          {veDinero ? (
            <div className="mt-2.5 grid grid-cols-3 gap-2">
              <Cifra etiqueta={tr("Cobrado")} valor={fmtEURCorto(cobrado)} />
              <Cifra etiqueta={tr("Gastado")} valor={fmtEURCorto(gastado)} />
              <Cifra
                etiqueta={tr("Balance")}
                valor={`${balance >= 0 ? "+" : ""}${fmtEURCorto(balance)}`}
                color={balance >= 0 ? "text-obra-green" : "text-obra-red"}
              />
            </div>
          ) : (
            <div className="mt-1.5">
              <Cifra etiqueta={tr("Gastado en total")} valor={fmtEUR(gastado)} />
            </div>
          )}

          <div className="mt-2.5 border-t border-obra-card-border pt-2.5 text-[12.5px] text-obra-text-faint">
            {trJsx("Este mes: {importe}", {
              importe: <span className="font-semibold text-obra-text-dim">{fmtEUR(suma(gastosMes))}</span>,
            })}
            {pagadoPorMi(gastosMes) > 0 && (
              <>
                {" · "}
                {trJsx("pagado por ti {importe}", {
                  importe: <span className="font-semibold text-obra-yellow">{fmtEUR(pagadoPorMi(gastosMes))}</span>,
                })}
              </>
            )}
          </div>

          {presupuesto > 0 && (
            <div className="mt-2.5">
              <div className="flex items-center justify-between text-[11.5px] text-obra-text-faint">
                <span>{tr("Presupuesto {importe}", { importe: fmtEURCorto(presupuesto) })}</span>
                <span className={clsx("font-bold", pctPresupuesto > 100 ? "text-obra-red" : "text-obra-text-dim")}>
                  {tr("{pct}% gastado", { pct: pctPresupuesto })}
                </span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-obra-bg">
                <div
                  className={clsx("h-full rounded-full", pctPresupuesto > 100 ? "bg-obra-red" : "bg-obra-yellow")}
                  style={{ width: `${Math.min(100, pctPresupuesto)}%` }}
                />
              </div>
            </div>
          )}
        </Card>
      </Link>

      <div className={clsx("mt-3 grid gap-3", modulos.vehiculos ? "grid-cols-2" : "grid-cols-1")}>
        <StatCard
          label={tr("Fichados hoy")}
          value={fichadosHoy != null ? String(fichadosHoy) : "—"}
          icon={<Clock size={18} />}
        />
        {modulos.vehiculos && (
          <StatCard
            label={tr("Coches hoy")}
            value={cochesHoy != null ? String(cochesHoy) : "—"}
            icon={<Truck size={18} />}
          />
        )}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        {accesos.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="flex items-center justify-between rounded-2xl border border-obra-card-border bg-obra-card p-4 transition-colors hover:border-obra-text-faint"
          >
            <div className="flex items-center gap-2.5">
              <a.icon size={18} className="text-obra-yellow" />
              <span className="text-[14.5px] font-semibold text-obra-text">{tr(a.label)}</span>
            </div>
            <ArrowRight size={16} className="text-obra-text-faint" />
          </Link>
        ))}
      </div>
    </div>
  );
}

/** Una cifra pequeña con su etiqueta encima, para las tres del dinero. */
function Cifra({ etiqueta, valor, color }: { etiqueta: string; valor: string; color?: string }) {
  return (
    <div className="min-w-0">
      <div className="text-[10.5px] font-semibold uppercase tracking-wide text-obra-text-faint">{etiqueta}</div>
      <div className={clsx("truncate font-mono-obra text-[15px] font-bold", color ?? "text-obra-text")}>
        {valor}
      </div>
    </div>
  );
}
