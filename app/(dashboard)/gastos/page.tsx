"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { Building2, Camera, Loader2, Lock, PenLine, Plus, Receipt, Sparkles, Trash2, Wallet } from "lucide-react";
import { useObra } from "@/lib/obra-context";
import { useMiembro } from "@/lib/miembro-context";
import { createClient } from "@/lib/supabase/client";
import { CATEGORIAS_GASTO, type Gasto, type Obra, type PagadoPor, type Proveedor } from "@/lib/types";
import { fmtEUR, monthLabel, todayStr } from "@/lib/format";
import { pagadoPorMi, suma } from "@/lib/dinero";
import { detalleGasto, tituloGasto } from "@/lib/gastos";
import { Empty } from "@/components/ui/Empty";
import { Card } from "@/components/ui/Card";
import { Field, Input, Select } from "@/components/ui/Field";
import { PrimaryButton } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { MonthFilter } from "@/components/ui/MonthFilter";
import { ArchivoViewer } from "@/components/ui/ArchivoViewer";
import { PagadoPorBadge, PagadoPorSelector } from "@/components/ui/PagadoPor";
import { ProveedorSelector, buscarProveedor } from "@/components/gastos/ProveedorSelector";
import { useEnRefresco } from "@/components/layout/PullToRefresh";
import {
  BUCKET_DOCUMENTOS,
  SelectorArchivo,
  subirArchivo,
  type ArchivoElegido,
} from "@/components/ui/SelectorArchivo";
import { tr, trN } from "@/lib/i18n";

type Quien = "todo" | PagadoPor;

const FILTROS_QUIEN: { id: Quien; label: string; icon?: typeof Wallet }[] = [
  { id: "todo", label: "Todo" },
  { id: "personal", label: "Pagué yo", icon: Wallet },
  { id: "empresa", label: "La empresa", icon: Building2 },
];

type Supabase = ReturnType<typeof createClient>;

/**
 * Todos los gastos de la obra: tickets del día a día y facturas, en el mismo
 * sitio. Antes eran dos listas y las facturas no contaban en lo gastado.
 *
 * El filtro de "quién lo pagó" + mes es para lo que pidió el dueño: "a los
 * dos meses quiero ver qué pagué yo en esta obra en octubre", de un toque.
 */
export default function GastosPage() {
  const { obraActual, obras } = useObra();
  const { esDueno } = useMiembro();
  const supabase = useMemo(() => createClient(), []);
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [adding, setAdding] = useState(false);
  const [viendo, setViendo] = useState<Gasto | null>(null);
  const [editando, setEditando] = useState<Gasto | null>(null);
  const [quien, setQuien] = useState<Quien>("todo");
  const [mes, setMes] = useState<string | null>(null);
  const [error, setError] = useState("");

  const cargar = useCallback(async () => {
    if (!obraActual) return;
    const { data } = await supabase
      .from("gastos")
      .select("*")
      .eq("obra_id", obraActual.id)
      .order("fecha", { ascending: false })
      .order("created_at", { ascending: false });
    setGastos(data ?? []);
  }, [obraActual, supabase]);

  const cargarProveedores = useCallback(async () => {
    const { data } = await supabase.from("proveedores").select("*").order("nombre");
    setProveedores(data ?? []);
  }, [supabase]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  useEffect(() => {
    cargarProveedores();
  }, [cargarProveedores]);

  useEnRefresco(cargar);
  useEnRefresco(cargarProveedores);

  /**
   * Deja el proveedor en la lista (si no estaba) y devuelve su nombre tal
   * como está guardado, para no acabar con "leroy merlin" y "Leroy Merlin".
   */
  const asegurarProveedor = async (nombre: string, favorito?: boolean): Promise<string | null> => {
    const limpio = nombre.trim();
    if (!limpio) return null;
    const existente = buscarProveedor(proveedores, limpio);
    if (existente) {
      if (favorito !== undefined && existente.favorito !== favorito) {
        await supabase.from("proveedores").update({ favorito }).eq("id", existente.id);
        await cargarProveedores();
      }
      return existente.nombre;
    }
    await supabase.from("proveedores").insert({ nombre: limpio, favorito: favorito ?? false });
    await cargarProveedores();
    return limpio;
  };

  const filtrados = gastos.filter(
    (g) => (quien === "todo" || g.pagado_por === quien) && (!mes || g.fecha.slice(0, 7) === mes)
  );
  const total = suma(filtrados);

  /** Lo que pagó el dueño solo lo toca el dueño (también lo impide la base de datos). */
  const puedeTocar = (g: Gasto) => esDueno || g.pagado_por !== "personal";

  const eliminar = async (g: Gasto) => {
    setError("");
    const { error: err } = await supabase.from("gastos").delete().eq("id", g.id);
    if (err) {
      setError(err.message);
      return;
    }
    // Los que vienen de la lista vieja de facturas comparten el archivo con
    // la copia que se guardó de ella: ese archivo no se toca.
    if (g.recibo_path && !g.factura_origen_id) {
      await supabase.storage.from(BUCKET_DOCUMENTOS).remove([g.recibo_path]);
    }
    setGastos((prev) => prev.filter((x) => x.id !== g.id));
    setViendo(null);
  };

  const tituloTotal =
    quien === "personal" ? tr("Pagado por ti") : quien === "empresa" ? tr("Pagado por la empresa") : tr("Total gastado");

  return (
    <div>
      <Card className="mb-3.5 p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-obra-text-dim">
              {tituloTotal}
              {mes && <span className="normal-case"> · {monthLabel(mes)}</span>}
            </div>
            <div className="font-mono-obra text-2xl font-bold text-obra-text">{fmtEUR(total)}</div>
          </div>
          <div className="text-xs text-obra-text-faint">
            {trN(filtrados.length, "{n} gasto", "{n} gastos")}
          </div>
        </div>
        {quien === "todo" && pagadoPorMi(filtrados) > 0 && (
          <div className="mt-2.5 flex items-center justify-between border-t border-obra-card-border pt-2.5 text-[13px]">
            <span className="text-obra-text-dim">{tr("De eso, pagado por ti")}</span>
            <span className="font-mono-obra font-bold text-obra-yellow">
              {fmtEUR(pagadoPorMi(filtrados))}
            </span>
          </div>
        )}
      </Card>

      <PrimaryButton onClick={() => setAdding(true)} className="mb-4">
        <Plus size={16} /> {tr("Añadir gasto o factura")}
      </PrimaryButton>

      {/* Selector táctico de filtro rápido estilo Obsidian Segmented Control */}
      <div className="mb-4 flex items-center rounded-[18px] border border-white/12 bg-[#0e120f]/85 p-1 backdrop-blur-xl shadow-[0_8px_20px_rgba(0,0,0,0.25),inset_0_1px_1px_rgba(255,255,255,0.08)]">
        {FILTROS_QUIEN.map((f) => {
          const activo = quien === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setQuien(f.id)}
              className={clsx(
                "flex flex-1 items-center justify-center gap-1.5 rounded-[14px] py-2 text-[13px] font-medium transition-all active:scale-[0.98]",
                activo
                  ? "bg-[#1c221e] text-[#d7dc9a] border border-white/14 shadow-[0_2px_8px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.14)]"
                  : "text-white/70 hover:bg-white/5 hover:text-white"
              )}
            >
              {f.icon && <f.icon size={14} className={activo ? "text-[#d7dc9a]" : "text-white/60"} />}
              <span className="tracking-tight">{tr(f.label)}</span>
            </button>
          );
        })}
      </div>

      <MonthFilter mes={mes} onChange={setMes} onClear={() => setMes(null)} />

      {filtrados.length === 0 ? (
        <Empty
          icon={Receipt}
          title={gastos.length === 0 ? tr("Sin gastos todavía") : tr("Nada con ese filtro")}
          sub={
            gastos.length === 0
              ? tr("Tickets y facturas de esta obra aparecerán aquí.")
              : tr("Prueba con otro mes o con «Todo».")
          }
        />
      ) : (
        <div className="flex flex-col gap-2">
          {filtrados.map((g) => (
            <button
              key={g.id}
              onClick={() => {
                setError("");
                setViendo(g);
              }}
              className="flex items-center gap-2.5 rounded-xl border border-obra-card-border bg-obra-card p-3 text-left"
            >
              <div className="h-full w-[3px] self-stretch rounded bg-obra-yellow" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <div className="truncate text-[14.5px] font-semibold text-obra-text">{tituloGasto(g)}</div>
                  {g.recibo_path && <Camera size={13} className="shrink-0 text-obra-yellow" />}
                </div>
                <div className="mt-0.5 flex items-center gap-1.5 text-xs text-obra-text-faint">
                  <span className="truncate">{detalleGasto(g)}</span>
                  <PagadoPorBadge pagadoPor={g.pagado_por} />
                </div>
              </div>
              <div className="shrink-0 font-mono-obra text-[15px] font-bold text-obra-text">
                {fmtEUR(g.importe)}
              </div>
            </button>
          ))}
        </div>
      )}

      {adding && obraActual && (
        <Sheet title={tr("Nuevo gasto")} onClose={() => setAdding(false)}>
          <GastoForm
            obras={obras}
            obraIdInicial={obraActual.id}
            supabase={supabase}
            esDueno={esDueno}
            proveedores={proveedores}
            asegurarProveedor={asegurarProveedor}
            onGuardado={(g) => {
              if (g.obra_id === obraActual.id) setGastos((prev) => [g, ...prev]);
              setAdding(false);
            }}
          />
        </Sheet>
      )}

      {viendo && !editando && (
        <Sheet title={tr("Gasto")} onClose={() => setViendo(null)}>
          <DetalleGasto
            gasto={viendo}
            puedeTocar={puedeTocar(viendo)}
            error={error}
            onEditar={() => setEditando(viendo)}
            onDelete={() => eliminar(viendo)}
          />
        </Sheet>
      )}

      {editando && obraActual && (
        <Sheet title={tr("Cambiar gasto")} onClose={() => setEditando(null)}>
          <GastoForm
            obras={obras}
            obraIdInicial={obraActual.id}
            gasto={editando}
            supabase={supabase}
            esDueno={esDueno}
            proveedores={proveedores}
            asegurarProveedor={asegurarProveedor}
            onGuardado={(g) => {
              // Si se ha cambiado de obra, desaparece de esta lista
              setGastos((prev) =>
                g.obra_id === obraActual.id ? prev.map((x) => (x.id === g.id ? g : x)) : prev.filter((x) => x.id !== g.id)
              );
              setEditando(null);
              setViendo(g.obra_id === obraActual.id ? g : null);
            }}
          />
        </Sheet>
      )}
    </div>
  );
}

function DetalleGasto({
  gasto,
  puedeTocar,
  error,
  onEditar,
  onDelete,
}: {
  gasto: Gasto;
  puedeTocar: boolean;
  error: string;
  onEditar: () => void;
  onDelete: () => void;
}) {
  const [confirm, setConfirm] = useState(false);
  return (
    <div>
      <div className="mb-3.5 flex justify-between gap-3">
        <div className="min-w-0">
          <div className="text-base font-bold text-obra-text">{tituloGasto(gasto)}</div>
          <div className="mt-0.5 text-xs text-obra-text-faint">{detalleGasto(gasto)}</div>
          <div className="mt-1.5">
            <PagadoPorBadge pagadoPor={gasto.pagado_por} />
          </div>
        </div>
        <div className="shrink-0 font-mono-obra text-lg font-bold text-obra-text">{fmtEUR(gasto.importe)}</div>
      </div>

      {gasto.recibo_path ? (
        <div className="mb-4">
          <ArchivoViewer path={gasto.recibo_path} tipo={gasto.recibo_tipo} bucket={BUCKET_DOCUMENTOS} />
        </div>
      ) : (
        <div className="mb-4 rounded-xl bg-obra-bg px-3.5 py-3 text-[12.5px] text-obra-text-faint">
          {tr("Sin foto ni PDF.")}
        </div>
      )}

      {error && <div className="mb-3.5 text-[13px] text-obra-red-text">{error}</div>}

      {!puedeTocar ? (
        <div className="flex items-center justify-center gap-1.5 py-2 text-[12.5px] text-obra-text-faint">
          <Lock size={13} /> {tr("Lo pagó el dueño: solo él puede cambiarlo.")}
        </div>
      ) : (
        <>
          <PrimaryButton onClick={onEditar}>
            <PenLine size={15} /> {tr("Cambiar")}
          </PrimaryButton>
          {!confirm ? (
            <button
              onClick={() => setConfirm(true)}
              className="mt-2 flex w-full items-center justify-center gap-1.5 py-2 text-[13px] font-semibold text-obra-text-faint"
            >
              <Trash2 size={14} /> {tr("Borrar este gasto")}
            </button>
          ) : (
            <button
              onClick={onDelete}
              className="mt-2 w-full rounded-xl bg-obra-red-bg py-2.5 text-[13px] font-bold text-obra-red"
            >
              {tr("Toca otra vez para borrarlo de verdad")}
            </button>
          )}
        </>
      )}
    </div>
  );
}

/** Alta y cambio de un gasto. Con `gasto` se está cambiando uno que ya existe. */
function GastoForm({
  obras,
  obraIdInicial,
  gasto,
  supabase,
  esDueno,
  proveedores,
  asegurarProveedor,
  onGuardado,
}: {
  obras: Obra[];
  obraIdInicial: string;
  gasto?: Gasto;
  supabase: Supabase;
  esDueno: boolean;
  proveedores: Proveedor[];
  asegurarProveedor: (nombre: string, favorito?: boolean) => Promise<string | null>;
  onGuardado: (g: Gasto) => void;
}) {
  const [obraId, setObraId] = useState(gasto?.obra_id ?? obraIdInicial);
  // "Lo pagué yo" cuenta en la caja del dueño: solo él puede marcarlo
  const [pagadoPor, setPagadoPor] = useState<PagadoPor>(gasto?.pagado_por ?? "empresa");
  const [proveedor, setProveedor] = useState(gasto?.proveedor ?? "");
  const [nota, setNota] = useState(
    gasto?.concepto && gasto.concepto !== gasto.proveedor && gasto.concepto !== "Factura" ? gasto.concepto : ""
  );
  const [importe, setImporte] = useState(gasto ? String(gasto.importe) : "");
  const [categoria, setCategoria] = useState<string>(gasto?.categoria ?? CATEGORIAS_GASTO[0]);
  const [fecha, setFecha] = useState(gasto?.fecha ?? todayStr());
  const [archivo, setArchivo] = useState<ArchivoElegido | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [guardadoEnOtra, setGuardadoEnOtra] = useState("");
  const [escaneandoIA, setEscaneandoIA] = useState(false);
  const [datosIA, setDatosIA] = useState<{ proveedor: string; importe: number; categoria: string } | null>(null);

  const procesarArchivoIA = async (nuevoArchivo: ArchivoElegido | null) => {
    setArchivo(nuevoArchivo);
    if (!nuevoArchivo) {
      setDatosIA(null);
      return;
    }

    if (nuevoArchivo.type.startsWith("image/")) {
      setEscaneandoIA(true);
      try {
        const reader = new FileReader();
        reader.onloadend = async () => {
          try {
            const base64 = (reader.result as string).split(",")[1];
            const res = await fetch("/api/ia/escanear-ticket", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                imageBase64: base64,
                mimeType: nuevoArchivo.type,
                nombreArchivo: nuevoArchivo.name,
              }),
            });
            const json = await res.json();
            if (json.ok) {
              if (json.proveedor) setProveedor(json.proveedor);
              if (json.importe) setImporte(String(json.importe));
              if (json.fecha) setFecha(json.fecha);
              if (json.categoria) setCategoria(json.categoria);
              if (json.concepto && !nota) setNota(json.concepto);
              setDatosIA({
                proveedor: json.proveedor,
                importe: json.importe,
                categoria: json.categoria,
              });
            }
          } catch (err) {
            console.error("Error escaneando ticket:", err);
          } finally {
            setEscaneandoIA(false);
          }
        };
        reader.readAsDataURL(nuevoArchivo.blob);
      } catch {
        setEscaneandoIA(false);
      }
    }
  };

  const valido = Number(importe) > 0;
  // Si una categoría vieja ya no está en la lista, se sigue pudiendo elegir
  const categorias: string[] = CATEGORIAS_GASTO.includes(categoria as (typeof CATEGORIAS_GASTO)[number])
    ? [...CATEGORIAS_GASTO]
    : [...CATEGORIAS_GASTO, categoria];

  const guardar = async () => {
    setGuardando(true);
    setError("");

    let recibo_path = gasto?.recibo_path ?? null;
    let recibo_tipo = gasto?.recibo_tipo ?? null;
    let subido: string | null = null;

    if (archivo) {
      const subida = await subirArchivo(supabase, obraId, "gastos", archivo);
      if ("error" in subida) {
        setError(tr("No se pudo subir el archivo ({detalle}).", { detalle: subida.error }));
        setGuardando(false);
        return;
      }
      subido = subida.path;
      recibo_path = subida.path;
      recibo_tipo = archivo.type;
    }

    const nombreProveedor = await asegurarProveedor(proveedor);
    const datos = {
      obra_id: obraId,
      concepto: nota.trim() || null,
      proveedor: nombreProveedor,
      importe: Number(importe),
      categoria,
      fecha,
      recibo_path,
      recibo_tipo,
      pagado_por: esDueno ? pagadoPor : gasto?.pagado_por ?? "empresa",
    };

    const { data, error: err } = gasto
      ? await supabase.from("gastos").update(datos).eq("id", gasto.id).select().single()
      : await supabase.from("gastos").insert(datos).select().single();

    if (err || !data) {
      if (subido) await supabase.storage.from(BUCKET_DOCUMENTOS).remove([subido]);
      setError(err?.message ?? tr("No se pudo guardar el gasto. Inténtalo de nuevo."));
      setGuardando(false);
      return;
    }

    // Foto cambiada: la vieja sobra (salvo la de las facturas pasadas, que
    // es la misma que la copia de la lista vieja)
    if (subido && gasto?.recibo_path && !gasto.factura_origen_id) {
      await supabase.storage.from(BUCKET_DOCUMENTOS).remove([gasto.recibo_path]);
    }

    if (obraId !== obraIdInicial) {
      const nombre = obras.find((o) => o.id === obraId)?.nombre || "";
      setGuardadoEnOtra(tr("Guardado en «{obra}»", { obra: nombre }));
      setTimeout(() => onGuardado(data), 900);
    } else {
      onGuardado(data);
    }
  };

  return (
    <div>
      {obras.length > 1 && (
        <Field label={tr("Obra")}>
          <Select value={obraId} onChange={(e) => setObraId(e.target.value)}>
            {obras.map((o) => (
              <option key={o.id} value={o.id}>
                {o.nombre}
              </option>
            ))}
          </Select>
        </Field>
      )}

      <Field label={gasto?.recibo_path ? tr("Foto del ticket o factura") : tr("Foto del ticket o factura (opcional)")}>
        {gasto?.recibo_path && !archivo && (
          <div className="mb-2 text-[12.5px] text-obra-text-faint">
            {tr("Ya tiene foto. Si eliges otra, sustituye a la de ahora.")}
          </div>
        )}
        <SelectorArchivo archivo={archivo} onChange={procesarArchivoIA} />
        {escaneandoIA && (
          <div className="mt-2.5 flex items-center gap-2 rounded-xl border border-[#d7dc9a]/40 bg-[#d7dc9a]/10 p-3 text-[12.5px] text-[#d7dc9a] animate-pulse">
            <Sparkles size={16} className="shrink-0" />
            <span>{tr("Escaneando ticket con IA…")}</span>
          </div>
        )}
        {datosIA && !escaneandoIA && (
          <div className="mt-2.5 flex items-center justify-between rounded-xl border border-[#d7dc9a]/30 bg-[#141a16] p-3 text-[12px] shadow-sm">
            <div className="flex items-center gap-2 min-w-0">
              <span className="h-2 w-2 rounded-full bg-[#d7dc9a] shrink-0" />
              <span className="truncate text-white font-medium">
                {tr("Reconocido por IA: {prov} · {imp} €", {
                  prov: datosIA.proveedor,
                  imp: String(datosIA.importe),
                })}
              </span>
            </div>
            <button
              type="button"
              onClick={guardar}
              className="shrink-0 rounded-lg bg-[#d7dc9a] px-2.5 py-1 text-[11px] font-bold text-[#141a16] transition active:scale-95"
            >
              {tr("Confirmar en 1 clic")}
            </button>
          </div>
        )}
      </Field>

      <Field label={tr("Proveedor")}>
        <ProveedorSelector
          valor={proveedor}
          onChange={setProveedor}
          proveedores={proveedores}
          onFavorito={async (nombre, fav) => {
            const guardado = await asegurarProveedor(nombre, fav);
            if (guardado) setProveedor(guardado);
          }}
        />
      </Field>

      <Field label={tr("Importe (€)")}>
        <Input
          type="number"
          inputMode="decimal"
          min={0}
          step="0.01"
          value={importe}
          onChange={(e) => setImporte(e.target.value)}
          placeholder="0,00"
        />
      </Field>
      <Field label={tr("Categoría")}>
        <Select value={categoria} onChange={(e) => setCategoria(e.target.value)}>
          {categorias.map((c) => (
            <option key={c} value={c}>
              {tr(c)}
            </option>
          ))}
        </Select>
      </Field>
      <Field label={tr("Fecha")}>
        <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} max={todayStr()} />
      </Field>

      {/* Antes era "Concepto" y obligatorio, y no se sabía qué poner: lo que
          es el gasto ya lo dicen el proveedor y la categoría. */}
      <Field label={tr("Nota (opcional)")}>
        <Input
          value={nota}
          onChange={(e) => setNota(e.target.value)}
          placeholder={tr("Ej. Azulejos del baño de la 2ª planta")}
        />
      </Field>

      {esDueno && (
        <Field label={tr("¿Quién lo pagó?")}>
          <PagadoPorSelector valor={pagadoPor} onChange={setPagadoPor} />
        </Field>
      )}

      {error && <div className="mb-3.5 text-xs text-obra-red-text">{error}</div>}
      {guardadoEnOtra && (
        <div className="mb-3.5 text-xs font-semibold text-obra-green">{guardadoEnOtra}</div>
      )}

      <PrimaryButton disabled={!valido || guardando || !!guardadoEnOtra} onClick={guardar}>
        {guardando && <Loader2 size={16} className="animate-spin" />}
        {gasto ? tr("Guardar cambios") : tr("Guardar gasto")}
      </PrimaryButton>
    </div>
  );
}
