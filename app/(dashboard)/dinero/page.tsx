"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { Banknote, FileText, Loader2, Plus, Trash2, Wallet } from "lucide-react";
import { useObra } from "@/lib/obra-context";
import { useMiembro } from "@/lib/miembro-context";
import { createClient } from "@/lib/supabase/client";
import type { Cobro, Entrega, PagadoPor } from "@/lib/types";
import { fmtDate, fmtEUR, todayStr } from "@/lib/format";
import { balanceObra, miCaja, suma } from "@/lib/dinero";
import { Card } from "@/components/ui/Card";
import { Empty } from "@/components/ui/Empty";
import { Field, Input, Select } from "@/components/ui/Field";
import { PrimaryButton } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { ArchivoViewer } from "@/components/ui/ArchivoViewer";
import {
  BUCKET_DOCUMENTOS,
  SelectorArchivo,
  subirArchivo,
  type ArchivoElegido,
} from "@/components/ui/SelectorArchivo";
import { useEnRefresco } from "@/components/layout/PullToRefresh";
import { tr } from "@/lib/i18n";

type GastoCorto = { importe: number; pagado_por: PagadoPor; obra_id: string };

/**
 * El dinero, en dos cuentas que no hay que mezclar:
 *
 *  - La OBRA: lo que ha pagado el cliente − todo lo gastado en ella.
 *    ¿La obra va en positivo o en negativo?
 *  - MI CAJA (solo el dueño): lo que le ha dado el jefe − lo que ha pagado
 *    él de su mano, en todas las obras. "Me quedan 400 € para gastos", o
 *    "la empresa me debe 300 €".
 */
export default function DineroPage() {
  const { rol } = useMiembro();

  // Lo cobrado es el margen de la obra: el jefe de obra no lo ve (tampoco
  // la base de datos se lo daría).
  if (rol === "jefe_obra") {
    return (
      <Empty
        icon={Wallet}
        title={tr("Solo para el dueño y el manager")}
        sub={tr("Aquí se ve lo que paga el cliente y lo que queda en la obra.")}
      />
    );
  }
  return <Dinero />;
}

function Dinero() {
  const { obraActual, obras } = useObra();
  const { esDueno, miembro, modulos } = useMiembro();
  // La caja del jefe (Ajustes → Módulos) es solo cosa del dueño.
  const conCaja = esDueno && modulos.caja_jefe;
  const supabase = useMemo(() => createClient(), []);

  const [pestana, setPestana] = useState<"cliente" | "jefe">("cliente");
  const [cobros, setCobros] = useState<Cobro[]>([]);
  const [gastosObra, setGastosObra] = useState<GastoCorto[]>([]);
  const [presupuesto, setPresupuesto] = useState(0);
  const [entregas, setEntregas] = useState<Entrega[]>([]);
  const [pagadoPorMiTodas, setPagadoPorMiTodas] = useState<GastoCorto[]>([]);
  const [anadiendo, setAnadiendo] = useState<"cobro" | "entrega" | null>(null);
  const [viendoCobro, setViendoCobro] = useState<Cobro | null>(null);

  const cargar = useCallback(async () => {
    if (!obraActual) return;
    const [c, g, t] = await Promise.all([
      supabase.from("cobros").select("*").eq("obra_id", obraActual.id).order("fecha", { ascending: false }),
      supabase.from("gastos").select("importe,pagado_por,obra_id").eq("obra_id", obraActual.id),
      supabase.from("tareas").select("presupuesto").eq("obra_id", obraActual.id),
    ]);
    setCobros(c.data ?? []);
    setGastosObra(g.data ?? []);
    setPresupuesto(suma((t.data ?? []).map((x) => ({ importe: x.presupuesto }))));

    if (esDueno) {
      // La caja es de todas las obras juntas: el jefe da el dinero a la
      // persona, no a una obra.
      const [e, p] = await Promise.all([
        supabase.from("entregas").select("*").order("fecha", { ascending: false }),
        supabase.from("gastos").select("importe,pagado_por,obra_id").eq("pagado_por", "personal"),
      ]);
      setEntregas(e.data ?? []);
      setPagadoPorMiTodas(p.data ?? []);
    }
  }, [obraActual, esDueno, supabase]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  useEnRefresco(cargar);

  if (!obraActual) return null;

  const obra = balanceObra(cobros, gastosObra);
  const caja = miCaja(entregas, pagadoPorMiTodas);
  // Entregas del jefe apuntadas a esta obra: movimiento interno de caja
  // (se muestra aparte para no alterar el balance real Cobrado − Gastado).
  const recibidoObra = esDueno ? suma(entregas.filter((e) => e.obra_id === obraActual.id)) : 0;
  const balanceTotal = obra.balance;
  const pctPresupuesto = presupuesto > 0 ? Math.round((obra.gastado / presupuesto) * 100) : 0;
  const nombreObra = (id: string | null) => obras.find((o) => o.id === id)?.nombre;

  const borrarCobro = async (c: Cobro) => {
    if (c.archivo_path) await supabase.storage.from(BUCKET_DOCUMENTOS).remove([c.archivo_path]);
    await supabase.from("cobros").delete().eq("id", c.id);
    setViendoCobro(null);
    await cargar();
  };

  const borrarEntrega = async (e: Entrega) => {
    await supabase.from("entregas").delete().eq("id", e.id);
    await cargar();
  };

  // Lo pagado por mí, obra por obra: para saber de dónde sale el total
  const pagadoPorObra = obras
    .map((o) => ({
      nombre: o.nombre,
      total: suma(pagadoPorMiTodas.filter((g) => g.obra_id === o.id)),
    }))
    .filter((x) => x.total > 0)
    .sort((a, b) => b.total - a.total);

  return (
    <div>
      {/* ----- La obra ----- */}
      <Card className="p-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-obra-text-dim">
          {tr("Esta obra ·")} <span className="normal-case">{obraActual.nombre}</span>
        </div>
        <div className="mt-2.5 flex flex-col gap-1.5 text-[13.5px]">
          <Linea texto={tr("Cobrado del cliente")} valor={obra.cobrado} />
          <Linea texto={tr("Gastado")} valor={obra.gastado} />
        </div>
        <div className="mt-2.5 flex items-baseline justify-between border-t border-obra-card-border pt-2.5">
          <span className="text-[13.5px] font-semibold text-obra-text-dim">
            {balanceTotal >= 0 ? tr("La obra va en positivo") : tr("La obra va en negativo")}
          </span>
          <span
            className={clsx(
              "font-mono-obra text-xl font-bold",
              balanceTotal >= 0 ? "text-obra-green" : "text-obra-red"
            )}
          >
            {balanceTotal >= 0 ? "+" : ""}
            {fmtEUR(balanceTotal)}
          </span>
        </div>

        {conCaja && recibidoObra > 0 && (
          <div className="mt-2 border-t border-obra-card-border pt-2 text-[12.5px]">
            <Linea texto={tr("Recibido del jefe (esta obra)")} valor={recibidoObra} />
          </div>
        )}

        {presupuesto > 0 && (
          <div className="mt-3 border-t border-obra-card-border pt-2.5">
            <div className="flex items-center justify-between text-[12px] text-obra-text-faint">
              <span>{tr("Presupuesto del plan · {importe}", { importe: fmtEUR(presupuesto) })}</span>
              <span className={clsx("font-bold", pctPresupuesto > 100 ? "text-obra-red" : "text-obra-text-dim")}>
                {tr("{pct}% gastado", { pct: pctPresupuesto })}
              </span>
            </div>
            <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-obra-bg">
              <div
                className={clsx("h-full rounded-full", pctPresupuesto > 100 ? "bg-obra-red" : "bg-obra-yellow")}
                style={{ width: `${Math.min(100, pctPresupuesto)}%` }}
              />
            </div>
          </div>
        )}
      </Card>

      {/* ----- Mi caja (solo el dueño) ----- */}
      {conCaja && (
        <Card className="mt-3 p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-obra-text-dim">
            {tr("Mi caja ·")} <span className="normal-case">{tr("todas las obras")}</span>
          </div>
          <div className="mt-2.5 flex flex-col gap-1.5 text-[13.5px]">
            <Linea texto={tr("Me ha dado el jefe")} valor={caja.recibido} />
            <Linea texto={tr("He pagado yo")} valor={caja.pagado} />
          </div>
          <div className="mt-2.5 flex items-baseline justify-between border-t border-obra-card-border pt-2.5">
            <span className="text-[13.5px] font-semibold text-obra-text-dim">
              {caja.queda >= 0 ? tr("Me quedan para gastos") : tr("La empresa me debe")}
            </span>
            <span
              className={clsx(
                "font-mono-obra text-xl font-bold",
                caja.queda >= 0 ? "text-obra-text" : "text-obra-red"
              )}
            >
              {fmtEUR(Math.abs(caja.queda))}
            </span>
          </div>
        </Card>
      )}

      {/* ----- Pestañas ----- */}
      {conCaja && (
        <div className="mb-3 mt-4 flex gap-1.5">
          {(
            [
              { id: "cliente", label: "Del cliente", icon: Banknote },
              { id: "jefe", label: "Del jefe", icon: Wallet },
            ] as const
          ).map((p) => (
            <button
              key={p.id}
              onClick={() => setPestana(p.id)}
              className={clsx(
                "flex flex-1 items-center justify-center gap-1.5 rounded-full border py-2 text-[12.5px] font-semibold",
                pestana === p.id
                  ? "border-obra-yellow bg-obra-yellow/10 text-obra-yellow"
                  : "border-obra-line text-obra-text-dim"
              )}
            >
              <p.icon size={13} /> {tr(p.label)}
            </button>
          ))}
        </div>
      )}

      {(pestana === "cliente" || !conCaja) && (
        <div className={conCaja ? "" : "mt-4"}>
          <PrimaryButton onClick={() => setAnadiendo("cobro")} className="mb-3.5">
            <Plus size={16} /> {tr("Añadir lo que ha pagado el cliente")}
          </PrimaryButton>
          {cobros.length === 0 ? (
            <Empty
              icon={Banknote}
              title={tr("Sin cobros en esta obra")}
              sub={tr("Apunta aquí cada pago del cliente para ver cómo va la obra.")}
            />
          ) : (
            <div className="flex flex-col gap-2">
              {cobros.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setViendoCobro(c)}
                  className="flex items-center gap-2.5 rounded-xl border border-obra-card-border bg-obra-card p-3 text-left"
                >
                  <div className="h-full w-[3px] self-stretch rounded bg-obra-green" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <div className="truncate text-[14.5px] font-semibold text-obra-text">
                        {c.concepto || tr("Pago del cliente")}
                      </div>
                      {c.archivo_path && <FileText size={13} className="shrink-0 text-obra-green" />}
                    </div>
                    <div className="mt-0.5 text-xs text-obra-text-faint">{fmtDate(c.fecha)}</div>
                  </div>
                  <div className="shrink-0 font-mono-obra text-[15px] font-bold text-obra-green">
                    +{fmtEUR(c.importe)}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {pestana === "jefe" && conCaja && (
        <div>
          <PrimaryButton onClick={() => setAnadiendo("entrega")} className="mb-3.5">
            <Plus size={16} /> {tr("Añadir dinero que me dio el jefe")}
          </PrimaryButton>
          {entregas.length === 0 ? (
            <Empty
              icon={Wallet}
              title={tr("Sin entregas apuntadas")}
              sub={tr("Cada vez que el jefe te dé dinero para gastos o sueldos, apúntalo aquí.")}
            />
          ) : (
            <div className="flex flex-col gap-2">
              {entregas.map((e) => (
                <FilaEntrega
                  key={e.id}
                  entrega={e}
                  obra={nombreObra(e.obra_id)}
                  onBorrar={() => borrarEntrega(e)}
                />
              ))}
            </div>
          )}

          {pagadoPorObra.length > 0 && (
            <div className="mt-5">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-obra-text-dim">
                {tr("Lo que he pagado yo, por obra")}
              </div>
              <div className="flex flex-col gap-1.5">
                {pagadoPorObra.map((p) => (
                  <div
                    key={p.nombre}
                    className="flex items-center justify-between rounded-xl bg-obra-bg px-3.5 py-2.5 text-[13px]"
                  >
                    <span className="truncate text-obra-text-dim">{p.nombre}</span>
                    <span className="shrink-0 font-mono-obra font-bold text-obra-text">{fmtEUR(p.total)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-1.5 text-[11.5px] text-obra-text-faint">
                {tr("Para ver cada ticket: en «Gastos» de esa obra, toca «Pagué yo».")}
              </div>
            </div>
          )}
        </div>
      )}

      {anadiendo === "cobro" && (
        <Sheet title={tr("Pago del cliente")} onClose={() => setAnadiendo(null)}>
          <CobroForm
            obraId={obraActual.id}
            supabase={supabase}
            onGuardado={async () => {
              setAnadiendo(null);
              await cargar();
            }}
          />
        </Sheet>
      )}

      {anadiendo === "entrega" && miembro && (
        <Sheet title={tr("Dinero del jefe")} onClose={() => setAnadiendo(null)}>
          <EntregaForm
            ownerId={miembro.user_id}
            obras={obras}
            supabase={supabase}
            onGuardado={async () => {
              setAnadiendo(null);
              await cargar();
            }}
          />
        </Sheet>
      )}

      {viendoCobro && (
        <Sheet title={tr("Pago del cliente")} onClose={() => setViendoCobro(null)}>
          <DetalleCobro cobro={viendoCobro} onBorrar={() => borrarCobro(viendoCobro)} />
        </Sheet>
      )}
    </div>
  );
}

function Linea({ texto, valor }: { texto: string; valor: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-obra-text-dim">{texto}</span>
      <span className="font-mono-obra font-bold text-obra-text">{fmtEUR(valor)}</span>
    </div>
  );
}

function FilaEntrega({
  entrega,
  obra,
  onBorrar,
}: {
  entrega: Entrega;
  obra: string | undefined;
  onBorrar: () => void;
}) {
  const [confirm, setConfirm] = useState(false);
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-obra-card-border bg-obra-card p-3">
      <div className="h-full w-[3px] self-stretch rounded bg-obra-yellow" />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[14.5px] font-semibold text-obra-text">
          {entrega.concepto || tr("Dinero para gastos")}
        </div>
        <div className="mt-0.5 truncate text-xs text-obra-text-faint">
          {fmtDate(entrega.fecha)}
          {obra ? ` · ${obra}` : ""}
        </div>
      </div>
      <div className="shrink-0 font-mono-obra text-[15px] font-bold text-obra-text">{fmtEUR(entrega.importe)}</div>
      {!confirm ? (
        <button onClick={() => setConfirm(true)} className="p-1 text-obra-text-faint" aria-label={tr("Borrar")}>
          <Trash2 size={15} />
        </button>
      ) : (
        <button onClick={onBorrar} className="p-1 text-[11px] font-bold text-obra-red">
          {tr("Borrar")}
        </button>
      )}
    </div>
  );
}

function DetalleCobro({ cobro, onBorrar }: { cobro: Cobro; onBorrar: () => void }) {
  const [confirm, setConfirm] = useState(false);
  return (
    <div>
      <div className="mb-3.5 flex justify-between gap-3">
        <div className="min-w-0">
          <div className="text-base font-bold text-obra-text">{cobro.concepto || tr("Pago del cliente")}</div>
          <div className="mt-0.5 text-xs text-obra-text-faint">{fmtDate(cobro.fecha)}</div>
        </div>
        <div className="shrink-0 font-mono-obra text-lg font-bold text-obra-green">+{fmtEUR(cobro.importe)}</div>
      </div>

      {cobro.archivo_path && (
        <div className="mb-4">
          <ArchivoViewer path={cobro.archivo_path} tipo={cobro.archivo_tipo} bucket={BUCKET_DOCUMENTOS} />
        </div>
      )}

      {!confirm ? (
        <button
          onClick={() => setConfirm(true)}
          className="flex w-full items-center justify-center gap-1.5 py-2 text-[13px] font-semibold text-obra-text-faint"
        >
          <Trash2 size={14} /> {tr("Borrar este pago")}
        </button>
      ) : (
        <button
          onClick={onBorrar}
          className="w-full rounded-xl bg-obra-red-bg py-2.5 text-[13px] font-bold text-obra-red"
        >
          {tr("Toca otra vez para borrarlo de verdad")}
        </button>
      )}
    </div>
  );
}

function CobroForm({
  obraId,
  supabase,
  onGuardado,
}: {
  obraId: string;
  supabase: ReturnType<typeof createClient>;
  onGuardado: () => void;
}) {
  const [importe, setImporte] = useState("");
  const [fecha, setFecha] = useState(todayStr());
  const [concepto, setConcepto] = useState("");
  const [archivo, setArchivo] = useState<ArchivoElegido | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const guardar = async () => {
    setGuardando(true);
    setError("");
    let archivo_path: string | null = null;
    if (archivo) {
      const subida = await subirArchivo(supabase, obraId, "cobros", archivo);
      if ("error" in subida) {
        setError(tr("No se pudo subir el archivo ({detalle}).", { detalle: subida.error }));
        setGuardando(false);
        return;
      }
      archivo_path = subida.path;
    }
    const { error: err } = await supabase.from("cobros").insert({
      obra_id: obraId,
      importe: Number(importe),
      fecha,
      concepto: concepto.trim() || null,
      archivo_path,
      archivo_tipo: archivo?.type ?? null,
    });
    if (err) {
      if (archivo_path) await supabase.storage.from(BUCKET_DOCUMENTOS).remove([archivo_path]);
      setError(err.message);
      setGuardando(false);
      return;
    }
    setGuardando(false);
    onGuardado();
  };

  return (
    <div>
      <Field label={tr("Importe (€)")}>
        <Input
          autoFocus
          type="number"
          inputMode="decimal"
          min={0}
          step="0.01"
          value={importe}
          onChange={(e) => setImporte(e.target.value)}
          placeholder="0,00"
        />
      </Field>
      <Field label={tr("Fecha")}>
        <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} max={todayStr()} />
      </Field>
      <Field label={tr("Concepto (opcional)")}>
        <Input
          value={concepto}
          onChange={(e) => setConcepto(e.target.value)}
          placeholder={tr("Ej. Primera certificación, anticipo…")}
        />
      </Field>
      <Field label={tr("Justificante (opcional)")}>
        <SelectorArchivo archivo={archivo} onChange={setArchivo} />
      </Field>
      {error && <div className="mb-3.5 text-xs text-obra-red-text">{error}</div>}
      <PrimaryButton disabled={!(Number(importe) > 0) || guardando} onClick={guardar}>
        {guardando && <Loader2 size={16} className="animate-spin" />} {tr("Guardar pago")}
      </PrimaryButton>
    </div>
  );
}

function EntregaForm({
  ownerId,
  obras,
  supabase,
  onGuardado,
}: {
  ownerId: string;
  obras: { id: string; nombre: string }[];
  supabase: ReturnType<typeof createClient>;
  onGuardado: () => void;
}) {
  const [importe, setImporte] = useState("");
  const [fecha, setFecha] = useState(todayStr());
  const [concepto, setConcepto] = useState("");
  const [obraId, setObraId] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const guardar = async () => {
    setGuardando(true);
    setError("");
    const { error: err } = await supabase.from("entregas").insert({
      owner_id: ownerId,
      importe: Number(importe),
      fecha,
      concepto: concepto.trim() || null,
      obra_id: obraId || null,
    });
    if (err) {
      setError(err.message);
      setGuardando(false);
      return;
    }
    setGuardando(false);
    onGuardado();
  };

  return (
    <div>
      <Field label={tr("Importe (€)")}>
        <Input
          autoFocus
          type="number"
          inputMode="decimal"
          min={0}
          step="0.01"
          value={importe}
          onChange={(e) => setImporte(e.target.value)}
          placeholder="0,00"
        />
      </Field>
      <Field label={tr("Fecha")}>
        <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} max={todayStr()} />
      </Field>
      <Field label={tr("Concepto (opcional)")}>
        <Input
          value={concepto}
          onChange={(e) => setConcepto(e.target.value)}
          placeholder={tr("Ej. Para gastos, sueldos de la semana…")}
        />
      </Field>
      {/* El dinero del jefe es general: la obra solo si ayuda a acordarse. */}
      <Field label={tr("Obra (opcional)")}>
        <Select value={obraId} onChange={(e) => setObraId(e.target.value)}>
          <option value="">{tr("— En general, no de una obra —")}</option>
          {obras.map((o) => (
            <option key={o.id} value={o.id}>
              {o.nombre}
            </option>
          ))}
        </Select>
      </Field>
      {error && <div className="mb-3.5 text-xs text-obra-red-text">{error}</div>}
      <PrimaryButton disabled={!(Number(importe) > 0) || guardando} onClick={guardar}>
        {guardando && <Loader2 size={16} className="animate-spin" />} {tr("Guardar")}
      </PrimaryButton>
    </div>
  );
}
