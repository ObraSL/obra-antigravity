"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Users,
  Truck,
  Receipt,
  Banknote,
  Calendar,
  Camera,
  Package,
  Wrench,
  Fuel,
  Trash2,
  MoreHorizontal,
  Download,
  FileText,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import clsx from "clsx";
import { useObra } from "@/lib/obra-context";
import { createClient } from "@/lib/supabase/client";
import type { Fichaje, FichajeHistorial, Gasto, Obra, Trabajador, UsoVehiculo, Vehiculo } from "@/lib/types";
import { imprimirRegistroJornada } from "@/lib/exportar-pdf-jornada";
import { suma } from "@/lib/dinero";
import { CATEGORIAS_GASTO } from "@/lib/types";
import { currentMonth, fmtDate, fmtEUR, monthBounds, monthLabel, shiftMonth, weekdayShort } from "@/lib/format";
import { fmtHoras, minutosExtra, minutosTrabajados, totalesFichajes } from "@/lib/horas";
import { tituloGasto } from "@/lib/gastos";
import { IconButton } from "@/components/ui/Button";
import { Empty } from "@/components/ui/Empty";
import { Sheet } from "@/components/ui/Sheet";
import { ArchivoViewer } from "@/components/ui/ArchivoViewer";
import { PagadoPorBadge, totalPersonal } from "@/components/ui/PagadoPor";
import { tr, trJsx, trN } from "@/lib/i18n";

// Las facturas ya no son una pestaña: van dentro de los gastos.
type Section = "trabajadores" | "vehiculos" | "gastos";

const CATEGORIA_ICON: Record<string, LucideIcon> = {
  Material: Package,
  "Maquinaria / alquiler": Wrench,
  Combustible: Fuel,
  "Mano de obra externa": Users,
  Sueldos: Banknote,
  "Gestión de residuos": Trash2,
  Otros: MoreHorizontal,
};

const SECTIONS: { id: Section; label: string; icon: LucideIcon }[] = [
  { id: "trabajadores", label: "Trabajadores", icon: Users },
  { id: "vehiculos", label: "Vehículos", icon: Truck },
  { id: "gastos", label: "Gastos", icon: Receipt },
];

export default function ResumenPage() {
  const { obraActual, obras, jornadaHoras } = useObra();
  const supabase = useMemo(() => createClient(), []);

  const [month, setMonth] = useState(currentMonth());
  const [section, setSection] = useState<Section>("trabajadores");

  const [trabajadores, setTrabajadores] = useState<Trabajador[]>([]);
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [fichajesMes, setFichajesMes] = useState<Fichaje[]>([]);
  const [usosMes, setUsosMes] = useState<UsoVehiculo[]>([]);
  const [gastosMes, setGastosMes] = useState<Gasto[]>([]);
  const [historialMes, setHistorialMes] = useState<FichajeHistorial[]>([]);
  const [exportando, setExportando] = useState(false);

  const [detail, setDetail] = useState<
    | { type: "trabajador"; payload: Trabajador }
    | { type: "vehiculo"; payload: Vehiculo }
    | { type: "gastoCategoria"; payload: string }
    | null
  >(null);

  useEffect(() => {
    supabase.from("trabajadores").select("*").order("nombre").then(({ data }) => setTrabajadores(data ?? []));
    supabase.from("vehiculos").select("*").order("nombre").then(({ data }) => setVehiculos(data ?? []));
  }, [supabase]);

  useEffect(() => {
    if (!obraActual) return;
    const { desde, hasta } = monthBounds(month);

    supabase.from("fichajes").select("*").eq("obra_id", obraActual.id).gte("fecha", desde).lt("fecha", hasta)
      .then(({ data }) => setFichajesMes(data ?? []));
    supabase.from("usos_vehiculo").select("*").eq("obra_id", obraActual.id).gte("fecha", desde).lt("fecha", hasta)
      .then(({ data }) => setUsosMes(data ?? []));
    supabase.from("gastos").select("*").eq("obra_id", obraActual.id).gte("fecha", desde).lt("fecha", hasta)
      .then(({ data }) => setGastosMes(data ?? []));
    supabase.from("fichajes_historial").select("*").eq("obra_id", obraActual.id).gte("fecha", desde).lt("fecha", hasta)
      .then(({ data }) => setHistorialMes(data ?? []));
  }, [obraActual, month, supabase]);

  const exportar = async () => {
    if (!obraActual) return;
    setExportando(true);
    try {
      const { exportarResumenObra } = await import("@/lib/exportar-excel");
      exportarResumenObra({
        nombreObra: obraActual.nombre,
        mesLabel: monthLabel(month),
        fichajes: fichajesMes,
        trabajadores,
        gastos: gastosMes,
        usosVehiculo: usosMes,
        vehiculos,
        jornadaHoras,
        historial: historialMes,
      });
    } finally {
      setExportando(false);
    }
  };

  if (!obraActual) return null;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <IconButton onClick={() => setMonth(shiftMonth(month, -1))}><ChevronLeft size={18} /></IconButton>
        <div className="text-center">
          <div className="font-display text-lg font-bold text-obra-text sm:text-xl">{monthLabel(month)}</div>
          {month !== currentMonth() && (
            <button onClick={() => setMonth(currentMonth())} className="text-xs font-semibold text-obra-yellow">
              {tr("Mes actual")}
            </button>
          )}
        </div>
        <IconButton onClick={() => setMonth(shiftMonth(month, 1))} disabled={month >= currentMonth()}>
          <ChevronRight size={18} />
        </IconButton>
      </div>

      <button
        onClick={exportar}
        disabled={exportando}
        className="mb-4 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-obra-line py-2.5 text-[13px] font-semibold text-obra-text-dim"
      >
        <Download size={15} /> {tr("Exportar este mes a Excel")}
      </button>

      {/* Se envuelve en varias líneas en vez de deslizarse de lado: el
          arreglo del rebote del iPhone bloquea el gesto horizontal en toda
          la app, y así estas pestañas no lo necesitan para nada. */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        {SECTIONS.map((s) => {
          const active = section === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setSection(s.id)}
              className={clsx(
                "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-2 text-[12.5px] font-semibold",
                active ? "border-obra-yellow bg-obra-yellow/10 text-obra-yellow" : "border-obra-line text-obra-text-dim"
              )}
            >
              <s.icon size={13} /> {tr(s.label)}
            </button>
          );
        })}
      </div>

      {section === "trabajadores" && (
        <ResumenTrabajadores
          trabajadores={trabajadores}
          fichajesMes={fichajesMes}
          jornadaHoras={jornadaHoras}
          onOpen={(t) => setDetail({ type: "trabajador", payload: t })}
        />
      )}
      {section === "vehiculos" && (
        <ResumenVehiculos vehiculos={vehiculos} usosMes={usosMes} onOpen={(v) => setDetail({ type: "vehiculo", payload: v })} />
      )}
      {section === "gastos" && (
        <ResumenGastos gastosMes={gastosMes} onOpen={(c) => setDetail({ type: "gastoCategoria", payload: c })} />
      )}

      {detail?.type === "trabajador" && (
        <Sheet title={detail.payload.nombre} onClose={() => setDetail(null)}>
          <DetalleTrabajadorMes
            trabajador={detail.payload}
            trabajadorId={detail.payload.id}
            month={month}
            obras={obras}
            jornadaHoras={jornadaHoras}
            obraActualNombre={obraActual?.nombre}
          />
        </Sheet>
      )}
      {detail?.type === "vehiculo" && (
        <Sheet title={detail.payload.nombre} onClose={() => setDetail(null)}>
          <DetalleVehiculoMes
            vehiculoId={detail.payload.id}
            month={month}
            obras={obras}
            trabajadores={trabajadores}
          />
        </Sheet>
      )}
      {detail?.type === "gastoCategoria" && (
        <Sheet title={detail.payload} onClose={() => setDetail(null)}>
          <DetalleGastosCategoria registros={gastosMes.filter((g) => g.categoria === detail.payload).sort((a, b) => (a.fecha < b.fecha ? 1 : -1))} />
        </Sheet>
      )}
    </div>
  );
}

function ResumenTrabajadores({
  trabajadores,
  fichajesMes,
  jornadaHoras,
  onOpen,
}: {
  trabajadores: Trabajador[];
  fichajesMes: Fichaje[];
  jornadaHoras: number;
  onOpen: (t: Trabajador) => void;
}) {
  if (trabajadores.length === 0) return <Empty icon={Users} title={tr("Todavía no hay trabajadores")} />;
  const filas = trabajadores
    .map((t) => {
      const regs = fichajesMes.filter((f) => f.trabajador_id === t.id && f.hora_entrada);
      const { trabajados, extra, sinCerrar } = totalesFichajes(regs, jornadaHoras);
      return { t, dias: regs.length, trabajados, extra, sinCerrar };
    })
    .sort((a, b) => b.dias - a.dias);

  if (filas.every((f) => f.dias === 0)) return <Empty icon={Calendar} title={tr("Sin fichajes este mes")} sub={tr("Aquí verás cuántos días trabajó cada uno.")} />;

  return (
    <div className="flex flex-col gap-2">
      {filas.map(({ t, dias, trabajados, extra, sinCerrar }) => (
        <button key={t.id} onClick={() => onOpen(t)} className="flex items-center gap-2.5 rounded-xl border border-obra-card-border bg-obra-card p-3 text-left">
          <div className="min-w-0 flex-1">
            <div className="text-[15px] font-bold text-obra-text">{t.nombre}</div>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-obra-text-faint">
              <span>{trN(dias, "{n} día", "{n} días")}</span>
              {extra > 0 && (
                <span className="rounded-full bg-obra-yellow/12 px-2 py-0.5 text-[10.5px] font-bold text-obra-yellow">
                  {tr("+{horas} extra", { horas: fmtHoras(extra) })}
                </span>
              )}
              {sinCerrar > 0 && (
                <span className="text-obra-red-text">{tr("{n} sin salida", { n: sinCerrar })}</span>
              )}
            </div>
          </div>
          <div className="shrink-0 text-right">
            <div className={clsx("font-mono-obra text-lg font-bold", trabajados > 0 ? "text-obra-text" : "text-obra-text-faint")}>
              {trabajados > 0 ? fmtHoras(trabajados) : "—"}
            </div>
            <div className="text-[10.5px] text-obra-text-faint">{tr("trabajadas")}</div>
          </div>
        </button>
      ))}
    </div>
  );
}

/**
 * Detalle del mes de un trabajador. A diferencia del resto del resumen, aquí
 * se muestran TODAS las obras (no solo la seleccionada): así se ve dónde
 * estuvo cada día, que es justo lo que hace falta para pagar y controlar.
 */
function DetalleTrabajadorMes({
  trabajador,
  trabajadorId,
  month,
  obras,
  jornadaHoras,
  obraActualNombre,
}: {
  trabajador: Trabajador;
  trabajadorId: string;
  month: string;
  obras: Obra[];
  jornadaHoras: number;
  obraActualNombre?: string;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [registros, setRegistros] = useState<Fichaje[] | null>(null);

  useEffect(() => {
    const { desde, hasta } = monthBounds(month);
    supabase
      .from("fichajes")
      .select("*")
      .eq("trabajador_id", trabajadorId)
      .gte("fecha", desde)
      .lt("fecha", hasta)
      .order("fecha")
      .then(({ data }) => setRegistros(data ?? []));
  }, [trabajadorId, month, supabase]);

  if (registros === null) {
    return <div className="py-6 text-center text-sm text-obra-text-faint">{tr("Cargando…")}</div>;
  }
  if (registros.length === 0) return <Empty icon={Calendar} title={tr("Sin fichajes este mes")} />;

  const diasTrabajados = registros.filter((r) => r.hora_entrada).length;
  const nombreObra = (id: string) => obras.find((o) => o.id === id)?.nombre ?? tr("Otra obra");
  const { trabajados, extra, sinCerrar } = totalesFichajes(registros, jornadaHoras);

  return (
    <div>
      {/* Botón de exportación oficial PDF Registro de Jornada */}
      <button
        type="button"
        onClick={() => {
          imprimirRegistroJornada({
            empresaNombre: obraActualNombre || "Control de Obra S.L.",
            obraNombre: nombreObra(registros[0]?.obra_id || ""),
            trabajador,
            mes: month,
            fichajes: registros,
            jornadaHoras,
          });
        }}
        className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl border border-[#d7dc9a]/40 bg-[#d7dc9a]/16 py-2.5 text-[13px] font-bold text-[#d7dc9a] transition hover:bg-[#d7dc9a]/25 active:scale-[0.98]"
      >
        <FileText size={15} />
        <span>{tr("Descargar Registro de Jornada (PDF)")}</span>
      </button>

      <div className="mb-3 rounded-xl border border-obra-card-border bg-obra-card p-3">
        <div className="flex items-center justify-between text-[13px]">
          <span className="text-obra-text-dim">{trN(diasTrabajados, "{n} día", "{n} días")} · {tr("todas las obras")}</span>
          <span className="font-mono-obra font-bold text-obra-text">{fmtHoras(trabajados)}</span>
        </div>
        {extra > 0 && (
          <div className="mt-2 flex items-center justify-between border-t border-obra-card-border pt-2 text-[13px]">
            <span className="text-obra-text-dim">{tr("Horas extra")}</span>
            <span className="font-mono-obra font-bold text-obra-yellow">{fmtHoras(extra)}</span>
          </div>
        )}
        {sinCerrar > 0 && (
          <div className="mt-2 text-[11.5px] text-obra-red-text">
            {trN(sinCerrar, "{n} día sin hora de salida (no cuenta en el total)", "{n} días sin hora de salida (no cuenta en el total)")}
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        {registros.map((r) => {
          const min = minutosTrabajados(r.hora_entrada, r.hora_salida);
          const diaExtra = minutosExtra(min, jornadaHoras);
          return (
            <div key={r.id} className="flex items-center gap-2.5 rounded-[10px] border border-obra-card-border bg-obra-card p-2.5">
              <div className="w-[62px] shrink-0 font-mono-obra text-xs font-bold text-obra-text">{weekdayShort(r.fecha)}</div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-semibold text-obra-text">{nombreObra(r.obra_id)}</div>
                <div className="truncate text-[11.5px] text-obra-text-faint">
                  {r.hora_entrada || "—:—"}–{r.hora_salida || "—:—"}
                  {r.ubicacion ? ` · ${r.ubicacion}` : ""}
                </div>
              </div>
              <div className="shrink-0 text-right">
                <div className="font-mono-obra text-[12.5px] font-bold text-obra-text">{fmtHoras(min)}</div>
                {diaExtra > 0 && (
                  <div className="text-[10.5px] font-bold text-obra-yellow">+{fmtHoras(diaExtra)}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Coches: cuántos días se usó cada uno en esta obra. Ya no se cuentan km
 * (no se pueden leer de forma fiable): lo que importa es qué día y a qué obra.
 */
function ResumenVehiculos({ vehiculos, usosMes, onOpen }: { vehiculos: Vehiculo[]; usosMes: UsoVehiculo[]; onOpen: (v: Vehiculo) => void }) {
  if (vehiculos.length === 0) return <Empty icon={Truck} title={tr("Todavía no hay vehículos")} />;
  const filas = vehiculos
    .map((v) => ({ v, dias: new Set(usosMes.filter((u) => u.vehiculo_id === v.id).map((u) => u.fecha)).size }))
    .sort((a, b) => b.dias - a.dias);

  return (
    <div className="flex flex-col gap-2">
      {filas.map(({ v, dias }) => (
        <button key={v.id} onClick={() => onOpen(v)} className="flex items-center gap-2.5 rounded-xl border border-obra-card-border bg-obra-card p-3 text-left">
          <div className="min-w-0 flex-1">
            <div className="text-[15px] font-bold text-obra-text">{v.nombre}</div>
            <div className="mt-0.5 text-xs text-obra-text-faint">
              {dias > 0 ? tr("Toca para ver qué días y a qué obras") : tr("No se usó en esta obra este mes")}
            </div>
          </div>
          <div className="shrink-0 text-right">
            <div className={clsx("font-mono-obra text-lg font-bold", dias > 0 ? "text-obra-text" : "text-obra-text-faint")}>{dias}</div>
            <div className="text-[10.5px] text-obra-text-faint">{trN(dias, "día", "días")}</div>
          </div>
        </button>
      ))}
    </div>
  );
}

/**
 * El mes de un coche en TODAS las obras (como con los trabajadores): así se
 * ve de un vistazo por dónde anduvo cada día.
 */
function DetalleVehiculoMes({
  vehiculoId,
  month,
  obras,
  trabajadores,
}: {
  vehiculoId: string;
  month: string;
  obras: Obra[];
  trabajadores: Trabajador[];
}) {
  const supabase = useMemo(() => createClient(), []);
  const [registros, setRegistros] = useState<UsoVehiculo[] | null>(null);

  useEffect(() => {
    const { desde, hasta } = monthBounds(month);
    supabase
      .from("usos_vehiculo")
      .select("*")
      .eq("vehiculo_id", vehiculoId)
      .gte("fecha", desde)
      .lt("fecha", hasta)
      .order("fecha")
      .then(({ data }) => setRegistros(data ?? []));
  }, [vehiculoId, month, supabase]);

  if (registros === null) {
    return <div className="py-6 text-center text-sm text-obra-text-faint">{tr("Cargando…")}</div>;
  }
  if (registros.length === 0) return <Empty icon={Truck} title={tr("No se usó este mes")} />;

  const dias = new Set(registros.map((r) => r.fecha)).size;
  const nombreObra = (id: string) => obras.find((o) => o.id === id)?.nombre ?? tr("Otra obra");
  const conductor = (id: string | null) => trabajadores.find((t) => t.id === id)?.nombre;

  return (
    <div>
      <div className="mb-3 text-[13px] text-obra-text-dim">
        {trN(dias, "{n} día de uso", "{n} días de uso")} · {tr("todas las obras")}
      </div>
      <div className="flex flex-col gap-1.5">
        {registros.map((r) => (
          <div key={r.id} className="flex items-center gap-2.5 rounded-[10px] border border-obra-card-border bg-obra-card p-2.5">
            <div className="w-[62px] shrink-0 font-mono-obra text-xs font-bold text-obra-text">{weekdayShort(r.fecha)}</div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-semibold text-obra-text">{nombreObra(r.obra_id)}</div>
              <div className="truncate text-[11.5px] text-obra-text-faint">
                {[conductor(r.conductor_id), r.destino].filter(Boolean).join(" · ") || tr("Sin más datos")}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ResumenGastos({ gastosMes, onOpen }: { gastosMes: Gasto[]; onOpen: (categoria: string) => void }) {
  if (gastosMes.length === 0) return <Empty icon={Receipt} title={tr("Sin gastos este mes")} />;
  const total = suma(gastosMes);
  const porCategoria = CATEGORIAS_GASTO.map((cat) => {
    const registros = gastosMes.filter((g) => g.categoria === cat);
    const fechas = registros.map((g) => g.fecha).sort();
    return {
      cat,
      total: suma(registros),
      n: registros.length,
      desde: fechas[0],
      hasta: fechas[fechas.length - 1],
    };
  })
    .filter((c) => c.n > 0)
    .sort((a, b) => b.total - a.total);

  return (
    <div>
      <div className="mb-3.5 rounded-2xl border border-obra-card-border bg-obra-card p-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-obra-text-dim">{tr("Total del mes")}</div>
        <div className="font-mono-obra text-2xl font-bold text-obra-text">{fmtEUR(total)}</div>
        {totalPersonal(gastosMes) > 0 && (
          <div className="mt-2.5 flex items-center justify-between border-t border-obra-card-border pt-2.5 text-[13px]">
            <span className="text-obra-text-dim">{tr("Pagado por ti")}</span>
            <span className="font-mono-obra font-bold text-obra-yellow">{fmtEUR(totalPersonal(gastosMes))}</span>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-2">
        {porCategoria.map(({ cat, total: catTotal, n, desde, hasta }) => {
          const Icon = CATEGORIA_ICON[cat] ?? MoreHorizontal;
          const pct = total > 0 ? Math.round((catTotal / total) * 100) : 0;
          return (
            <button
              key={cat}
              onClick={() => onOpen(cat)}
              className="flex items-center gap-3 rounded-2xl border border-obra-card-border bg-obra-card p-3.5 text-left"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-obra-bg-elevated text-obra-yellow">
                <Icon size={17} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="truncate text-[14.5px] font-bold text-obra-text">{tr(cat)}</div>
                  <div className="shrink-0 font-mono-obra text-[15px] font-bold text-obra-text">{fmtEUR(catTotal)}</div>
                </div>
                <div className="mt-1 flex items-center justify-between gap-2 text-xs text-obra-text-faint">
                  <span className="truncate">
                    {desde === hasta ? fmtDate(desde) : `${fmtDate(desde)} – ${fmtDate(hasta)}`} · {trN(n, "{n} gasto", "{n} gastos")}
                  </span>
                  <span className="shrink-0 font-mono-obra">{pct}%</span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-obra-bg-elevated">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-obra-yellow-dim to-obra-yellow"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DetalleGastosCategoria({ registros }: { registros: Gasto[] }) {
  const total = suma(registros);
  const [recibo, setRecibo] = useState<Gasto | null>(null);

  return (
    <div>
      <div className="mb-3 text-xs text-obra-text-dim">
        {trJsx("Total: {importe}", { importe: <b className="text-obra-text">{fmtEUR(total)}</b> })} ·{" "}
        {trN(registros.length, "{n} gasto", "{n} gastos")}
      </div>
      <div className="flex flex-col gap-1.5">
        {registros.map((g) => (
          <button
            key={g.id}
            onClick={() => g.recibo_path && setRecibo(g)}
            disabled={!g.recibo_path}
            className="flex items-center gap-2.5 rounded-[10px] border border-obra-card-border bg-obra-card p-2.5 text-left"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <div className="truncate text-[13.5px] font-semibold text-obra-text">{tituloGasto(g)}</div>
                {g.recibo_path && <Camera size={12} className="shrink-0 text-obra-yellow" />}
              </div>
              <div className="mt-px flex items-center gap-1.5 text-[11.5px] text-obra-text-faint">
                <span>{fmtDate(g.fecha)}</span>
                <PagadoPorBadge pagadoPor={g.pagado_por} />
              </div>
            </div>
            <div className="shrink-0 font-mono-obra text-[13.5px] font-bold text-obra-text">{fmtEUR(g.importe)}</div>
          </button>
        ))}
      </div>

      {recibo?.recibo_path && (
        <Sheet title={tr("Recibo")} onClose={() => setRecibo(null)}>
          <div className="mb-3 text-sm text-obra-text-dim">
            <span className="font-semibold text-obra-text">{tituloGasto(recibo)}</span> · {fmtDate(recibo.fecha)} · {fmtEUR(recibo.importe)}
          </div>
          <ArchivoViewer path={recibo.recibo_path} tipo={recibo.recibo_tipo} />
        </Sheet>
      )}
    </div>
  );
}

