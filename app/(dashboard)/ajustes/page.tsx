"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Blocks, Building2, ChevronRight, Clock, HardHat, KeyRound, Languages, LogOut, MapPin, Plus, ShieldAlert, Trash2, Truck, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useObra } from "@/lib/obra-context";
import { useMiembro } from "@/lib/miembro-context";
import { createClient } from "@/lib/supabase/client";
import { ROLES, type Obra, type Trabajador, type Vehiculo } from "@/lib/types";
import { Input } from "@/components/ui/Field";
import { GhostButton, PrimaryButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Sheet } from "@/components/ui/Sheet";
import { Accesos } from "@/components/ajustes/Accesos";
import { SoporteAcceso } from "@/components/ajustes/SoporteAcceso";
import { EliminarObra } from "@/components/ajustes/EliminarObra";
import { ConfigurarObra } from "@/components/ajustes/ConfigurarObra";
import clsx from "clsx";
import { SelectorIdioma } from "@/components/ui/SelectorIdioma";
import { LISTA_MODULOS } from "@/lib/modulos";
import { tr } from "@/lib/i18n";

export default function AjustesPage() {
  const { esTrabajador } = useMiembro();
  return esTrabajador ? <AjustesTrabajador /> : <AjustesGestor />;
}

function AjustesGestor() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const {
    obras,
    setObraId,
    crearObra,
    toggleObraActiva,
    refrescar,
    jornadaHoras,
    guardarJornada,
    jefeVeTodas,
    guardarJefeVeTodas,
  } = useObra();
  const { rol, esDueno, modulos, guardarModulo } = useMiembro();
  // Quién puede tocar el maestro de obras, trabajadores y vehículos.
  const administra = rol === "dueno" || rol === "manager";
  const [jornadaTexto, setJornadaTexto] = useState<string>("");
  const [borrandoObra, setBorrandoObra] = useState<Obra | null>(null);
  const [configurandoObra, setConfigurandoObra] = useState<Obra | null>(null);

  const [trabajadores, setTrabajadores] = useState<Trabajador[]>([]);
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);

  useEffect(() => {
    supabase.from("trabajadores").select("*").order("nombre").then(({ data }) => setTrabajadores(data ?? []));
    supabase.from("vehiculos").select("*").order("nombre").then(({ data }) => setVehiculos(data ?? []));
  }, [supabase]);

  const anadirTrabajador = async (nombre: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("trabajadores").insert({ owner_id: user.id, nombre }).select().single();
    if (data) setTrabajadores((prev) => [...prev, data].sort((a, b) => a.nombre.localeCompare(b.nombre)));
  };

  const toggleTrabajadorActivo = async (id: string) => {
    const trabajador = trabajadores.find((t) => t.id === id);
    if (!trabajador) return;
    const { data, error } = await supabase
      .from("trabajadores")
      .update({ activo: !trabajador.activo })
      .eq("id", id)
      .select()
      .single();
    if (!error && data) {
      setTrabajadores((prev) => prev.map((t) => (t.id === id ? data : t)));
    }
  };

  const anadirVehiculo = async (nombre: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("vehiculos").insert({ owner_id: user.id, nombre }).select().single();
    if (data) setVehiculos((prev) => [...prev, data].sort((a, b) => a.nombre.localeCompare(b.nombre)));
  };

  const toggleVehiculoActivo = async (id: string) => {
    const vehiculo = vehiculos.find((v) => v.id === id);
    if (!vehiculo) return;
    const { data, error } = await supabase
      .from("vehiculos")
      .update({ activo: !vehiculo.activo })
      .eq("id", id)
      .select()
      .single();
    if (!error && data) {
      setVehiculos((prev) => prev.map((v) => (v.id === id ? data : v)));
    }
  };

  const cerrarSesion = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div>
      <SectionTitle icon={Languages} title={tr("Idioma")} />
      <div className="mb-7">
        <SelectorIdioma />
      </div>
      {esDueno && (
        <>
          <SectionTitle icon={KeyRound} title={tr("Accesos")} />
          <Accesos />

          <SectionTitle icon={ShieldAlert} title={tr("Soporte")} />
          <SoporteAcceso />
        </>
      )}

      {esDueno && (
        <>
      <SectionTitle icon={Clock} title={tr("Jornada")} />
      <Card className="mb-7 p-3">
        <div className="mb-2 text-[13px] text-obra-text-dim">
          {tr("Horas de una jornada normal. Lo que pase de ahí en un día cuenta como")}{" "}
          <span className="font-semibold text-obra-text">{tr("horas extra")}</span>.
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            inputMode="decimal"
            min={1}
            max={24}
            step="0.5"
            className="flex-1"
            value={jornadaTexto === "" ? String(jornadaHoras) : jornadaTexto}
            onChange={(e) => setJornadaTexto(e.target.value)}
          />
          <PrimaryButton
            className="w-auto px-5"
            disabled={
              jornadaTexto === "" ||
              Number(jornadaTexto) === jornadaHoras ||
              !(Number(jornadaTexto) > 0 && Number(jornadaTexto) <= 24)
            }
            onClick={async () => {
              await guardarJornada(Number(jornadaTexto));
              setJornadaTexto("");
            }}
          >
            {tr("Guardar")}
          </PrimaryButton>
        </div>
      </Card>

      <SectionTitle icon={HardHat} title={tr("Jefe de obra")} />
      <Card className="mb-7 p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="text-[13px] text-obra-text-dim">
            {tr("Deja que el jefe de obra vea")} <span className="font-semibold text-obra-text">{tr("todas las obras")}</span>{" "}
            {tr("de la empresa, no solo la que tiene asignada.")}
          </div>
          <button
            onClick={() => guardarJefeVeTodas(!jefeVeTodas)}
            className={clsx(
              "shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-bold uppercase",
              jefeVeTodas ? "border-obra-green text-obra-green" : "border-obra-line text-obra-text-faint"
            )}
          >
            {jefeVeTodas ? tr("Activado") : tr("Desactivado")}
          </button>
        </div>
      </Card>

      <SectionTitle icon={Blocks} title={tr("Módulos")} />
      <div className="mb-2 text-[12.5px] text-obra-text-faint">
        {tr("Apaga lo que tu empresa no use: desaparece del menú y de las pantallas de todos. No se borra nada.")}
      </div>
      <Card className="mb-7 divide-y divide-obra-card-border">
        {LISTA_MODULOS.map((m) => (
          <div key={m.clave} className="flex items-center justify-between gap-3 p-3">
            <div className="min-w-0">
              <div className="text-[14px] font-semibold text-obra-text">{tr(m.label)}</div>
              <div className="text-[12px] text-obra-text-faint">{tr(m.descripcion)}</div>
            </div>
            <button
              onClick={() => guardarModulo(m.clave, !modulos[m.clave])}
              className={clsx(
                "shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-bold uppercase",
                modulos[m.clave] ? "border-obra-green text-obra-green" : "border-obra-line text-obra-text-faint"
              )}
            >
              {modulos[m.clave] ? tr("Activado") : tr("Desactivado")}
            </button>
          </div>
        ))}
      </Card>
        </>
      )}

      {administra && (
        <>
      <SectionTitle icon={Building2} title={tr("Obras")} />
      <div className="mb-1.5 text-[12px] text-obra-text-faint">
        {tr("Toca una obra para verla entera (fichajes, gastos, dinero…), esté activa o cerrada.")}
      </div>
      <div className="mb-2.5 flex flex-col gap-2">
        {obras.map((o) => (
          <button
            key={o.id}
            onClick={() => {
              setObraId(o.id);
              router.push("/");
            }}
            className="flex w-full items-center justify-between gap-2 rounded-[14px] border border-obra-card-border bg-obra-card p-3 text-left"
          >
            <div className="min-w-0">
              <div className="truncate text-[14.5px] font-semibold text-obra-text">{o.nombre}</div>
              {o.direccion && <div className="mt-px truncate text-xs text-obra-text-faint">{o.direccion}</div>}
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleObraActiva(o.id);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.stopPropagation();
                    e.preventDefault();
                    toggleObraActiva(o.id);
                  }
                }}
                className={clsx(
                  "rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase",
                  o.activa ? "border-obra-green text-obra-green" : "border-obra-line text-obra-text-faint"
                )}
              >
                {o.activa ? tr("Activa") : tr("Cerrada")}
              </span>
              {esDueno && (
                <span
                  role="button"
                  tabIndex={0}
                  aria-label={tr("Ubicación y horario de {obra}", { obra: o.nombre })}
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfigurandoObra(o);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.stopPropagation();
                      e.preventDefault();
                      setConfigurandoObra(o);
                    }
                  }}
                  className="p-1 text-obra-text-faint"
                >
                  <MapPin size={15} />
                </span>
              )}
              {esDueno && (
                <span
                  role="button"
                  tabIndex={0}
                  aria-label={tr("Borrar {obra} para siempre", { obra: o.nombre })}
                  onClick={(e) => {
                    e.stopPropagation();
                    setBorrandoObra(o);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.stopPropagation();
                      e.preventDefault();
                      setBorrandoObra(o);
                    }
                  }}
                  className="p-1 text-obra-text-faint"
                >
                  <Trash2 size={15} />
                </span>
              )}
              <ChevronRight size={16} className="text-obra-text-faint" />
            </div>
          </button>
        ))}
      </div>
      <AddInline placeholder={tr("Nombre de la obra")} onAdd={(v) => crearObra(v, "")} label={tr("Nueva obra")} className="mb-7" />

      <SectionTitle icon={Users} title={tr("Trabajadores")} />
      <div className="mb-2.5 flex flex-col gap-2">
        {trabajadores.length === 0 && (
          <div className="text-[13px] text-obra-text-faint">{tr("Todavía no hay trabajadores.")}</div>
        )}
        {trabajadores.map((t) => (
          <Card key={t.id} className="flex items-center justify-between p-3">
            <div className="text-[14.5px] font-semibold text-obra-text">{t.nombre}</div>
            <button
              onClick={() => toggleTrabajadorActivo(t.id)}
              className={clsx(
                "rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase",
                t.activo ? "border-obra-green text-obra-green" : "border-obra-line text-obra-text-faint"
              )}
            >
              {t.activo ? tr("Activo") : tr("Baja")}
            </button>
          </Card>
        ))}
      </div>
      <AddInline placeholder={tr("Nombre")} onAdd={anadirTrabajador} label={tr("Nuevo trabajador")} className="mb-7" />

      <SectionTitle icon={Truck} title={tr("Vehículos")} />
      <div className="mb-2.5 flex flex-col gap-2">
        {vehiculos.length === 0 && (
          <div className="text-[13px] text-obra-text-faint">{tr("Todavía no hay vehículos.")}</div>
        )}
        {vehiculos.map((v) => (
          <Card key={v.id} className="flex items-center justify-between p-3">
            <div className="text-[14.5px] font-semibold text-obra-text">{v.nombre}</div>
            <button
              onClick={() => toggleVehiculoActivo(v.id)}
              className={clsx(
                "rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase",
                v.activo ? "border-obra-green text-obra-green" : "border-obra-line text-obra-text-faint"
              )}
            >
              {v.activo ? tr("Activo") : tr("Baja")}
            </button>
          </Card>
        ))}
      </div>
      <AddInline placeholder={tr("Ej. Furgoneta — 1234 ABC")} onAdd={anadirVehiculo} label={tr("Nuevo vehículo")} className="mb-7" />
        </>
      )}

      <button
        onClick={cerrarSesion}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-obra-line py-3 text-[13.5px] font-semibold text-obra-text-faint md:hidden"
      >
        <LogOut size={16} /> {tr("Cerrar sesión")}
      </button>

      {borrandoObra && (
        <Sheet title={tr("Borrar obra")} onClose={() => setBorrandoObra(null)}>
          <EliminarObra
            obra={borrandoObra}
            onEliminada={async () => {
              setBorrandoObra(null);
              await refrescar();
            }}
          />
        </Sheet>
      )}

      {configurandoObra && (
        <Sheet title={tr("Ubicación y horario · {obra}", { obra: configurandoObra.nombre })} onClose={() => setConfigurandoObra(null)}>
          <ConfigurarObra
            obra={configurandoObra}
            onGuardado={async () => {
              setConfigurandoObra(null);
              await refrescar();
            }}
          />
        </Sheet>
      )}
    </div>
  );
}

/** Ajustes de un trabajador: solo su cuenta. */
function AjustesTrabajador() {
  const router = useRouter();
  const { miembro } = useMiembro();

  const cerrarSesion = async () => {
    await createClient().auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <div>
      <SectionTitle icon={Users} title={tr("Mi cuenta")} />
      <Card className="mb-7 p-4">
        <div className="text-[15.5px] font-bold text-obra-text">{miembro?.nombre || "—"}</div>
        <div className="mt-0.5 text-[12.5px] text-obra-text-faint">{miembro?.email}</div>
        <div className="mt-3 inline-flex rounded-full border border-obra-line px-2.5 py-1 text-[11px] font-bold uppercase text-obra-text-dim">
          {tr(ROLES.find((r) => r.id === miembro?.rol)?.label ?? "")}
        </div>
        <div className="mt-3 text-[12.5px] leading-relaxed text-obra-text-faint">
          {tr("Si algo de esto no está bien, díselo al jefe: él lo cambia desde su cuenta.")}
        </div>
      </Card>

      <SectionTitle icon={Languages} title={tr("Idioma")} />
      <div className="mb-7">
        <SelectorIdioma />
      </div>

      <button
        onClick={cerrarSesion}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-obra-line py-3 text-[13.5px] font-semibold text-obra-text-faint"
      >
        <LogOut size={16} /> {tr("Cerrar sesión")}
      </button>
    </div>
  );
}

function SectionTitle({ icon: Icon, title }: { icon: LucideIcon; title: string }) {
  return (
    <div className="mb-2.5 mt-1.5 flex items-center gap-1.5">
      <Icon size={15} className="text-obra-yellow" />
      <div className="font-display text-base font-bold uppercase tracking-wide text-obra-text">{title}</div>
    </div>
  );
}

function AddInline({
  placeholder,
  label,
  onAdd,
  className,
}: {
  placeholder: string;
  label: string;
  onAdd: (nombre: string) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className={clsx(
          "flex w-full items-center justify-center gap-1.5 rounded-[10px] border border-dashed border-obra-line py-2.5 text-[13px] font-semibold text-obra-text-dim",
          className
        )}
      >
        <Plus size={14} /> {label}
      </button>
    );
  }

  return (
    <Card className={clsx("p-3", className)}>
      <Input autoFocus value={value} onChange={(e) => setValue(e.target.value)} placeholder={placeholder} />
      <div className="mt-2.5 flex gap-2">
        <GhostButton onClick={() => { setOpen(false); setValue(""); }}>{tr("Cancelar")}</GhostButton>
        <PrimaryButton
          disabled={!value.trim()}
          onClick={() => {
            onAdd(value.trim());
            setValue("");
            setOpen(false);
          }}
        >
          {tr("Añadir")}
        </PrimaryButton>
      </div>
    </Card>
  );
}
