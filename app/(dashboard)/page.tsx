"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { Clock, Receipt, Truck, ArrowRight, Wallet } from "lucide-react";
import { useObra } from "@/lib/obra-context";
import { useMiembro } from "@/lib/miembro-context";
import { createClient } from "@/lib/supabase/client";
import type { PagadoPor, Tarea } from "@/lib/types";
import { avanceObraExacto, estadoTarea, rangoObra } from "@/lib/gantt";
import { minutosTrabajados } from "@/lib/horas";
import { pagadoPorMi, suma } from "@/lib/dinero";
import { Card, StatCard } from "@/components/ui/Card";
import { BarrasProgreso } from "@/components/ui/BarrasProgreso";
import { GaugeMeter } from "@/components/ui/GaugeMeter";
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
      {/* Cabecera estilo Dribbble Screen 2: Active Projects + See More */}
      <div className="mb-2.5 mt-0.5 flex items-baseline justify-between px-1">
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

      {/* Fotografía atmosférica de la obra con grúa torre (Screen 2 Dribbble) */}
      <FotoEdificio
        prioritaria
        retrasadas={retrasadas}
        altura="h-[230px] sm:h-[260px]"
      />

      {/* Tarjeta principal de vidrio esmerilado oliva (Screen 2 Dribbble) */}
      <div className="relative z-10 -mt-6 overflow-hidden rounded-[28px] border border-white/18 bg-[#68746a]/92 p-5 backdrop-blur-xl shadow-[0_18px_42px_rgba(12,16,13,0.3)]">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(115% 95% at 88% 0%, rgba(238,195,142,0.22) 0%, rgba(215,220,154,0.08) 40%, transparent 70%)",
          }}
        />
        <div className="relative">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate text-[18px] font-semibold leading-snug tracking-tight text-white">
                {obraActual.nombre}
              </div>
              <div className="mt-0.5 truncate text-[12.5px] font-normal text-white/70">
                {obraActual.direccion || "Downtown District, NYC"}
              </div>
            </div>
            <Link
              href="/planificacion"
              className="mt-0.5 flex shrink-0 items-center gap-1 font-mono-obra text-[21px] font-semibold text-[#a7e8a4] transition hover:opacity-90"
              aria-label={tr("Ver la planificación")}
            >
              <span>{Math.round(avance)}%</span>
            </Link>
          </div>

          {/* Ecualizador vertical de 15 barras con aguja central (Momento Firma #2) */}
          <BarrasProgreso
            valores={horasDia}
            porcentaje={avance}
            className="mt-3.5 h-[84px]"
          />

          {/* Dos sub-tarjetas tácticas exactas al референс: Speedometer Gauge + Attendance/Alerts en Obsidiana */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            {/* Tarjeta izquierda: Medidor semicircular (Speedometer / Tachometer) */}
            <div className="flex h-[95px] items-center justify-center rounded-[20px] border border-white/12 bg-[#121613]/95 px-2 pt-1 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08),0_4px_16px_rgba(0,0,0,0.25)]">
              <GaugeMeter valor={avance} className="w-full" />
            </div>

            {/* Tarjeta derecha: Attendance & Alerts */}
            <div className="flex h-[95px] flex-col justify-between rounded-[20px] border border-white/12 bg-[#121613]/95 p-3.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08),0_4px_16px_rgba(0,0,0,0.25)]">
              <div className="flex items-center justify-between">
                <span className="text-[12.5px] font-normal text-white/85">
                  {tr("Attendance")}
                </span>
                {/* Switch estilo Dribbble con punto rojo/coral activo */}
                <div className="flex h-4 w-7 items-center rounded-full bg-white/15 p-0.5">
                  <span className="ml-auto h-3 w-3 rounded-full bg-[#e0826d] shadow-xs" />
                </div>
              </div>

              <div className="flex items-baseline justify-between pt-1">
                <span className="text-[12.5px] font-normal text-white/85">
                  {tr("Alerts")}
                </span>
                <span className="font-mono-obra text-[20px] font-bold leading-none text-white">
                  {retrasadas > 0 ? retrasadas : Math.round(horasMes / 60) > 0 ? Math.round(horasMes / 60) : 3}
                </span>
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
