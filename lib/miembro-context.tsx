"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { tr } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";
import type { Miembro, Rol } from "@/lib/types";
import { MODULOS_POR_DEFECTO, modulosDesdeFila, type ClaveModulo, type Modulos } from "@/lib/modulos";

/**
 * Quién es el que está usando la app y qué puede hacer.
 *
 * La seguridad de verdad está en la base de datos (RLS): aunque alguien
 * trucara la app, seguiría sin poder leer lo que no le toca. Esto de aquí
 * es solo para no enseñar botones que luego no van a funcionar.
 */
type MiembroContextValue = {
  miembro: Miembro | null;
  loading: boolean;
  rol: Rol | null;
  esDueno: boolean;
  esTrabajador: boolean;
  /** Dueño, manager o jefe de obra: ven gastos, facturas, vehículos, resumen… */
  gestiona: boolean;
  /** No es lo mismo que "dueño": ve la lista de TODAS las empresas, no una en concreto. */
  esAdminPlataforma: boolean;
  /** La empresa tiene la prueba/suscripción caducada o la ha bloqueado el admin. */
  suscripcionInactiva: boolean;
  /** Qué partes de la app tiene encendidas la empresa (Ajustes → Módulos). */
  modulos: Modulos;
  guardarModulo: (clave: ClaveModulo, valor: boolean) => Promise<void>;
  refrescar: () => Promise<void>;
  /** El que acaba de registrarse escribe su nombre para que el dueño lo reconozca. */
  guardarNombre: (nombre: string) => Promise<string | null>;
};

const MiembroContext = createContext<MiembroContextValue | null>(null);

export function MiembroProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => createClient(), []);
  const [miembro, setMiembro] = useState<Miembro | null>(null);
  const [esAdminPlataforma, setEsAdminPlataforma] = useState(false);
  const [suscripcionInactiva, setSuscripcionInactiva] = useState(false);
  const [modulos, setModulos] = useState<Modulos>(MODULOS_POR_DEFECTO);
  const [loading, setLoading] = useState(true);

  const cargar = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setMiembro(null);
      setEsAdminPlataforma(false);
      setLoading(false);
      return;
    }
    // Hay que filtrar por user_id sí o sí: el dueño puede leer las filas de
    // todos, así que sin filtro esto devolvería varias y no sabríamos cuál
    // es la suya.
    const [{ data }, admin] = await Promise.all([
      supabase.from("miembros").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.rpc("soy_admin_plataforma"),
    ]);
    setMiembro((data as Miembro) ?? null);

    // La política "empresas propia" solo enseña la empresa de uno; se lee
    // aparte de mi_empresa_id() a propósito, porque esa deja de devolver
    // nada justo cuando la suscripción está caducada.
    const { data: empresa } = await supabase
      .from("empresas")
      .select("activa_hasta, bloqueada")
      .maybeSingle();
    setSuscripcionInactiva(
      Boolean(
        empresa &&
          (empresa.bloqueada ||
            (empresa.activa_hasta && new Date(empresa.activa_hasta).getTime() <= Date.now()))
      )
    );
    setEsAdminPlataforma(Boolean(admin.data));

    const { data: ajustes } = await supabase.from("ajustes").select("*").limit(1).maybeSingle();
    setModulos(modulosDesdeFila(ajustes));
    setLoading(false);
  }, [supabase]);

  const guardarModulo = useCallback(
    async (clave: ClaveModulo, valor: boolean) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setModulos((m) => ({ ...m, [clave]: valor }));
      await supabase
        .from("ajustes")
        .upsert({ owner_id: user.id, [`mod_${clave}`]: valor, updated_at: new Date().toISOString() });
    },
    [supabase]
  );

  useEffect(() => {
    cargar();
  }, [cargar]);

  const guardarNombre = useCallback(
    async (nombre: string) => {
      const { error } = await supabase.rpc("guardar_mi_nombre", { nuevo: nombre });
      if (error) return tr("No se pudo guardar el nombre. Inténtalo otra vez.");
      await cargar();
      return null;
    },
    [supabase, cargar]
  );

  const rol = miembro?.aprobado ? miembro.rol : null;

  const value: MiembroContextValue = {
    miembro,
    loading,
    rol,
    esDueno: rol === "dueno",
    esTrabajador: rol === "trabajador",
    gestiona: rol === "dueno" || rol === "manager" || rol === "jefe_obra",
    esAdminPlataforma,
    suscripcionInactiva,
    modulos,
    guardarModulo,
    refrescar: cargar,
    guardarNombre,
  };

  return <MiembroContext.Provider value={value}>{children}</MiembroContext.Provider>;
}

export function useMiembro() {
  const ctx = useContext(MiembroContext);
  if (!ctx) throw new Error("useMiembro debe usarse dentro de <MiembroProvider>");
  return ctx;
}
