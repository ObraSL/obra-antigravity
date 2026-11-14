"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, MapPin, Plus, Trash2, Truck } from "lucide-react";
import { useObra } from "@/lib/obra-context";
import { useMiembro } from "@/lib/miembro-context";
import { createClient } from "@/lib/supabase/client";
import type { Obra, Trabajador, UsoVehiculo, Vehiculo } from "@/lib/types";
import { fmtDateLong, todayStr } from "@/lib/format";
import { DayNav } from "@/components/ui/DayNav";
import { Empty } from "@/components/ui/Empty";
import { Card } from "@/components/ui/Card";
import { Field, Input, Select } from "@/components/ui/Field";
import { GhostButton, PrimaryButton } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { tr, trN } from "@/lib/i18n";

type DatosUso = { obra_id: string; conductor_id: string | null; destino: string };

/**
 * Coches: qué día se usó cada uno, quién lo llevó y a qué obras fue.
 *
 * Ya no se apuntan km: no hay forma fiable de leerlos. Y un coche puede ir a
 * varias obras el mismo día (el del dueño, sobre todo), así que cada obra
 * del día es un apunte propio. Se ven todas las obras, no solo la elegida
 * arriba: si no, un coche que hoy estuvo en otra obra parecía sin usar.
 */
export default function VehiculosPage() {
  const { obraActual, obras } = useObra();
  const { esTrabajador } = useMiembro();
  const supabase = useMemo(() => createClient(), []);

  const [fecha, setFecha] = useState(todayStr());
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [trabajadores, setTrabajadores] = useState<Trabajador[]>([]);
  const [usos, setUsos] = useState<UsoVehiculo[]>([]);
  const [addingVehiculo, setAddingVehiculo] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [abierto, setAbierto] = useState<string | null>(null);

  useEffect(() => {
    supabase.from("vehiculos").select("*").eq("activo", true).order("nombre").then(({ data }) => setVehiculos(data ?? []));
    supabase.from("trabajadores").select("*").eq("activo", true).order("nombre").then(({ data }) => setTrabajadores(data ?? []));
  }, [supabase]);

  const cargarUsos = useCallback(async () => {
    const { data } = await supabase.from("usos_vehiculo").select("*").eq("fecha", fecha).order("created_at");
    setUsos(data ?? []);
  }, [fecha, supabase]);

  useEffect(() => {
    cargarUsos();
  }, [cargarUsos]);

  const usosDe = (vehiculoId: string) => usos.filter((u) => u.vehiculo_id === vehiculoId);
  const nombreObra = (id: string) => obras.find((o) => o.id === id)?.nombre ?? tr("Otra obra");
  const nombreConductor = (id: string | null) => trabajadores.find((t) => t.id === id)?.nombre;
  const cochesHoy = new Set(usos.map((u) => u.vehiculo_id)).size;

  const anadirVehiculo = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || !nuevoNombre.trim()) return;
    const { data } = await supabase
      .from("vehiculos")
      .insert({ owner_id: user.id, nombre: nuevoNombre.trim() })
      .select()
      .single();
    if (data) setVehiculos((prev) => [...prev, data].sort((a, b) => a.nombre.localeCompare(b.nombre)));
    setNuevoNombre("");
    setAddingVehiculo(false);
  };

  /** Guarda un apunte (nuevo o cambiado). Devuelve el fallo, si lo hay. */
  const guardarUso = async (vehiculoId: string, datos: DatosUso, usoId?: string): Promise<string | null> => {
    const fila = { ...datos, destino: datos.destino.trim() || null };
    const { error } = usoId
      ? await supabase.from("usos_vehiculo").update(fila).eq("id", usoId)
      : await supabase.from("usos_vehiculo").insert({ ...fila, vehiculo_id: vehiculoId, fecha });
    if (error) {
      return error.code === "23505" ? tr("Ese coche ya está apuntado en esa obra este día.") : error.message;
    }
    await cargarUsos();
    return null;
  };

  const borrarUso = async (usoId: string): Promise<string | null> => {
    const { error } = await supabase.from("usos_vehiculo").delete().eq("id", usoId);
    if (error) return error.message;
    await cargarUsos();
    return null;
  };

  const vehiculoAbierto = vehiculos.find((v) => v.id === abierto);

  return (
    <div>
      <DayNav fecha={fecha} onChange={setFecha} />

      {vehiculos.length > 0 && (
        <div className="mb-3.5 text-center text-[12.5px] text-obra-text-faint">
          {cochesHoy === 0
            ? tr("Ningún coche apuntado este día")
            : trN(cochesHoy, "{n} coche en uso este día", "{n} coches en uso este día")}
        </div>
      )}

      {vehiculos.length === 0 ? (
        <Empty icon={Truck} title={tr("Todavía no hay vehículos")} sub={tr("Añade el primero para apuntar quién lo lleva y a qué obra.")} />
      ) : (
        <div className="flex flex-col gap-2.5">
          {vehiculos.map((v) => {
            const delDia = usosDe(v.id);
            return (
              <button
                key={v.id}
                onClick={() => setAbierto(v.id)}
                className="flex items-start gap-3 rounded-2xl border border-obra-card-border bg-obra-card p-3.5 text-left"
              >
                <div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[10px] bg-obra-bg-elevated">
                  <Truck size={20} className={delDia.length > 0 ? "text-obra-yellow" : "text-obra-text-faint"} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[15px] font-bold text-obra-text">{v.nombre}</div>
                  {delDia.length === 0 ? (
                    <div className="mt-0.5 text-[12.5px] text-obra-text-faint">{tr("Sin usar este día")}</div>
                  ) : (
                    delDia.map((u) => {
                      const conductor = nombreConductor(u.conductor_id);
                      return (
                        <div key={u.id} className="mt-0.5 flex items-center gap-1 overflow-hidden text-[12.5px] text-obra-text-dim">
                          <MapPin size={11} className="shrink-0 text-obra-yellow" />
                          <span className="truncate">
                            <span className={u.obra_id === obraActual?.id ? "font-bold text-obra-text" : ""}>
                              {nombreObra(u.obra_id)}
                            </span>
                            {conductor ? ` · ${conductor}` : ""}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {!esTrabajador && (!addingVehiculo ? (
        <button
          onClick={() => setAddingVehiculo(true)}
          className="mt-3.5 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-obra-line py-3 text-[13.5px] font-semibold text-obra-text-dim"
        >
          <Plus size={15} /> {tr("Añadir vehículo")}
        </button>
      ) : (
        <Card className="mt-3.5 p-3">
          <Input
            autoFocus
            placeholder={tr("Ej. Furgoneta — 1234 ABC")}
            value={nuevoNombre}
            onChange={(e) => setNuevoNombre(e.target.value)}
          />
          <div className="mt-2.5 flex gap-2">
            <GhostButton onClick={() => { setAddingVehiculo(false); setNuevoNombre(""); }}>{tr("Cancelar")}</GhostButton>
            <PrimaryButton disabled={!nuevoNombre.trim()} onClick={anadirVehiculo}>{tr("Añadir")}</PrimaryButton>
          </div>
        </Card>
      ))}

      {vehiculoAbierto && (
        <Sheet title={vehiculoAbierto.nombre} onClose={() => setAbierto(null)}>
          {esTrabajador ? (
            <DiaDelVehiculoSoloVer
              fecha={fecha}
              usos={usosDe(vehiculoAbierto.id)}
              obras={obras}
              nombreConductor={(id) => nombreConductor(id)}
            />
          ) : (
            <DiaDelVehiculo
              fecha={fecha}
              usos={usosDe(vehiculoAbierto.id)}
              obras={obras}
              obraPorDefecto={obraActual?.id ?? obras[0]?.id ?? ""}
              trabajadores={trabajadores}
              onGuardar={(datos, usoId) => guardarUso(vehiculoAbierto.id, datos, usoId)}
              onBorrar={borrarUso}
            />
          )}
        </Sheet>
      )}
    </div>
  );
}

/** Para el trabajador: mismo día, solo para ver, sin añadir ni borrar nada. */
function DiaDelVehiculoSoloVer({
  fecha,
  usos,
  obras,
  nombreConductor,
}: {
  fecha: string;
  usos: UsoVehiculo[];
  obras: Obra[];
  nombreConductor: (id: string | null) => string | undefined;
}) {
  const nombreObra = (id: string) => obras.find((o) => o.id === id)?.nombre ?? tr("Otra obra");

  return (
    <div>
      <div className="mb-3 text-[13px] text-obra-text-dim">{fmtDateLong(fecha)}</div>

      {usos.length === 0 ? (
        <div className="text-[13px] text-obra-text-faint">{tr("Sin usar este día.")}</div>
      ) : (
        <div className="flex flex-col gap-2">
          {usos.map((u) => {
            const conductor = nombreConductor(u.conductor_id);
            return (
              <div key={u.id} className="rounded-xl border border-obra-card-border bg-obra-card p-3">
                <div className="flex items-center gap-1.5">
                  <MapPin size={13} className="shrink-0 text-obra-yellow" />
                  <span className="truncate text-[14px] font-semibold text-obra-text">{nombreObra(u.obra_id)}</span>
                </div>
                <div className="mt-0.5 truncate text-[12px] text-obra-text-faint">
                  {[conductor ? tr("Lo llevó {nombre}", { nombre: conductor }) : null, u.destino].filter(Boolean).join(" · ") || tr("Sin más detalles")}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Las obras a las que fue un coche un día, y para añadir o cambiar una. */
function DiaDelVehiculo({
  fecha,
  usos,
  obras,
  obraPorDefecto,
  trabajadores,
  onGuardar,
  onBorrar,
}: {
  fecha: string;
  usos: UsoVehiculo[];
  obras: Obra[];
  obraPorDefecto: string;
  trabajadores: Trabajador[];
  onGuardar: (datos: DatosUso, usoId?: string) => Promise<string | null>;
  onBorrar: (usoId: string) => Promise<string | null>;
}) {
  // Sin nada apuntado ese día, se abre directamente el formulario
  const [editando, setEditando] = useState<UsoVehiculo | "nuevo" | null>(usos.length === 0 ? "nuevo" : null);
  const [borrando, setBorrando] = useState<string | null>(null);
  const [error, setError] = useState("");

  const nombreObra = (id: string) => obras.find((o) => o.id === id)?.nombre ?? tr("Otra obra");
  const nombreConductor = (id: string | null) => trabajadores.find((t) => t.id === id)?.nombre;
  // Las obras que ya tienen apunte ese día no se ofrecen otra vez
  const yaApuntadas = new Set(usos.map((u) => u.obra_id));
  const libres = obras.filter((o) => !yaApuntadas.has(o.id));

  const borrar = async (id: string) => {
    setError("");
    const err = await onBorrar(id);
    if (err) setError(err);
    setBorrando(null);
  };

  if (editando) {
    const uso = editando === "nuevo" ? undefined : editando;
    const opciones = uso ? obras.filter((o) => o.id === uso.obra_id || !yaApuntadas.has(o.id)) : libres;
    return (
      <UsoForm
        fecha={fecha}
        uso={uso}
        obras={opciones}
        obraPorDefecto={opciones.some((o) => o.id === obraPorDefecto) ? obraPorDefecto : opciones[0]?.id ?? ""}
        trabajadores={trabajadores}
        onCancelar={usos.length > 0 ? () => setEditando(null) : undefined}
        onGuardar={async (datos) => {
          const err = await onGuardar(datos, uso?.id);
          if (!err) setEditando(null);
          return err;
        }}
      />
    );
  }

  return (
    <div>
      <div className="mb-3 text-[13px] text-obra-text-dim">{fmtDateLong(fecha)}</div>

      <div className="flex flex-col gap-2">
        {usos.map((u) => {
          const conductor = nombreConductor(u.conductor_id);
          return (
            <div key={u.id} className="flex items-center gap-2 rounded-xl border border-obra-card-border bg-obra-card p-3">
              <button onClick={() => setEditando(u)} className="min-w-0 flex-1 text-left">
                <div className="flex items-center gap-1.5">
                  <MapPin size={13} className="shrink-0 text-obra-yellow" />
                  <span className="truncate text-[14px] font-semibold text-obra-text">{nombreObra(u.obra_id)}</span>
                </div>
                <div className="mt-0.5 truncate text-[12px] text-obra-text-faint">
                  {[conductor ? tr("Lo llevó {nombre}", { nombre: conductor }) : null, u.destino].filter(Boolean).join(" · ") || tr("Toca para añadir conductor o notas")}
                </div>
              </button>
              {borrando === u.id ? (
                <button onClick={() => borrar(u.id)} className="shrink-0 px-1 text-[11.5px] font-bold text-obra-red">
                  {tr("Quitar")}
                </button>
              ) : (
                <button
                  onClick={() => setBorrando(u.id)}
                  className="shrink-0 p-1 text-obra-text-faint"
                  aria-label={tr("Quitar esta obra del día")}
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {error && <div className="mt-3 text-[13px] text-obra-red-text">{error}</div>}

      {libres.length > 0 && (
        <button
          onClick={() => setEditando("nuevo")}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-obra-line py-3 text-[13.5px] font-semibold text-obra-text-dim"
        >
          <Plus size={15} /> {tr("Añadir otra obra este día")}
        </button>
      )}
    </div>
  );
}

function UsoForm({
  fecha,
  uso,
  obras,
  obraPorDefecto,
  trabajadores,
  onCancelar,
  onGuardar,
}: {
  fecha: string;
  uso?: UsoVehiculo;
  obras: Obra[];
  obraPorDefecto: string;
  trabajadores: Trabajador[];
  onCancelar?: () => void;
  onGuardar: (datos: DatosUso) => Promise<string | null>;
}) {
  const [obraId, setObraId] = useState(uso?.obra_id ?? obraPorDefecto);
  const [conductorId, setConductorId] = useState(uso?.conductor_id ?? "");
  const [destino, setDestino] = useState(uso?.destino ?? "");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const guardar = async () => {
    setGuardando(true);
    setError("");
    const err = await onGuardar({ obra_id: obraId, conductor_id: conductorId || null, destino });
    setGuardando(false);
    if (err) setError(err);
  };

  return (
    <div>
      <div className="mb-3.5 text-[13px] text-obra-text-dim">{fmtDateLong(fecha)}</div>

      {trabajadores.length > 0 && (
        <Field label={tr("¿Quién lo llevó? (opcional)")}>
          <Select value={conductorId} onChange={(e) => setConductorId(e.target.value)}>
            <option value="">{tr("Sin especificar")}</option>
            {trabajadores.map((t) => (
              <option key={t.id} value={t.id}>{t.nombre}</option>
            ))}
          </Select>
        </Field>
      )}

      <Field label={tr("¿A qué obra fue?")}>
        <Select value={obraId} onChange={(e) => setObraId(e.target.value)}>
          {obras.map((o) => (
            <option key={o.id} value={o.id}>{o.nombre}</option>
          ))}
        </Select>
      </Field>

      <Field label={tr("¿Dónde más tuvo que ir? (opcional)")}>
        <Input
          value={destino}
          onChange={(e) => setDestino(e.target.value)}
          placeholder={tr("Ej. Leroy Merlin, vertedero, almacén…")}
        />
      </Field>

      {error && <div className="mb-3.5 text-[13px] text-obra-red-text">{error}</div>}

      <PrimaryButton disabled={!obraId || guardando} onClick={guardar}>
        {guardando && <Loader2 size={16} className="animate-spin" />} {tr("Guardar")}
      </PrimaryButton>
      {onCancelar && (
        <GhostButton className="mt-2.5" onClick={onCancelar}>
          {tr("Volver")}
        </GhostButton>
      )}
    </div>
  );
}
