"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Building2,
  Car,
  Check,
  Loader2,
  LogIn,
  LogOut,
  MapPin,
  PenLine,
  Plus,
  Trash2,
  Users,
  WifiOff,
  X,
} from "lucide-react";
import { useObra } from "@/lib/obra-context";
import { useMiembro } from "@/lib/miembro-context";
import { createClient } from "@/lib/supabase/client";
import type { Fichaje, FichajeHistorial, Obra, Trabajador } from "@/lib/types";
import { esFalloDeRed, useFichajesPendientes } from "@/lib/offline-fichajes";
import { useEnRefresco } from "@/components/layout/PullToRefresh";
import { fmtDateLong, nowHHMM, todayStr } from "@/lib/format";
import { fmtHoras, minutosExtra, minutosTrabajados } from "@/lib/horas";
import { DayNav } from "@/components/ui/DayNav";
import { Empty } from "@/components/ui/Empty";
import { Card } from "@/components/ui/Card";
import { Field, Input, Select } from "@/components/ui/Field";
import { GhostButton, PrimaryButton } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { StampButton } from "@/components/ui/StampButton";
import { ObraPicker } from "@/components/layout/ObraPicker";
import { MiFichaje } from "@/components/fichajes/MiFichaje";
import { textoTransporte } from "@/components/fichajes/TransporteSelector";
import { localeActual, tr, trJsx, trN } from "@/lib/i18n";

/**
 * Un trabajador solo ficha lo suyo; el resto (dueño, manager, jefe de obra)
 * ve y ficha a toda la cuadrilla.
 */
export default function FichajesPage() {
  const { esTrabajador } = useMiembro();
  return esTrabajador ? <MiFichaje /> : <FichajesCuadrilla />;
}

function FichajesCuadrilla() {
  const { obraActual, obras, jornadaHoras, setObraId } = useObra();
  const { esDueno, rol, modulos } = useMiembro();
  const puedeAnadirTrabajador = rol === "dueno" || rol === "manager";
  const supabase = useMemo(() => createClient(), []);

  const [fecha, setFecha] = useState(todayStr());
  const esHoy = fecha === todayStr();
  const [error, setError] = useState("");
  // A quién le está corrigiendo las horas el dueño (id del trabajador)
  const [corrigiendo, setCorrigiendo] = useState<string | null>(null);
  const [trabajadores, setTrabajadores] = useState<Trabajador[]>([]);
  const [fichajes, setFichajes] = useState<Fichaje[]>([]);
  // Fichajes de ESE MISMO DÍA en las demás obras: sirve para ver de un
  // vistazo si alguien estuvo además en otra obra (pasa a menudo).
  const [fichajesOtrasObras, setFichajesOtrasObras] = useState<Fichaje[]>([]);
  const [addingWorker, setAddingWorker] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [ubicacionSheet, setUbicacionSheet] = useState<string | null>(null);
  const [cambiandoObra, setCambiandoObra] = useState(false);

  useEffect(() => {
    supabase
      .from("trabajadores")
      .select("*")
      .eq("activo", true)
      .order("nombre")
      .then(({ data }) => setTrabajadores(data ?? []));
  }, [supabase]);

  const cargarFichajes = useCallback(async () => {
    if (!obraActual) return;
    const [propios, otros] = await Promise.all([
      supabase.from("fichajes").select("*").eq("obra_id", obraActual.id).eq("fecha", fecha),
      supabase.from("fichajes").select("*").neq("obra_id", obraActual.id).eq("fecha", fecha),
    ]);
    setFichajes(propios.data ?? []);
    setFichajesOtrasObras(otros.data ?? []);
  }, [obraActual, fecha, supabase]);

  useEffect(() => {
    cargarFichajes();
  }, [cargarFichajes]);

  useEnRefresco(cargarFichajes);

  const registroDe = (trabajadorId: string) => fichajes.find((f) => f.trabajador_id === trabajadorId);

  /**
   * Otras obras donde ese trabajador también fichó ese día. Se devuelven
   * enteras (con su id) para poder saltar a ellas de un toque: si no, las
   * horas parecen haberse perdido cuando en realidad están en la otra obra.
   */
  const otrasObrasDe = (trabajadorId: string) =>
    fichajesOtrasObras
      .filter((f) => f.trabajador_id === trabajadorId && f.hora_entrada)
      .map((f) => obras.find((o) => o.id === f.obra_id))
      .filter((o): o is Obra => Boolean(o));

  const ponerEnLista = (data: Fichaje) =>
    setFichajes((prev) => {
      const idx = prev.findIndex((f) => f.id === data.id);
      if (idx === -1) return [...prev, data];
      const next = [...prev];
      next[idx] = data;
      return next;
    });

  const { pendientes, encolar } = useFichajesPendientes(supabase, ponerEnLista);
  const pendienteDe = (trabajadorId: string, campo: "hora_entrada" | "hora_salida") =>
    pendientes.some((p) => p.trabajadorId === trabajadorId && p.fecha === fecha && p.campo === campo);

  const marcar = async (trabajadorId: string, campo: "hora_entrada" | "hora_salida") => {
    if (!obraActual) return;
    setError("");
    const hora = nowHHMM();
    // Salvo para el dueño, la base de datos cambia esta hora por la del
    // servidor: lo que se enseña luego es lo que devuelve, no la del móvil.
    const { data, error: err } = await supabase
      .from("fichajes")
      .upsert(
        { obra_id: obraActual.id, trabajador_id: trabajadorId, fecha, [campo]: hora },
        { onConflict: "obra_id,trabajador_id,fecha" }
      )
      .select()
      .single();
    if (data) {
      ponerEnLista(data);
      return;
    }
    // Sin cobertura en la obra: no se pierde el toque, queda en el móvil y
    // se envía solo en cuanto vuelva la señal.
    if (esFalloDeRed(err)) {
      encolar({ obraId: obraActual.id, trabajadorId, fecha, campo, hora });
      return;
    }
    if (err) setError(err.message);
  };

  /** Solo el dueño: pone las horas a mano y quedan marcadas como corregidas. */
  const guardarCorreccion = async (
    trabajadorId: string,
    entrada: string | null,
    salida: string | null
  ): Promise<string | null> => {
    if (!obraActual) return tr("No hay obra elegida.");
    const { data, error: err } = await supabase
      .from("fichajes")
      .upsert(
        {
          obra_id: obraActual.id,
          trabajador_id: trabajadorId,
          fecha,
          hora_entrada: entrada,
          hora_salida: salida,
          hora_corregida: true,
        },
        { onConflict: "obra_id,trabajador_id,fecha" }
      )
      .select()
      .single();
    if (err) return err.message;
    if (data) ponerEnLista(data);
    setCorrigiendo(null);
    return null;
  };

  /**
   * Para el error del día: se fichó en la obra equivocada. Mueve el fichaje
   * entero (mismas horas) a la obra correcta, sin borrar y volver a crear.
   * Como cambia de obra, sale de la lista de hoy en esta pantalla.
   */
  const moverObra = async (trabajadorId: string, nuevaObraId: string): Promise<string | null> => {
    const actual = registroDe(trabajadorId);
    if (!actual) return tr("No hay nada que mover todavía.");
    if (nuevaObraId === actual.obra_id) return null;
    const { data, error: err } = await supabase
      .from("fichajes")
      .update({ obra_id: nuevaObraId })
      .eq("id", actual.id)
      .select()
      .single();
    if (err) return err.message;
    if (data) {
      setFichajes((prev) => prev.filter((f) => f.id !== data.id));
    }
    return null;
  };

  const guardarUbicacion = async (trabajadorId: string, ubicacion: string) => {
    if (!obraActual) return;
    const { data } = await supabase
      .from("fichajes")
      .upsert(
        { obra_id: obraActual.id, trabajador_id: trabajadorId, fecha, ubicacion },
        { onConflict: "obra_id,trabajador_id,fecha" }
      )
      .select()
      .single();
    if (data) ponerEnLista(data);
    setUbicacionSheet(null);
  };

  const anadirTrabajador = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || !nuevoNombre.trim()) return;
    const { data } = await supabase
      .from("trabajadores")
      .insert({ owner_id: user.id, nombre: nuevoNombre.trim() })
      .select()
      .single();
    if (data) setTrabajadores((prev) => [...prev, data].sort((a, b) => a.nombre.localeCompare(b.nombre)));
    setNuevoNombre("");
    setAddingWorker(false);
  };

  return (
    <div>
      <DayNav fecha={fecha} onChange={setFecha} />

      {/* Deja claro en qué obra se está fichando, y permite cambiarla aquí
          mismo sin subir al selector de arriba. */}
      <button
        onClick={() => setCambiandoObra(true)}
        className="mb-3.5 flex w-full items-center gap-2 rounded-xl border border-obra-card-border bg-obra-card px-3.5 py-2.5 text-left"
      >
        <Building2 size={15} className="shrink-0 text-obra-yellow" />
        <span className="min-w-0 flex-1 truncate text-[13.5px] text-obra-text-dim">
          {tr("Fichando en")} <span className="font-bold text-obra-text">{obraActual?.nombre}</span>
        </span>
        <span className="shrink-0 text-xs font-semibold text-obra-yellow">{tr("Cambiar")}</span>
      </button>

      {!esHoy && (
        <div className="mb-3.5 text-center text-[12.5px] text-obra-text-faint">
          {esDueno
            ? tr("Otro día: toca «Corregir horas» en quien haga falta.")
            : tr("Las horas de otros días solo las puede cambiar el dueño.")}
        </div>
      )}

      {error && (
        <div className="mb-3.5 rounded-xl bg-obra-red-bg px-3.5 py-3 text-[13px] text-obra-red-text">
          {error}
        </div>
      )}

      {pendientes.length > 0 && (
        <div className="mb-3.5 flex items-center gap-2 rounded-xl bg-obra-yellow/12 px-3.5 py-3 text-[13px] text-obra-yellow">
          <WifiOff size={15} className="shrink-0" />
          {trN(pendientes.length, "Sin conexión: {n} fichaje en cola, se enviará solo en cuanto vuelva la señal.", "Sin conexión: {n} fichajes en cola, se enviarán solos en cuanto vuelva la señal.")}
        </div>
      )}

      {trabajadores.length === 0 ? (
        <Empty icon={Users} title={tr("Todavía no hay trabajadores")} sub={tr("Añade el primero para empezar a fichar.")} />
      ) : (
        <div className="grid gap-3.5 md:grid-cols-2">
          {trabajadores.map((t) => {
            const r = registroDe(t.id);
            const otras = otrasObrasDe(t.id);
            const min = minutosTrabajados(r?.hora_entrada, r?.hora_salida);
            const extra = min !== null ? minutosExtra(min, jornadaHoras) : 0;
            return (
              <Card key={t.id} className="flex flex-col justify-between p-4 rounded-[24px] border border-white/14 bg-[#5a655d]/85 backdrop-blur-xl shadow-[0_8px_24px_rgba(0,0,0,0.22)]">
                <div>
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-[15.5px] font-medium tracking-tight text-white">{t.nombre}</div>
                      {otras.length > 0 && (
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[11px] text-white/70">
                          <span>{tr("También hoy en:")}</span>
                          {otras.map((o) => (
                            <button
                              key={o.id}
                              onClick={() => setObraId(o.id)}
                              className="font-medium text-[#d7dc9a] underline underline-offset-2"
                            >
                              {o.nombre}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {min !== null && (
                      <div className="flex shrink-0 items-center gap-1.5">
                        <span className="rounded-xl border border-white/12 bg-white/10 px-2.5 py-0.5 font-mono-obra text-[12.5px] font-medium text-[#d7dc9a]">
                          {fmtHoras(min)}
                        </span>
                        {extra > 0 && (
                          <span className="rounded-full bg-[#d7dc9a]/15 px-2 py-0.5 text-[10.5px] font-medium text-[#d7dc9a]">
                            {tr("+{horas} extra", { horas: fmtHoras(extra) })}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mb-3 flex items-center justify-between">
                    <button
                      onClick={() => setUbicacionSheet(t.id)}
                      className={`flex items-center gap-1 text-[11.5px] rounded-lg px-2 py-1 transition ${
                        r?.ubicacion ? "bg-white/10 text-white" : "text-white/60 hover:text-white"
                      }`}
                    >
                      <MapPin size={12} className="shrink-0" />
                      <span className="max-w-[140px] truncate">{r?.ubicacion || tr("Añadir zona/tarea")}</span>
                    </button>

                    {/* Cómo llegó a la obra, si lo apuntó él desde su móvil */}
                    {(() => {
                      const texto = modulos.transporte ? textoTransporte(r?.transporte ?? null, r?.traido_por ?? null) : null;
                      if (!texto) return null;
                      return (
                        <div className="flex items-center gap-1 text-[11.5px] text-white/70">
                          <Car size={12} className="shrink-0" />
                          <span className="truncate max-w-[130px]">{texto}</span>
                        </div>
                      );
                    })()}
                  </div>

                  {(r?.hora_corregida || r?.confirmado_trabajador === false || r?.ubicacion_ok === false) && (
                    <div className="mb-3 flex flex-wrap items-center gap-1.5">
                      {r.hora_corregida && (
                        <div className="inline-flex items-center gap-1 rounded-full bg-white/12 px-2 py-0.5 text-[10.5px] font-medium text-white/90">
                          <PenLine size={10} /> {tr("Horas corregidas por el dueño")}
                        </div>
                      )}
                      {r.confirmado_trabajador != null && (
                        <div
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-medium ${
                            r.confirmado_trabajador
                              ? "bg-emerald-500/15 text-emerald-300"
                              : "bg-[#e0826d]/15 text-[#e0826d]"
                          }`}
                        >
                          {r.confirmado_trabajador ? tr("Confirmado") : tr("Sin confirmar")}
                        </div>
                      )}
                      {r.ubicacion_ok === false && (
                        <div className="inline-flex items-center gap-1 rounded-full bg-[#e0826d]/15 px-2 py-0.5 text-[10.5px] font-medium text-[#e0826d]">
                          <MapPin size={10} /> {tr("Fichó fuera de la obra")}
                          {r.distancia_metros != null && ` (${r.distancia_metros}m)`}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Sellos de Entrada y Salida */}
                <div>
                  <div className="flex gap-2">
                    <StampButton
                      label={tr("Entrada")}
                      hora={r?.hora_entrada}
                      color="green"
                      icon={LogIn}
                      onClick={() => marcar(t.id, "hora_entrada")}
                      disabled={!esHoy}
                      pendiente={pendienteDe(t.id, "hora_entrada")}
                    />
                    <StampButton
                      label={tr("Salida")}
                      hora={r?.hora_salida}
                      color="orange"
                      icon={LogOut}
                      onClick={() => marcar(t.id, "hora_salida")}
                      disabled={!esHoy || (!r?.hora_entrada && !pendienteDe(t.id, "hora_entrada"))}
                      pendiente={pendienteDe(t.id, "hora_salida")}
                    />
                  </div>

                  {esDueno && (
                    <button
                      onClick={() => setCorrigiendo(t.id)}
                      className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-[#121613]/50 py-1.5 text-[12px] font-medium text-white/75 transition hover:bg-[#121613] hover:text-white"
                    >
                      <PenLine size={12} /> {tr("Corregir horas")}
                    </button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {puedeAnadirTrabajador && (!addingWorker ? (
        <button
          onClick={() => setAddingWorker(true)}
          className="mt-3.5 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-obra-line py-3 text-[13.5px] font-semibold text-obra-text-dim"
        >
          <Plus size={15} /> {tr("Añadir trabajador")}
        </button>
      ) : (
        <Card className="mt-3.5 p-3">
          <Input
            autoFocus
            placeholder={tr("Nombre del trabajador")}
            value={nuevoNombre}
            onChange={(e) => setNuevoNombre(e.target.value)}
          />
          <div className="mt-2.5 flex gap-2">
            <GhostButton onClick={() => { setAddingWorker(false); setNuevoNombre(""); }}>{tr("Cancelar")}</GhostButton>
            <PrimaryButton disabled={!nuevoNombre.trim()} onClick={anadirTrabajador}>{tr("Añadir")}</PrimaryButton>
          </div>
        </Card>
      ))}

      {cambiandoObra && (
        <Sheet title={tr("Fichar en qué obra")} onClose={() => setCambiandoObra(false)}>
          <ObraPicker onDone={() => setCambiandoObra(false)} />
        </Sheet>
      )}

      {ubicacionSheet && (
        <Sheet title={tr("Zona / tarea")} onClose={() => setUbicacionSheet(null)}>
          <UbicacionForm
            valorInicial={registroDe(ubicacionSheet)?.ubicacion || ""}
            onGuardar={(v) => guardarUbicacion(ubicacionSheet, v)}
          />
        </Sheet>
      )}

      {corrigiendo && esDueno && (
        <Sheet title={tr("Corregir horas")} onClose={() => setCorrigiendo(null)}>
          <CorregirHorasForm
            nombre={trabajadores.find((t) => t.id === corrigiendo)?.nombre ?? ""}
            fecha={fecha}
            entrada={registroDe(corrigiendo)?.hora_entrada ?? null}
            salida={registroDe(corrigiendo)?.hora_salida ?? null}
            fichajeId={registroDe(corrigiendo)?.id ?? null}
            obraId={registroDe(corrigiendo)?.obra_id ?? null}
            otrasObras={obras.filter((o) => o.activa && o.id !== registroDe(corrigiendo)?.obra_id)}
            nombreObra={(id) => obras.find((o) => o.id === id)?.nombre ?? tr("otra obra")}
            onGuardar={(e, s) => guardarCorreccion(corrigiendo, e, s)}
            onMoverObra={(nuevaObraId) => moverObra(corrigiendo, nuevaObraId)}
          />
        </Sheet>
      )}
    </div>
  );
}

/**
 * El dueño pone la hora buena cuando alguien se olvidó de fichar (llegó a
 * las 8 y fichó a las 10) o se olvidó de la salida. Queda marcado como
 * corregido para que se vea siempre que esa hora no se fichó en el momento.
 */
function CorregirHorasForm({
  nombre,
  fecha,
  entrada,
  salida,
  fichajeId,
  obraId,
  otrasObras,
  nombreObra,
  onGuardar,
  onMoverObra,
}: {
  nombre: string;
  fecha: string;
  entrada: string | null;
  salida: string | null;
  fichajeId: string | null;
  obraId: string | null;
  otrasObras: Obra[];
  nombreObra: (id: string) => string;
  onGuardar: (entrada: string | null, salida: string | null) => Promise<string | null>;
  onMoverObra: (nuevaObraId: string) => Promise<string | null>;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [e, setE] = useState(entrada ?? "");
  const [s, setS] = useState(salida ?? "");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [confirmandoQuitar, setConfirmandoQuitar] = useState(false);
  const [historial, setHistorial] = useState<FichajeHistorial[]>([]);
  const [moviendo, setMoviendo] = useState(false);
  const [nuevaObra, setNuevaObra] = useState("");
  const [errorMover, setErrorMover] = useState("");

  useEffect(() => {
    if (!fichajeId) {
      setHistorial([]);
      return;
    }
    supabase
      .from("fichajes_historial")
      .select("*")
      .eq("fichaje_id", fichajeId)
      .order("cambiado_en", { ascending: false })
      .then(({ data }) => setHistorial(data ?? []));
  }, [fichajeId, supabase]);

  const min = minutosTrabajados(e || null, s || null);
  // Sin nada escrito no hay nada que guardar: antes se podía crear un
  // fichaje "vacío" (sin entrada ni salida) solo abriendo y tocando
  // "Guardar horas", lo que chocaba luego al intentar mover una obra de
  // verdad a ese día. No es un error que haya que enseñar en rojo, solo no
  // deja guardar.
  const vacio = !e && !s;
  const problema =
    s && !e
      ? tr("Pon también la hora de entrada.")
      : e && s && min === null
        ? tr("La salida tiene que ser después de la entrada.")
        : "";

  const guardar = async (entradaFinal: string | null, salidaFinal: string | null) => {
    setGuardando(true);
    setError("");
    const err = await onGuardar(entradaFinal, salidaFinal);
    setGuardando(false);
    if (err) setError(err);
  };

  const [movidoA, setMovidoA] = useState<string | null>(null);

  const mover = async () => {
    if (!nuevaObra) return;
    setMoviendo(true);
    setErrorMover("");
    const err = await onMoverObra(nuevaObra);
    setMoviendo(false);
    if (err) {
      setErrorMover(err);
      return;
    }
    setMovidoA(otrasObras.find((o) => o.id === nuevaObra)?.nombre ?? tr("otra obra"));
  };

  return (
    <div>
      <div className="mb-3.5 text-[13.5px] text-obra-text-dim">
        <span className="font-bold text-obra-text">{nombre}</span> · {fmtDateLong(fecha)}
      </div>

      {(entrada || salida) && (
        <div className="mb-3.5 rounded-xl bg-obra-bg px-3.5 py-2.5 text-[12.5px] text-obra-text-faint">
          {tr("Fichado ahora:")} <span className="font-mono-obra font-bold text-obra-text-dim">
            {entrada ?? "—"} → {salida ?? "—"}
          </span>
        </div>
      )}

      {/* Para el error del día: se fichó en la obra equivocada. Mueve el día
          entero (mismas horas) a la obra correcta, sin borrar y rehacer. */}
      {fichajeId && obraId && otrasObras.length > 0 && (
        <div className="mb-3.5 rounded-xl border border-dashed border-obra-line px-3.5 py-3">
          <div className="mb-2 text-[12.5px] font-semibold text-obra-text-dim">
            {tr("¿Fichado en la obra equivocada?")}
          </div>
          {movidoA ? (
            <div className="flex items-center gap-1.5 text-[13px] font-semibold text-obra-green">
              <Check size={15} /> {tr("Movido a {obra}. Ya puedes cerrar esta ventana.", { obra: movidoA })}
            </div>
          ) : (
            <>
              <Select value={nuevaObra} onChange={(ev) => setNuevaObra(ev.target.value)} className="mb-2">
                <option value="">{tr("Elige la obra correcta…")}</option>
                {otrasObras.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.nombre}
                  </option>
                ))}
              </Select>
              {/* Dos pasos a propósito (elegir y luego confirmar), pero el botón
                  dice adónde mueve para que no se confunda con "Guardar horas". */}
              <PrimaryButton disabled={!nuevaObra || moviendo} onClick={mover}>
                {moviendo && <Loader2 size={16} className="animate-spin" />}
                {nuevaObra
                  ? tr("Mover a {obra}", { obra: otrasObras.find((o) => o.id === nuevaObra)?.nombre ?? "" })
                  : tr("Elige una obra arriba")}
              </PrimaryButton>
              {errorMover && <div className="mt-2 text-[12px] text-obra-red-text">{errorMover}</div>}
            </>
          )}
        </div>
      )}

      {/* Cada hora lleva su "×": en el iPhone el selector de hora no se
          puede dejar vacío (como mucho 00:00), así que sin esto no había
          forma de quitar solo la salida, por ejemplo. */}
      <div className="flex gap-3">
        <div className="min-w-0 flex-1">
          <Field label={tr("Entrada")}>
            <div className="flex items-center gap-1">
              <Input type="time" value={e} onChange={(ev) => setE(ev.target.value)} className="min-w-0 flex-1" />
              {e && (
                <button
                  onClick={() => setE("")}
                  aria-label={tr("Quitar la hora de entrada")}
                  className="shrink-0 p-1.5 text-obra-text-faint"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </Field>
        </div>
        <div className="min-w-0 flex-1">
          <Field label={tr("Salida")}>
            <div className="flex items-center gap-1">
              <Input type="time" value={s} onChange={(ev) => setS(ev.target.value)} className="min-w-0 flex-1" />
              {s && (
                <button
                  onClick={() => setS("")}
                  aria-label={tr("Quitar la hora de salida")}
                  className="shrink-0 p-1.5 text-obra-text-faint"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </Field>
        </div>
      </div>

      {problema ? (
        <div className="mb-3.5 text-[12.5px] text-obra-red-text">{problema}</div>
      ) : min !== null ? (
        <div className="mb-3.5 text-[12.5px] text-obra-text-faint">
          {tr("En total:")} <span className="font-mono-obra font-bold text-obra-text">{fmtHoras(min)}</span>
        </div>
      ) : null}

      <div className="mb-3.5 text-[12px] leading-relaxed text-obra-text-faint">
        {tr("Quedará marcado como «corregido por el dueño», en tu móvil y en el suyo.")}
      </div>

      {error && <div className="mb-3.5 text-[13px] text-obra-red-text">{error}</div>}

      <PrimaryButton disabled={!!problema || vacio || guardando} onClick={() => guardar(e || null, s || null)}>
        {guardando && <Loader2 size={16} className="animate-spin" />} {tr("Guardar horas")}
      </PrimaryButton>

      {historial.length > 0 && (
        <div className="mb-3.5 rounded-xl bg-obra-bg px-3.5 py-2.5">
          <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-obra-text-faint">
            {tr("Historial de cambios")}
          </div>
          <div className="flex flex-col gap-1">
            {historial.map((h) => (
              <div key={h.id} className="text-[12px] text-obra-text-faint">
                {h.obra_id_despues ? (
                  <>
                    {trJsx("Movido de {antes} a {despues}", {
                      antes: <span className="font-semibold text-obra-text-dim">{nombreObra(h.obra_id_antes!)}</span>,
                      despues: <span className="font-semibold text-obra-text-dim">{nombreObra(h.obra_id_despues)}</span>,
                    })}
                  </>
                ) : (
                  <>
                    <span className="font-mono-obra text-obra-text-dim">
                      {h.hora_entrada_antes ?? "—"} → {h.hora_salida_antes ?? "—"}
                    </span>
                    {tr(" pasó a ")}
                    <span className="font-mono-obra font-semibold text-obra-text-dim">
                      {h.hora_entrada_despues ?? "—"} → {h.hora_salida_despues ?? "—"}
                    </span>
                  </>
                )}
                {" · "}
                {fmtCambio(h.cambiado_en)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Para cuando lo apuntaron por error y ese día no vino: el día deja de
          contar, pero queda la marca de que lo quitó el dueño. */}
      {(entrada || salida) &&
        (!confirmandoQuitar ? (
          <button
            onClick={() => setConfirmandoQuitar(true)}
            disabled={guardando}
            className="mt-3 flex w-full items-center justify-center gap-1.5 py-2 text-[13px] font-semibold text-obra-text-faint"
          >
            <Trash2 size={14} /> {tr("Quitar este día (no vino)")}
          </button>
        ) : (
          <button
            onClick={() => guardar(null, null)}
            disabled={guardando}
            className="mt-3 w-full rounded-xl bg-obra-red-bg py-2.5 text-[13px] font-bold text-obra-red"
          >
            {tr("Toca otra vez: {nombre} no cuenta este día", { nombre })}
          </button>
        ))}
    </div>
  );
}

const fmtCambio = (iso: string) =>
  new Date(iso).toLocaleString(localeActual(), { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

function UbicacionForm({ valorInicial, onGuardar }: { valorInicial: string; onGuardar: (v: string) => void }) {
  const [v, setV] = useState(valorInicial);
  return (
    <div>
      <Field label={tr("Dónde trabajó / qué tarea hizo")}>
        <Input
          autoFocus
          value={v}
          onChange={(e) => setV(e.target.value)}
          placeholder={tr("Ej. Planta 2 — demolición tabiquería")}
        />
      </Field>
      <PrimaryButton onClick={() => onGuardar(v.trim())}>{tr("Guardar")}</PrimaryButton>
    </div>
  );
}
