"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { createClient } from "@/lib/supabase/client";
import type { Obra } from "@/lib/types";
import { todayStr } from "@/lib/format";

const STORAGE_KEY = "control-de-obra:obra-id";

type ObraContextValue = {
  obras: Obra[];
  obraActual: Obra | null;
  obraId: string | null;
  loading: boolean;
  setObraId: (id: string) => void;
  crearObra: (nombre: string, direccion: string) => Promise<Obra | null>;
  toggleObraActiva: (id: string) => Promise<void>;
  refrescar: () => Promise<void>;
  /** Horas de la jornada normal: lo que pase de ahí cuenta como horas extra. */
  jornadaHoras: number;
  guardarJornada: (horas: number) => Promise<void>;
  /** Si un jefe_obra ve todas las obras de la empresa, o solo la suya. */
  jefeVeTodas: boolean;
  guardarJefeVeTodas: (valor: boolean) => Promise<void>;
};

const JORNADA_POR_DEFECTO = 8;

const ObraContext = createContext<ObraContextValue | null>(null);

export function ObraProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => createClient(), []);
  const [obras, setObras] = useState<Obra[]>([]);
  const [obraId, setObraIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [jornadaHoras, setJornadaHoras] = useState(JORNADA_POR_DEFECTO);
  const [jefeVeTodas, setJefeVeTodas] = useState(false);

  useEffect(() => {
    supabase
      .from("ajustes")
      .select("jornada_horas,jefe_ve_todas")
      .maybeSingle()
      .then(({ data }) => {
        if (data?.jornada_horas) setJornadaHoras(Number(data.jornada_horas));
        setJefeVeTodas(Boolean(data?.jefe_ve_todas));
      });
  }, [supabase]);

  const guardarJornada = useCallback(
    async (horas: number) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setJornadaHoras(horas);
      await supabase
        .from("ajustes")
        .upsert({ owner_id: user.id, jornada_horas: horas, updated_at: new Date().toISOString() });
    },
    [supabase]
  );

  const guardarJefeVeTodas = useCallback(
    async (valor: boolean) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setJefeVeTodas(valor);
      await supabase
        .from("ajustes")
        .upsert({ owner_id: user.id, jefe_ve_todas: valor, updated_at: new Date().toISOString() });
    },
    [supabase]
  );

  const cargar = useCallback(async () => {
    const { data, error } = await supabase
      .from("obras")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setObras(data);
      // Si ya hay una obra elegida en esta sesión (aunque esté cerrada: puede
      // que se haya abierto a propósito desde Ajustes para verla), se
      // respeta. Solo el arranque en frío prefiere una obra activa: no tiene
      // sentido empezar el día en la última guardada si ahora está cerrada.
      const activas = data.filter((o) => o.activa);
      setObraIdState((current) => {
        if (current && data.some((o) => o.id === current)) return current;
        const stored = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
        if (stored && activas.some((o) => o.id === stored)) return stored;
        return activas[0]?.id ?? data[0]?.id ?? null;
      });
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const setObraId = useCallback((id: string) => {
    setObraIdState(id);
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, id);
  }, []);

  const crearObra = useCallback(
    async (nombre: string, direccion: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("obras")
        .insert({ owner_id: user.id, nombre, direccion: direccion || null, activa: true })
        .select()
        .single();

      if (error || !data) return null;
      setObras((prev) => [data, ...prev]);
      setObraId(data.id);
      return data;
    },
    [supabase, setObraId]
  );

  const toggleObraActiva = useCallback(
    async (id: string) => {
      const obra = obras.find((o) => o.id === id);
      if (!obra) return;
      const { data, error } = await supabase
        .from("obras")
        .update({ activa: !obra.activa })
        .eq("id", id)
        .select()
        .single();
      if (!error && data) {
        setObras((prev) => prev.map((o) => (o.id === id ? data : o)));
      }
    },
    [obras, supabase]
  );

  const obraActual = obras.find((o) => o.id === obraId) ?? null;

  const value: ObraContextValue = {
    obras,
    obraActual,
    obraId,
    loading,
    setObraId,
    crearObra,
    toggleObraActiva,
    refrescar: cargar,
    jornadaHoras,
    guardarJornada,
    jefeVeTodas,
    guardarJefeVeTodas,
  };

  return <ObraContext.Provider value={value}>{children}</ObraContext.Provider>;
}

export function useObra() {
  const ctx = useContext(ObraContext);
  if (!ctx) throw new Error("useObra debe usarse dentro de <ObraProvider>");
  return ctx;
}

// Se re-exporta aquí para que las páginas no tengan que importar de dos
// sitios distintos solo para saber "hoy".
export { todayStr };
