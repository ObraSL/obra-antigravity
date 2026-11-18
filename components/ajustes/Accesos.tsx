"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  Building2,
  Check,
  Copy,
  IdCard,
  Loader2,
  ShieldCheck,
  Trash2,
  UserPlus,
  QrCode,
} from "lucide-react";
import clsx from "clsx";
import { createClient } from "@/lib/supabase/client";
import { useObra } from "@/lib/obra-context";
import { useMiembro } from "@/lib/miembro-context";
import { ROLES, type Miembro, type Rol, type Trabajador } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Sheet } from "@/components/ui/Sheet";
import { GhostButton, PrimaryButton } from "@/components/ui/Button";
import { ModalQrInvitacion } from "./ModalQrInvitacion";
import { tr, trJsx } from "@/lib/i18n";

const etiquetaRol = (rol: Rol) => ROLES.find((r) => r.id === rol)?.label ?? rol;

/**
 * Quién puede entrar en la app y hasta dónde llega cada uno.
 * Solo la ve el dueño. Nadie puede subirse el nivel a sí mismo: cambiar
 * roles es cosa del dueño (así está también en la base de datos).
 */
export function Accesos() {
  const supabase = useMemo(() => createClient(), []);
  const { miembro: yo } = useMiembro();
  const { obras } = useObra();

  const [miembros, setMiembros] = useState<Miembro[]>([]);
  const [trabajadores, setTrabajadores] = useState<Trabajador[]>([]);
  const [codigoEmpresa, setCodigoEmpresa] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [abierto, setAbierto] = useState<Miembro | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [mostrarQr, setMostrarQr] = useState(false);

  const cargar = useCallback(async () => {
    const [m, t, e] = await Promise.all([
      supabase.from("miembros").select("*").order("created_at", { ascending: true }),
      supabase.from("trabajadores").select("*").order("nombre"),
      supabase.from("empresas").select("codigo").limit(1).maybeSingle(),
    ]);
    setMiembros((m.data as Miembro[]) ?? []);
    setTrabajadores((t.data as Trabajador[]) ?? []);
    setCodigoEmpresa((e.data as { codigo: string } | null)?.codigo ?? null);
    setCargando(false);
  }, [supabase]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const actualizar = async (userId: string, cambios: Partial<Miembro>) => {
    const { data } = await supabase
      .from("miembros")
      .update(cambios)
      .eq("user_id", userId)
      .select()
      .single();
    if (data) {
      const fila = data as Miembro;
      setMiembros((prev) => prev.map((m) => (m.user_id === userId ? fila : m)));
      setAbierto((a) => (a && a.user_id === userId ? fila : a));
    }
  };

  const eliminar = async (userId: string) => {
    await supabase.from("miembros").delete().eq("user_id", userId);
    setMiembros((prev) => prev.filter((m) => m.user_id !== userId));
    setAbierto(null);
  };

  const crearFicha = async (m: Miembro) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || !m.nombre) return;
    const { data } = await supabase
      .from("trabajadores")
      .insert({ owner_id: user.id, nombre: m.nombre })
      .select()
      .single();
    if (data) {
      setTrabajadores((prev) => [...prev, data].sort((a, b) => a.nombre.localeCompare(b.nombre)));
      await actualizar(m.user_id, { trabajador_id: data.id });
    }
  };

  if (cargando) {
    return (
      <div className="mb-7 flex justify-center py-6">
        <Loader2 className="animate-spin text-obra-yellow" size={20} />
      </div>
    );
  }

  const pendientes = miembros.filter((m) => !m.aprobado);
  const activos = miembros.filter((m) => m.aprobado);

  const enlaceInvitacion =
    codigoEmpresa && typeof window !== "undefined"
      ? `${window.location.origin}/login?empresa=${codigoEmpresa}`
      : null;

  const copiarEnlace = async () => {
    if (!enlaceInvitacion) return;
    await navigator.clipboard.writeText(enlaceInvitacion);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div className="mb-7">
      {enlaceInvitacion && (
        <Card className="mb-4 p-3.5">
          <div className="mb-2 text-[12.5px] font-bold uppercase tracking-wide text-obra-text-dim">
            {tr("Enlace para invitar a tu equipo")}
          </div>
          <div className="mb-2.5 truncate rounded-lg bg-obra-bg px-2.5 py-2 text-[12.5px] text-obra-text-faint font-mono">
            {enlaceInvitacion}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setMostrarQr(true)}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-[#d7dc9a]/40 bg-[#d7dc9a]/16 py-2.5 text-[13px] font-bold text-[#d7dc9a] transition hover:bg-[#d7dc9a]/25 active:scale-[0.98]"
            >
              <QrCode size={15} /> {tr("Mostrar código QR")}
            </button>
            <button
              type="button"
              onClick={copiarEnlace}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-obra-line py-2.5 text-[13px] font-semibold text-obra-text-dim transition hover:bg-white/5 active:scale-[0.98]"
            >
              <Copy size={14} /> {copiado ? tr("¡Copiado!") : tr("Copiar enlace")}
            </button>
          </div>
        </Card>
      )}

      {mostrarQr && codigoEmpresa && enlaceInvitacion && (
        <ModalQrInvitacion
          codigoEmpresa={codigoEmpresa}
          enlaceInvitacion={enlaceInvitacion}
          onClose={() => setMostrarQr(false)}
        />
      )}

      {pendientes.length > 0 && (
        <>
          <div className="mb-2 flex items-center gap-1.5 text-[12.5px] font-bold uppercase tracking-wide text-obra-yellow">
            <UserPlus size={14} /> {tr("Esperando tu aprobación ({n})", { n: pendientes.length })}
          </div>
          <div className="mb-4 flex flex-col gap-2">
            {pendientes.map((m) => (
              <FilaMiembro key={m.user_id} m={m} onClick={() => setAbierto(m)} />
            ))}
          </div>
        </>
      )}

      <div className="flex flex-col gap-2">
        {activos.map((m) => (
          <FilaMiembro
            key={m.user_id}
            m={m}
            esYo={m.user_id === yo?.user_id}
            obraNombre={obras.find((o) => o.id === m.obra_id)?.nombre}
            onClick={() => m.user_id !== yo?.user_id && setAbierto(m)}
          />
        ))}
      </div>

      <div className="mt-2.5 rounded-xl border border-dashed border-obra-line px-3.5 py-3 text-[12.5px] leading-relaxed text-obra-text-faint">
        {trJsx("Quien se registre con su correo aparecerá aquí como {pendiente}. Hasta que tú no le des acceso, no ve nada de las obras.", {
          pendiente: <span className="font-semibold text-obra-text-dim">{tr("pendiente")}</span>,
        })}
      </div>

      {abierto && (
        <Sheet title={abierto.nombre || abierto.email} onClose={() => setAbierto(null)}>
          <DetalleMiembro
            m={abierto}
            obras={obras}
            trabajadores={trabajadores}
            onActualizar={(cambios) => actualizar(abierto.user_id, cambios)}
            onCrearFicha={() => crearFicha(abierto)}
            onEliminar={() => eliminar(abierto.user_id)}
          />
        </Sheet>
      )}
    </div>
  );
}

function FilaMiembro({
  m,
  esYo,
  obraNombre,
  onClick,
}: {
  m: Miembro;
  esYo?: boolean;
  obraNombre?: string;
  onClick: () => void;
}) {
  return (
    <Card
      role={esYo ? undefined : "button"}
      onClick={onClick}
      className={clsx("flex items-center gap-3 p-3", !esYo && "cursor-pointer")}
    >
      <div
        className={clsx(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
          m.aprobado ? "bg-obra-bg text-obra-yellow" : "bg-obra-yellow/12 text-obra-yellow"
        )}
      >
        {m.aprobado ? <BadgeCheck size={17} /> : <UserPlus size={17} />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[14.5px] font-semibold text-obra-text">
          {m.nombre || m.email}
          {esYo && <span className="ml-1.5 text-[12px] font-normal text-obra-text-faint">{tr("(tú)")}</span>}
        </div>
        {m.nombre && <div className="truncate text-[12px] text-obra-text-faint">{m.email}</div>}
      </div>
      <div className="shrink-0 text-right">
        <div className="text-[11.5px] font-bold uppercase text-obra-text-dim">
          {m.aprobado ? etiquetaRol(m.rol) : tr("Pendiente")}
        </div>
        {obraNombre && (
          <div className="max-w-[110px] truncate text-[11px] text-obra-text-faint">{obraNombre}</div>
        )}
      </div>
    </Card>
  );
}

function DetalleMiembro({
  m,
  obras,
  trabajadores,
  onActualizar,
  onCrearFicha,
  onEliminar,
}: {
  m: Miembro;
  obras: { id: string; nombre: string }[];
  trabajadores: Trabajador[];
  onActualizar: (cambios: Partial<Miembro>) => void;
  onCrearFicha: () => void;
  onEliminar: () => void;
}) {
  const [confirmando, setConfirmando] = useState(false);
  const fichaExistente = trabajadores.some((t) => t.id === m.trabajador_id);

  return (
    <div>
      <div className="mb-4 text-[12.5px] text-obra-text-faint">{m.email}</div>

      <Bloque icono={ShieldCheck} titulo={tr("Nivel de acceso")}>
        <div className="flex flex-col gap-2">
          {ROLES.map((r) => (
            <button
              key={r.id}
              onClick={() =>
                onActualizar({ rol: r.id, ...(r.id !== "jefe_obra" ? { obra_id: null } : {}) })
              }
              className={clsx(
                "flex items-start gap-2.5 rounded-xl border p-3 text-left",
                m.rol === r.id
                  ? "border-obra-yellow bg-obra-yellow/10"
                  : "border-obra-card-border bg-obra-card"
              )}
            >
              <div className="min-w-0 flex-1">
                <div className="text-[14px] font-bold text-obra-text">{tr(r.label)}</div>
                <div className="mt-0.5 text-[12px] leading-snug text-obra-text-faint">
                  {tr(r.descripcion)}
                </div>
              </div>
              {m.rol === r.id && <Check size={16} className="mt-0.5 shrink-0 text-obra-yellow" />}
            </button>
          ))}
        </div>
      </Bloque>

      {m.rol === "jefe_obra" && (
        <Bloque icono={Building2} titulo={tr("Obra que lleva")}>
          <div className="flex flex-col gap-2">
            {obras.map((o) => (
              <Opcion
                key={o.id}
                activa={m.obra_id === o.id}
                onClick={() => onActualizar({ obra_id: o.id })}
              >
                {o.nombre}
              </Opcion>
            ))}
          </div>
        </Bloque>
      )}

      {m.rol === "trabajador" && (
        <Bloque icono={IdCard} titulo={tr("Ficha de trabajador")}>
          <div className="mb-2 text-[12.5px] leading-relaxed text-obra-text-faint">
            {tr("Enlaza esta cuenta con su ficha para que sus horas se apunten donde toca.")}
          </div>
          <div className="flex flex-col gap-2">
            {trabajadores.map((t) => (
              <Opcion
                key={t.id}
                activa={m.trabajador_id === t.id}
                onClick={() => onActualizar({ trabajador_id: t.id })}
              >
                {t.nombre}
              </Opcion>
            ))}
          </div>
          {m.nombre && !fichaExistente && (
            <button
              onClick={onCrearFicha}
              className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-obra-line py-2.5 text-[13px] font-semibold text-obra-text-dim"
            >
              <UserPlus size={14} /> {tr("Crear ficha «{nombre}»", { nombre: m.nombre })}
            </button>
          )}
        </Bloque>
      )}

      <div className="mt-5 flex flex-col gap-2">
        {m.aprobado ? (
          <GhostButton onClick={() => onActualizar({ aprobado: false })}>
            {tr("Suspender acceso")}
          </GhostButton>
        ) : (
          <PrimaryButton onClick={() => onActualizar({ aprobado: true })}>
            <Check size={16} /> {tr("Dar acceso")}
          </PrimaryButton>
        )}

        {!confirmando ? (
          <button
            onClick={() => setConfirmando(true)}
            className="flex items-center justify-center gap-1.5 py-2 text-[13px] font-semibold text-obra-text-faint"
          >
            <Trash2 size={14} /> {tr("Eliminar de la lista")}
          </button>
        ) : (
          <div className="flex gap-2">
            <GhostButton onClick={() => setConfirmando(false)}>{tr("Cancelar")}</GhostButton>
            <GhostButton
              onClick={onEliminar}
              className="border-obra-red/40 font-bold text-obra-red-text"
            >
              {tr("Sí, eliminar")}
            </GhostButton>
          </div>
        )}
      </div>
    </div>
  );
}

function Bloque({
  icono: Icono,
  titulo,
  children,
}: {
  icono: typeof ShieldCheck;
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-5">
      <div className="mb-2 flex items-center gap-1.5">
        <Icono size={14} className="text-obra-yellow" />
        <div className="text-[12.5px] font-bold uppercase tracking-wide text-obra-text-dim">
          {titulo}
        </div>
      </div>
      {children}
    </div>
  );
}

function Opcion({
  activa,
  onClick,
  children,
}: {
  activa: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-left text-[14px] font-semibold",
        activa
          ? "border-obra-yellow bg-obra-yellow/10 text-obra-text"
          : "border-obra-card-border bg-obra-card text-obra-text-dim"
      )}
    >
      {children}
      {activa && <Check size={15} className="shrink-0 text-obra-yellow" />}
    </button>
  );
}
