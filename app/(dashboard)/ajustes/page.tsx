"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Blocks, Building2, ChevronRight, Clock, Coins, HardHat, KeyRound, Languages, LogOut, MapPin, Plus, Scale, Shield, ShieldAlert, ShieldCheck, Trash2, Truck, UserCheck, Users } from "lucide-react";
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
import { ModalEliminarCuenta } from "@/components/ajustes/ModalEliminarCuenta";
import { ModalConsentimientoLegal } from "@/components/legal/ModalConsentimientoLegal";
import { PerfilUsuario } from "@/components/ajustes/PerfilUsuario";
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
  const [eliminandoCuenta, setEliminandoCuenta] = useState(false);
  const [viendoConsentimiento, setViendoConsentimiento] = useState(false);

  const [trabajadores, setTrabajadores] = useState<Trabajador[]>([]);
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [editandoTrabajador, setEditandoTrabajador] = useState<Trabajador | null>(null);
  const [tarifaInput, setTarifaInput] = useState<string>("");
  const [tipoTarifaInput, setTipoTarifaInput] = useState<"hora" | "dia">("hora");

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

  const abrirEditarTrabajador = (t: Trabajador) => {
    setEditandoTrabajador(t);
    setTarifaInput(t.tarifa != null ? String(t.tarifa) : "");
    setTipoTarifaInput(t.tipo_tarifa ?? "hora");
  };

  const guardarTarifaTrabajador = async () => {
    if (!editandoTrabajador) return;
    const numTarifa = tarifaInput.trim() ? Number(tarifaInput.replace(",", ".")) : null;
    const { data, error } = await supabase
      .from("trabajadores")
      .update({
        tipo_tarifa: tipoTarifaInput,
        tarifa: numTarifa && !isNaN(numTarifa) ? numTarifa : null,
      })
      .eq("id", editandoTrabajador.id)
      .select()
      .single();

    if (!error && data) {
      setTrabajadores((prev) => prev.map((t) => (t.id === editandoTrabajador.id ? (data as Trabajador) : t)));
      setEditandoTrabajador(null);
    }
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
      <SectionTitle icon={UserCheck} title={tr("Mi cuenta y perfil")} />
      <PerfilUsuario />

      <SectionTitle icon={ShieldCheck} title={tr("Administración de la plataforma")} />
      <Card className="mb-7 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-[#d7dc9a]/30 bg-gradient-to-r from-[#1b231c] to-[#141a16]">
        <div>
          <div className="text-[14.5px] font-bold text-white flex items-center gap-1.5">
            <span>{tr("Consola Superadmin")}</span>
            <span className="rounded-full bg-[#d7dc9a]/20 px-2 py-0.5 text-[10px] font-bold text-[#d7dc9a] uppercase">
              /admin
            </span>
          </div>
          <div className="text-[12px] text-white/65 mt-0.5">
            {tr("Gestión global de empresas, licencias, códigos y errores")}
          </div>
        </div>
        <Link
          href="/admin"
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#d7dc9a] px-4 py-2.5 text-xs font-bold text-[#141a16] shadow-md transition hover:bg-[#c8cd8b] active:scale-95 shrink-0"
        >
          <span>{tr("Entrar a /admin")}</span>
          <ChevronRight size={14} />
        </Link>
      </Card>

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
          <Card key={t.id} className="flex items-center justify-between p-3.5">
            <div
              className="min-w-0 flex-1 cursor-pointer pr-2"
              onClick={() => abrirEditarTrabajador(t)}
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[14.5px] font-semibold text-obra-text">{t.nombre}</span>
                {t.tarifa ? (
                  <span className="inline-flex items-center gap-1 rounded-md bg-[#d7dc9a]/15 px-2 py-0.5 text-[11px] font-mono font-bold text-[#d7dc9a]">
                    <Coins size={11} />
                    {t.tarifa} €/{t.tipo_tarifa === "dia" ? tr("día") : tr("h")}
                  </span>
                ) : (
                  <span className="text-[11px] text-obra-text-faint italic">{tr("Sin tarifa")}</span>
                )}
              </div>
              <div className="text-[11.5px] text-obra-text-faint mt-0.5">
                {tr("Toca para editar tarifa y pagos")}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => toggleTrabajadorActivo(t.id)}
                className={clsx(
                  "rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase transition",
                  t.activo ? "border-obra-green text-obra-green hover:bg-obra-green/10" : "border-obra-line text-obra-text-faint hover:bg-white/5"
                )}
              >
                {t.activo ? tr("Activo") : tr("Baja")}
              </button>
            </div>
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

      <SectionTitle icon={Shield} title={tr("Privacidad y seguridad")} />
      <Card className="mb-7 p-4 space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-[13px]">
          <div>
            <div className="font-semibold text-obra-text">{tr("RGPD y cumplimiento legal")}</div>
            <div className="text-[12px] text-obra-text-faint">{tr("Consulta cómo protegemos tus datos y los registros laborales de tu empresa.")}</div>
          </div>
          <div className="flex items-center gap-3 shrink-0 pt-1 sm:pt-0">
            <Link href="/privacidad" className="text-xs font-bold text-obra-yellow hover:underline">
              {tr("Política de privacidad")}
            </Link>
            <span className="text-obra-line">·</span>
            <Link href="/terminos" className="text-xs font-bold text-obra-yellow hover:underline">
              {tr("Términos del servicio")}
            </Link>
          </div>
        </div>
        <div className="border-t border-obra-line pt-3 flex items-center justify-between">
          <div>
            <div className="text-[13px] font-semibold text-obra-text">{tr("Descargo de responsabilidad")}</div>
            <div className="text-[11.5px] text-obra-text-faint">{tr("Software «tal cual» (AS IS) y descargo legal")}</div>
          </div>
          <button
            type="button"
            onClick={() => setViendoConsentimiento(true)}
            className="flex items-center gap-1.5 rounded-lg border border-obra-line bg-white/5 px-3 py-1.5 text-xs font-semibold text-obra-text hover:bg-white/10 transition"
          >
            <Scale size={13} className="text-obra-yellow" />
            <span>{tr("Ver descargo y permisos")}</span>
          </button>
        </div>
        <div className="border-t border-obra-line pt-3 flex items-center justify-between">
          <div>
            <div className="text-[13px] font-semibold text-red-400">{tr("Zona de peligro")}</div>
            <div className="text-[11.5px] text-obra-text-faint">Apple Guideline 5.1.1(v) · {tr("Eliminar cuenta")}</div>
          </div>
          <button
            type="button"
            onClick={() => setEliminandoCuenta(true)}
            className="flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-950/20 px-3 py-1.5 text-xs font-bold text-red-400 hover:bg-red-500/20 transition"
          >
            <Trash2 size={13} />
            <span>{tr("Eliminar cuenta")}</span>
          </button>
        </div>
      </Card>

      <button
        onClick={cerrarSesion}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-obra-line py-3 text-[13.5px] font-semibold text-obra-text-faint md:hidden"
      >
        <LogOut size={16} /> {tr("Cerrar sesión")}
      </button>

      {eliminandoCuenta && (
        <ModalEliminarCuenta onClose={() => setEliminandoCuenta(false)} />
      )}

      {viendoConsentimiento && (
        <ModalConsentimientoLegal forzarAbierto onClose={() => setViendoConsentimiento(false)} />
      )}

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

      {editandoTrabajador && (
        <Sheet
          title={tr("Tarifa · {trabajador}", { trabajador: editandoTrabajador.nombre })}
          onClose={() => setEditandoTrabajador(null)}
        >
          <div className="space-y-4">
            <div className="text-[13px] text-obra-text-dim">
              {tr("Configura cómo se calculan las ganancias de este trabajador.")}
            </div>

            <div>
              <label className="text-xs font-semibold text-white/70 uppercase tracking-wider block mb-1.5">
                {tr("Tipo de pago")}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTipoTarifaInput("hora")}
                  className={clsx(
                    "rounded-xl border p-3 text-center transition",
                    tipoTarifaInput === "hora"
                      ? "border-[#d7dc9a] bg-[#d7dc9a]/12 text-[#d7dc9a] font-bold"
                      : "border-white/12 bg-white/5 text-white/70 hover:bg-white/10"
                  )}
                >
                  <div className="text-sm font-semibold">{tr("Por hora (€/h)")}</div>
                  <div className="text-[11px] opacity-75 mt-0.5">{tr("Multiplica las horas")}</div>
                </button>

                <button
                  type="button"
                  onClick={() => setTipoTarifaInput("dia")}
                  className={clsx(
                    "rounded-xl border p-3 text-center transition",
                    tipoTarifaInput === "dia"
                      ? "border-[#d7dc9a] bg-[#d7dc9a]/12 text-[#d7dc9a] font-bold"
                      : "border-white/12 bg-white/5 text-white/70 hover:bg-white/10"
                  )}
                >
                  <div className="text-sm font-semibold">{tr("Por día (€/día)")}</div>
                  <div className="text-[11px] opacity-75 mt-0.5">{tr("Multiplica días trabajados")}</div>
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-white/70 uppercase tracking-wider block mb-1.5">
                {tipoTarifaInput === "dia" ? tr("Precio por día (€)") : tr("Precio por hora (€)")}
              </label>
              <div className="relative">
                <Input
                  type="number"
                  inputMode="decimal"
                  step="0.5"
                  min="0"
                  placeholder={tipoTarifaInput === "dia" ? "120" : "15"}
                  value={tarifaInput}
                  onChange={(e) => setTarifaInput(e.target.value)}
                  className="pr-10 font-mono text-base"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-semibold text-white/50">€</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <GhostButton onClick={() => setEditandoTrabajador(null)}>
                {tr("Cancelar")}
              </GhostButton>
              <PrimaryButton onClick={guardarTarifaTrabajador}>
                {tr("Guardar tarifa")}
              </PrimaryButton>
            </div>
          </div>
        </Sheet>
      )}
    </div>
  );
}

/** Ajustes de un trabajador: solo su cuenta. */
function AjustesTrabajador() {
  const router = useRouter();
  const [eliminandoCuenta, setEliminandoCuenta] = useState(false);
  const [viendoConsentimiento, setViendoConsentimiento] = useState(false);

  const cerrarSesion = async () => {
    await createClient().auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <div>
      <SectionTitle icon={UserCheck} title={tr("Mi cuenta y perfil")} />
      <PerfilUsuario />

      <SectionTitle icon={ShieldCheck} title={tr("Administración de la plataforma")} />
      <Card className="mb-7 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-[#d7dc9a]/30 bg-gradient-to-r from-[#1b231c] to-[#141a16]">
        <div>
          <div className="text-[14.5px] font-bold text-white flex items-center gap-1.5">
            <span>{tr("Consola Superadmin")}</span>
            <span className="rounded-full bg-[#d7dc9a]/20 px-2 py-0.5 text-[10px] font-bold text-[#d7dc9a] uppercase">
              /admin
            </span>
          </div>
          <div className="text-[12px] text-white/65 mt-0.5">
            {tr("Gestión global de empresas, licencias, códigos y errores")}
          </div>
        </div>
        <Link
          href="/admin"
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#d7dc9a] px-4 py-2.5 text-xs font-bold text-[#141a16] shadow-md transition hover:bg-[#c8cd8b] active:scale-95 shrink-0"
        >
          <span>{tr("Entrar a /admin")}</span>
          <ChevronRight size={14} />
        </Link>
      </Card>

      <SectionTitle icon={Languages} title={tr("Idioma")} />
      <div className="mb-7">
        <SelectorIdioma />
      </div>

      <SectionTitle icon={Shield} title={tr("Privacidad y seguridad")} />
      <Card className="mb-7 p-4 space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-[13px]">
          <div>
            <div className="font-semibold text-obra-text">{tr("RGPD y cumplimiento legal")}</div>
            <div className="text-[12px] text-obra-text-faint">{tr("Consulta cómo protegemos tus datos y los registros laborales de tu empresa.")}</div>
          </div>
          <div className="flex items-center gap-3 shrink-0 pt-1 sm:pt-0">
            <Link href="/privacidad" className="text-xs font-bold text-obra-yellow hover:underline">
              {tr("Política de privacidad")}
            </Link>
            <span className="text-obra-line">·</span>
            <Link href="/terminos" className="text-xs font-bold text-obra-yellow hover:underline">
              {tr("Términos del servicio")}
            </Link>
          </div>
        </div>
        <div className="border-t border-obra-line pt-3 flex items-center justify-between">
          <div>
            <div className="text-[13px] font-semibold text-obra-text">{tr("Descargo de responsabilidad")}</div>
            <div className="text-[11.5px] text-obra-text-faint">{tr("Software «tal cual» (AS IS) y descargo legal")}</div>
          </div>
          <button
            type="button"
            onClick={() => setViendoConsentimiento(true)}
            className="flex items-center gap-1.5 rounded-lg border border-obra-line bg-white/5 px-3 py-1.5 text-xs font-semibold text-obra-text hover:bg-white/10 transition"
          >
            <Scale size={13} className="text-obra-yellow" />
            <span>{tr("Ver descargo y permisos")}</span>
          </button>
        </div>
        <div className="border-t border-obra-line pt-3 flex items-center justify-between">
          <div>
            <div className="text-[13px] font-semibold text-red-400">{tr("Zona de peligro")}</div>
            <div className="text-[11.5px] text-obra-text-faint">Apple Guideline 5.1.1(v) · {tr("Eliminar mi cuenta")}</div>
          </div>
          <button
            type="button"
            onClick={() => setEliminandoCuenta(true)}
            className="flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-950/20 px-3 py-1.5 text-xs font-bold text-red-400 hover:bg-red-500/20 transition"
          >
            <Trash2 size={13} />
            <span>{tr("Eliminar mi cuenta")}</span>
          </button>
        </div>
      </Card>

      <button
        onClick={cerrarSesion}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-obra-line py-3 text-[13.5px] font-semibold text-obra-text-faint"
      >
        <LogOut size={16} /> {tr("Cerrar sesión")}
      </button>

      {eliminandoCuenta && (
        <ModalEliminarCuenta onClose={() => setEliminandoCuenta(false)} />
      )}

      {viendoConsentimiento && (
        <ModalConsentimientoLegal forzarAbierto onClose={() => setViendoConsentimiento(false)} />
      )}
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
