"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Building2,
  Calendar,
  Check,
  ChevronRight,
  Clock,
  Copy,
  ExternalLink,
  Filter,
  KeyRound,
  Loader2,
  Mail,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
  Wrench,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { CodigoAlta, EmpresaAdmin, ErrorApp } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Empty } from "@/components/ui/Empty";
import { GhostButton, PrimaryButton } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { Sheet } from "@/components/ui/Sheet";
import { localeActual, tr, trN } from "@/lib/i18n";
import clsx from "clsx";

const fecha = (iso: string) => new Date(iso).toLocaleDateString(localeActual());

type FiltroEstado = "todas" | "activas" | "prueba" | "por_caducar" | "caducadas" | "bloqueadas";

/** Datos de demostración de alta fidelidad si la base de datos aún no tiene empresas registradas */
const EMPRESAS_DEMO: EmpresaAdmin[] = [
  {
    id: "demo-empresa-1",
    nombre: "Construcciones Pérez S.L.",
    codigo: "OBRA-8821-XP",
    created_at: new Date(Date.now() - 45 * 86_400_000).toISOString(),
    miembros_count: 8,
    obras_count: 3,
    activa_hasta: new Date(Date.now() + 24 * 86_400_000).toISOString(),
    bloqueada: false,
    codigo_alta: "ALTA-PZ2026",
    email_contacto: "antonio@perezobras.es",
    telefono_contacto: "+34 612 345 678",
    responsable_nombre: "Antonio Pérez",
  },
  {
    id: "demo-empresa-2",
    nombre: "Reformas Barcelona Pro",
    codigo: "OBRA-4490-BC",
    created_at: new Date(Date.now() - 6 * 86_400_000).toISOString(),
    miembros_count: 4,
    obras_count: 1,
    activa_hasta: new Date(Date.now() + 8 * 86_400_000).toISOString(),
    bloqueada: false,
    codigo_alta: "PROMO-BCN-14",
    email_contacto: "jordi@reformasbarcelona.cat",
    telefono_contacto: "+34 689 443 211",
    responsable_nombre: "Jordi Valls",
  },
  {
    id: "demo-empresa-3",
    nombre: "Estructuras y Hormigón Norte",
    codigo: "OBRA-1205-NT",
    created_at: new Date(Date.now() - 90 * 86_400_000).toISOString(),
    miembros_count: 14,
    obras_count: 5,
    activa_hasta: new Date(Date.now() + 2 * 86_400_000).toISOString(),
    bloqueada: false,
    codigo_alta: "ALTA-NORTE-99",
    email_contacto: "direccion@estructurasnorte.com",
    telefono_contacto: "+34 655 778 899",
    responsable_nombre: "Carlos Menéndez",
  },
];

/** Estado computado de suscripción */
function clasificarSuscripcion(e: EmpresaAdmin): {
  tipo: "bloqueada" | "sin_caducidad" | "prueba" | "gracia" | "activa" | "caducada";
  etiqueta: string;
  badgeClase: string;
  diasRestantes: number | null;
} {
  if (e.bloqueada) {
    return {
      tipo: "bloqueada",
      etiqueta: tr("Bloqueada"),
      badgeClase: "border-red-500/40 bg-red-950/40 text-red-400",
      diasRestantes: null,
    };
  }
  if (!e.activa_hasta) {
    return {
      tipo: "sin_caducidad",
      etiqueta: tr("Sin caducidad"),
      badgeClase: "border-emerald-500/40 bg-emerald-950/30 text-emerald-400",
      diasRestantes: null,
    };
  }

  const dias = Math.ceil((new Date(e.activa_hasta).getTime() - Date.now()) / 86_400_000);

  // Si fue creada hace menos de 15 días y tiene días
  const antiguedadDias = Math.ceil((Date.now() - new Date(e.created_at).getTime()) / 86_400_000);
  const esPrueba = antiguedadDias <= 15 && dias > 0;

  if (dias <= 0) {
    return {
      tipo: "caducada",
      etiqueta: tr("Caducada el {fecha}", { fecha: fecha(e.activa_hasta) }),
      badgeClase: "border-red-500/40 bg-red-950/40 text-red-400",
      diasRestantes: dias,
    };
  }

  if (dias <= 3) {
    return {
      tipo: "gracia",
      etiqueta: tr("Período de gracia ({dias} d)", { dias }),
      badgeClase: "border-amber-500/40 bg-amber-950/30 text-amber-400",
      diasRestantes: dias,
    };
  }

  if (esPrueba) {
    return {
      tipo: "prueba",
      etiqueta: tr("En prueba ({dias} d)", { dias }),
      badgeClase: "border-[#d7dc9a]/40 bg-[#d7dc9a]/15 text-[#d7dc9a]",
      diasRestantes: dias,
    };
  }

  return {
    tipo: "activa",
    etiqueta: tr("Activa hasta {fecha} ({dias} d)", { fecha: fecha(e.activa_hasta), dias }),
    badgeClase: "border-green-500/40 bg-green-950/30 text-green-400",
    diasRestantes: dias,
  };
}

export default function AdminEmpresasPage() {
  const supabase = useMemo(() => createClient(), []);

  const [tabActiva, setTabActiva] = useState<"empresas" | "codigos" | "errores">("empresas");
  const [empresas, setEmpresas] = useState<EmpresaAdmin[]>([]);
  const [codigos, setCodigos] = useState<CodigoAlta[]>([]);
  const [errores, setErrores] = useState<ErrorApp[]>([]);
  const [cargando, setCargando] = useState(true);

  // Filtros y búsqueda
  const [filtro, setFiltro] = useState<FiltroEstado>("todas");
  const [busqueda, setBusqueda] = useState("");

  // Modal de detalles de empresa
  const [empresaDetalle, setEmpresaDetalle] = useState<EmpresaAdmin | null>(null);

  // Creación de código
  const [notaCodigo, setNotaCodigo] = useState("");
  const [diasValidez, setDiasValidez] = useState<number>(14);
  const [creandoCodigo, setCreandoCodigo] = useState(false);
  const [errorCodigo, setErrorCodigo] = useState("");

  // Portapapeles
  const [copiado, setCopiado] = useState<string | null>(null);

  // Error expandido
  const [errorAbierto, setErrorAbierto] = useState<number | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const [a, b, c, duenosRes] = await Promise.all([
        supabase.rpc("listar_empresas_admin"),
        supabase.rpc("listar_codigos_alta"),
        supabase.rpc("listar_errores_admin", { p_limite: 100 }),
        supabase.from("miembros").select("empresa_id, email, nombre, rol").eq("rol", "dueno"),
      ]);

      let listaEmpresas: EmpresaAdmin[] = (a.data as EmpresaAdmin[]) ?? [];

      // Si no hay empresas en base de datos, usamos las fixture de demostración
      if (listaEmpresas.length === 0) {
        listaEmpresas = EMPRESAS_DEMO;
      } else if (duenosRes.data) {
        // Enlazar contacto del dueño
        const mapaDuenos = new Map(duenosRes.data.map((d) => [d.empresa_id, d]));
        listaEmpresas = listaEmpresas.map((e) => {
          const d = mapaDuenos.get(e.id);
          return {
            ...e,
            email_contacto: e.email_contacto || d?.email || null,
            responsable_nombre: e.responsable_nombre || d?.nombre || null,
          };
        });
      }

      setEmpresas(listaEmpresas);
      setCodigos((b.data as CodigoAlta[]) ?? []);
      setErrores((c.data as ErrorApp[]) ?? []);
    } catch {
      setEmpresas(EMPRESAS_DEMO);
    } finally {
      setCargando(false);
    }
  }, [supabase]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const copiar = async (texto: string) => {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(texto);
      setTimeout(() => setCopiado((c) => (c === texto ? null : c)), 2000);
    } catch {
      /* sin portapapeles */
    }
  };

  const crearCodigo = async () => {
    setCreandoCodigo(true);
    setErrorCodigo("");
    // Generar código de 12 caracteres único: OBRA-XXXX-YYYY
    const { data, error } = await supabase.rpc("crear_codigo_alta", { p_nota: notaCodigo });
    if (error || !data) {
      setErrorCodigo(tr("No se pudo crear el código. Inténtalo otra vez."));
    } else {
      setNotaCodigo("");
      await copiar(data as string);
      await cargar();
    }
    setCreandoCodigo(false);
  };

  const cancelarCodigo = async (id: string) => {
    await supabase.rpc("cancelar_codigo_alta", { p_id: id });
    await cargar();
  };

  const ponerSuscripcion = async (e: EmpresaAdmin, hasta: string | null, bloqueada: boolean) => {
    await supabase.rpc("establecer_suscripcion", {
      p_empresa: e.id,
      p_activa_hasta: hasta,
      p_bloqueada: bloqueada,
    });
    await cargar();
  };

  const renovarMes = (e: EmpresaAdmin) => {
    const hoy = new Date();
    const base = e.activa_hasta && new Date(e.activa_hasta) > hoy ? new Date(e.activa_hasta) : hoy;
    base.setMonth(base.getMonth() + 1);
    return ponerSuscripcion(e, base.toISOString(), false);
  };

  // KPIs
  const totalEmpresas = empresas.length;
  const activasCount = empresas.filter((e) => {
    const s = clasificarSuscripcion(e);
    return s.tipo === "activa" || s.tipo === "prueba" || s.tipo === "sin_caducidad";
  }).length;
  const porCaducarCount = empresas.filter((e) => clasificarSuscripcion(e).tipo === "gracia").length;
  const bloqueadasCount = empresas.filter((e) => e.bloqueada || clasificarSuscripcion(e).tipo === "caducada").length;

  // Filtrado de empresas
  const empresasFiltradas = useMemo(() => {
    return empresas.filter((e) => {
      const s = clasificarSuscripcion(e);

      // Filtro por píldoras
      if (filtro === "activas" && s.tipo !== "activa" && s.tipo !== "sin_caducidad") return false;
      if (filtro === "prueba" && s.tipo !== "prueba") return false;
      if (filtro === "por_caducar" && s.tipo !== "gracia") return false;
      if (filtro === "caducadas" && s.tipo !== "caducada") return false;
      if (filtro === "bloqueadas" && !e.bloqueada) return false;

      // Filtro por búsqueda
      if (busqueda.trim()) {
        const q = busqueda.toLowerCase().trim();
        const coincideNombre = e.nombre.toLowerCase().includes(q);
        const coincideCodigo = e.codigo.toLowerCase().includes(q);
        const coincideEmail = e.email_contacto?.toLowerCase().includes(q) ?? false;
        const coincideResp = e.responsable_nombre?.toLowerCase().includes(q) ?? false;
        if (!coincideNombre && !coincideCodigo && !coincideEmail && !coincideResp) return false;
      }

      return true;
    });
  }, [empresas, filtro, busqueda]);

  const libres = codigos.filter((c) => c.estado === "libre");
  const otros = codigos.filter((c) => c.estado !== "libre");

  return (
    <div className="space-y-6">
      {/* 1. Selector de Pestañas Principales de la Consola Admin */}
      <div className="flex items-center gap-1 rounded-2xl border border-white/12 bg-[#19211c]/90 p-1.5 backdrop-blur-xl shadow-lg">
        <button
          type="button"
          onClick={() => setTabActiva("empresas")}
          className={clsx(
            "flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs sm:text-sm font-bold transition",
            tabActiva === "empresas"
              ? "bg-[#d7dc9a] text-[#141a16] shadow-md"
              : "text-white/70 hover:bg-white/5 hover:text-white"
          )}
        >
          <Building2 size={16} />
          <span>{tr("Empresas")}</span>
          <span className={clsx(
            "rounded-full px-1.5 py-0.2 text-[10px] font-mono",
            tabActiva === "empresas" ? "bg-black/20 text-[#141a16]" : "bg-white/10 text-white/60"
          )}>
            {totalEmpresas}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setTabActiva("codigos")}
          className={clsx(
            "flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs sm:text-sm font-bold transition",
            tabActiva === "codigos"
              ? "bg-[#d7dc9a] text-[#141a16] shadow-md"
              : "text-white/70 hover:bg-white/5 hover:text-white"
          )}
        >
          <KeyRound size={16} />
          <span>{tr("Códigos")}</span>
          <span className={clsx(
            "rounded-full px-1.5 py-0.2 text-[10px] font-mono",
            tabActiva === "codigos" ? "bg-black/20 text-[#141a16]" : "bg-white/10 text-white/60"
          )}>
            {libres.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setTabActiva("errores")}
          className={clsx(
            "flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs sm:text-sm font-bold transition",
            tabActiva === "errores"
              ? "bg-[#d7dc9a] text-[#141a16] shadow-md"
              : "text-white/70 hover:bg-white/5 hover:text-white"
          )}
        >
          <AlertTriangle size={16} />
          <span>{tr("Errores")}</span>
          <span className={clsx(
            "rounded-full px-1.5 py-0.2 text-[10px] font-mono",
            tabActiva === "errores" ? "bg-black/20 text-[#141a16]" : "bg-white/10 text-white/60"
          )}>
            {errores.length}
          </span>
        </button>
      </div>

      {/* ========================================================
          PESTAÑA 1: GESTIÓN DE EMPRESAS Y LICENCIAS
         ======================================================== */}
      {tabActiva === "empresas" && (
        <div className="space-y-5">
          {/* Tarjetas KPI de Resumen */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-2xl border border-white/12 bg-[#19211c]/80 p-3.5 backdrop-blur-xl">
              <div className="text-[11px] font-medium text-white/50">{tr("Total empresas")}</div>
              <div className="mt-1 font-mono text-2xl font-bold text-white">{totalEmpresas}</div>
            </div>

            <div className="rounded-2xl border border-white/12 bg-[#19211c]/80 p-3.5 backdrop-blur-xl">
              <div className="text-[11px] font-medium text-[#d7dc9a]">{tr("Activas y prueba")}</div>
              <div className="mt-1 font-mono text-2xl font-bold text-[#d7dc9a]">{activasCount}</div>
            </div>

            <div className="rounded-2xl border border-white/12 bg-[#19211c]/80 p-3.5 backdrop-blur-xl">
              <div className="text-[11px] font-medium text-amber-400">{tr("Por caducar")}</div>
              <div className="mt-1 font-mono text-2xl font-bold text-amber-400">{porCaducarCount}</div>
            </div>

            <div className="rounded-2xl border border-white/12 bg-[#19211c]/80 p-3.5 backdrop-blur-xl">
              <div className="text-[11px] font-medium text-red-400">{tr("Bloqueadas")}</div>
              <div className="mt-1 font-mono text-2xl font-bold text-red-400">{bloqueadasCount}</div>
            </div>
          </div>

          {/* Buscador y Filtros Rápidos */}
          <div className="space-y-3">
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder={tr("Buscar por nombre, código o email...")}
                className="w-full rounded-xl border border-white/14 bg-black/30 py-2.5 pl-10 pr-4 text-sm text-white placeholder-white/40 focus:border-[#d7dc9a] focus:outline-none"
              />
            </div>

            {/* Píldoras de Filtro Clicables */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              {(
                [
                  { id: "todas", label: tr("Todas") },
                  { id: "activas", label: tr("Activas") },
                  { id: "prueba", label: tr("Prueba") },
                  { id: "por_caducar", label: tr("Por caducar") },
                  { id: "caducadas", label: tr("Caducadas") },
                  { id: "bloqueadas", label: tr("Bloqueadas") },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFiltro(f.id)}
                  className={clsx(
                    "rounded-full border px-3 py-1 font-semibold transition",
                    filtro === f.id
                      ? "border-[#d7dc9a] bg-[#d7dc9a]/15 text-[#d7dc9a]"
                      : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Lista de Empresas */}
          {cargando ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin text-[#d7dc9a]" size={26} />
            </div>
          ) : empresasFiltradas.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-[#19211c]/60 p-8 text-center text-white/50 text-sm">
              {tr("No se encontraron empresas con ese filtro.")}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3.5">
              {empresasFiltradas.map((e) => {
                const s = clasificarSuscripcion(e);
                return (
                  <div
                    key={e.id}
                    className="overflow-hidden rounded-2xl border border-white/12 bg-[#19211c]/90 p-4 sm:p-5 backdrop-blur-xl shadow-lg transition hover:border-white/20"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-base font-bold text-white">{e.nombre}</h2>
                          {/* Badge de suscripción */}
                          <span
                            className={clsx(
                              "rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider",
                              s.badgeClase
                            )}
                          >
                            {s.etiqueta}
                          </span>
                        </div>

                        {/* Clave Permanente de la Empresa */}
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-xs text-white/50">{tr("Clave de licencia")}:</span>
                          <button
                            type="button"
                            onClick={() => copiar(e.codigo)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[#d7dc9a]/30 bg-[#d7dc9a]/10 px-2 py-0.5 font-mono text-xs font-bold text-[#d7dc9a] hover:bg-[#d7dc9a]/20 transition"
                            title={tr("Copiar clave")}
                          >
                            <span>{e.codigo}</span>
                            {copiado === e.codigo ? <Check size={12} /> : <Copy size={12} />}
                          </button>
                        </div>

                        {/* Contacto del dueño */}
                        <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs text-white/60">
                          {e.responsable_nombre && (
                            <span className="font-semibold text-white/80">{e.responsable_nombre}</span>
                          )}
                          {e.email_contacto && (
                            <a
                              href={`mailto:${e.email_contacto}`}
                              className="flex items-center gap-1 text-[#d7dc9a] hover:underline"
                            >
                              <Mail size={12} /> {e.email_contacto}
                            </a>
                          )}
                          {e.telefono_contacto && (
                            <a
                              href={`tel:${e.telefono_contacto}`}
                              className="flex items-center gap-1 text-white/70 hover:underline"
                            >
                              <Phone size={12} /> {e.telefono_contacto}
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Métricas y Cifras */}
                      <div className="flex items-center gap-4 text-xs text-white/60 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-white/10">
                        <div className="flex items-center gap-1.5">
                          <Users size={14} className="text-white/40" />
                          <span>{trN(e.miembros_count, "{n} miembro", "{n} miembros")}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Wrench size={14} className="text-white/40" />
                          <span>{trN(e.obras_count, "{n} obra", "{n} obras")}</span>
                        </div>
                      </div>
                    </div>

                    {/* Barra de Acciones Rápidas */}
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3">
                      <div className="text-[11.5px] text-white/40 font-mono">
                        {fecha(e.created_at)}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => renovarMes(e)}
                          className="flex items-center gap-1 rounded-xl border border-white/14 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/10 transition"
                        >
                          <Plus size={13} className="text-[#d7dc9a]" />
                          <span>{tr("+1 mes")}</span>
                        </button>

                        {e.bloqueada ? (
                          <button
                            type="button"
                            onClick={() => ponerSuscripcion(e, e.activa_hasta, false)}
                            className="rounded-xl border border-green-500/40 bg-green-950/20 px-3 py-1.5 text-xs font-semibold text-green-400 hover:bg-green-950/40 transition"
                          >
                            {tr("Desbloquear")}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(tr("¿Bloquear el acceso de «{empresa}»? No se borra nada.", { empresa: e.nombre }))) {
                                ponerSuscripcion(e, e.activa_hasta, true);
                              }
                            }}
                            className="rounded-xl border border-red-500/40 bg-red-950/20 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-950/40 transition"
                          >
                            {tr("Bloquear")}
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setEmpresaDetalle(e)}
                          className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-semibold text-white/70 hover:bg-white/10 hover:text-white transition"
                        >
                          <span>{tr("Detalles")}</span>
                          <ChevronRight size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          PESTAÑA 2: CÓDIGOS DE ALTA Y SUSCRIPCIÓN
         ======================================================== */}
      {tabActiva === "codigos" && (
        <div className="space-y-6">
          {/* Creador de Nuevos Códigos */}
          <div className="rounded-2xl border border-white/12 bg-[#19211c]/90 p-5 backdrop-blur-xl shadow-lg space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-[#d7dc9a]" />
              <h2 className="text-base font-bold text-white uppercase tracking-wider">
                {tr("Generador de código de suscripción")}
              </h2>
            </div>
            <p className="text-xs text-white/60 leading-relaxed">
              {tr("Cada código sirve una sola vez y crea una empresa nueva con 14 días de prueba. Se copia solo al crearlo.")}
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-white/70 block mb-1">
                  {tr("Nota o destinatario")}
                </label>
                <Input
                  value={notaCodigo}
                  onChange={(e) => setNotaCodigo(e.target.value)}
                  placeholder={tr("Nota (ej. para quién es) — opcional")}
                  className="bg-black/30 border-white/14"
                />
              </div>

              {/* Selector de días de prueba */}
              <div>
                <label className="text-xs font-semibold text-white/70 block mb-1.5">
                  {tr("Duración de prueba")}
                </label>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  {[7, 14, 30, 365].map((dias) => (
                    <button
                      key={dias}
                      type="button"
                      onClick={() => setDiasValidez(dias)}
                      className={clsx(
                        "rounded-xl border py-2 text-center font-bold transition",
                        diasValidez === dias
                          ? "border-[#d7dc9a] bg-[#d7dc9a]/15 text-[#d7dc9a]"
                          : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
                      )}
                    >
                      {dias === 365 ? tr("1 año") : `${dias} ${tr("días")}`}
                    </button>
                  ))}
                </div>
              </div>

              <PrimaryButton onClick={crearCodigo} disabled={creandoCodigo}>
                {creandoCodigo && <Loader2 size={16} className="animate-spin" />}
                {tr("Crear código nuevo")}
              </PrimaryButton>
              {errorCodigo && <div className="text-xs text-red-400 mt-1">{errorCodigo}</div>}
            </div>
          </div>

          {/* Lista de Códigos Libres */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                {tr("Códigos disponibles")} ({libres.length})
              </h3>
            </div>

            {libres.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-[#19211c]/60 p-6 text-center text-white/50 text-xs">
                {tr("No hay códigos sin usar.")}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {libres.map((c) => {
                  const urlAlta = typeof window !== "undefined"
                    ? `${window.location.origin}/login?alta=${c.codigo}`
                    : `https://obra-antigravity.vercel.app/login?alta=${c.codigo}`;

                  return (
                    <div
                      key={c.id}
                      className="rounded-2xl border border-white/12 bg-[#19211c]/90 p-4 backdrop-blur-xl shadow-sm space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-base font-bold text-[#d7dc9a] tracking-wider">
                          {c.codigo}
                        </span>
                        <button
                          type="button"
                          onClick={() => copiar(c.codigo)}
                          className="flex items-center gap-1 rounded-lg border border-white/14 bg-white/5 px-2 py-1 text-xs font-semibold text-white/80 hover:bg-white/10"
                        >
                          {copiado === c.codigo ? <Check size={12} /> : <Copy size={12} />}
                          <span>{copiado === c.codigo ? tr("Copiado") : tr("Copiar")}</span>
                        </button>
                      </div>

                      <div className="text-xs text-white/60">
                        {c.pagado ? `${tr("Tarjeta")} · ${c.email ?? ""} · ` : c.nota ? `${c.nota} · ` : ""}
                        {tr("creado {fecha}", { fecha: fecha(c.creado_en) })}
                      </div>

                      <div className="flex items-center justify-between border-t border-white/10 pt-2.5">
                        <button
                          type="button"
                          onClick={() => copiar(urlAlta)}
                          className="flex items-center gap-1 text-[11.5px] font-semibold text-[#d7dc9a] hover:underline"
                        >
                          <ExternalLink size={12} />
                          <span>{copiado === urlAlta ? tr("Enlace copiado") : tr("Copiar enlace de invitación")}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(tr("¿Cancelar este código? Ya no se podrá usar."))) {
                              cancelarCodigo(c.id);
                            }
                          }}
                          className="text-[11.5px] font-semibold text-red-400 hover:underline"
                        >
                          {tr("Cancelar")}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Historial de Códigos Canjeados / Cancelados */}
          {otros.length > 0 && (
            <div className="space-y-2 pt-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white/50">
                {tr("Códigos canjeados y cancelados")} ({otros.length})
              </h3>
              <div className="divide-y divide-white/10 rounded-2xl border border-white/10 bg-[#19211c]/60 p-3">
                {otros.map((c) => (
                  <div key={c.id} className="flex items-center justify-between py-2 text-xs text-white/60">
                    <span className="font-mono text-white/80">
                      {c.codigo} {c.pagado ? tr(" · tarjeta") : ""}
                    </span>
                    <span className="truncate text-right">
                      {c.estado === "usado"
                        ? `→ ${c.empresa_nombre ?? tr("(empresa borrada)")} · ${c.usado_en ? fecha(c.usado_en) : ""}`
                        : tr("cancelado")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          PESTAÑA 3: ERRORES DE LA APP
         ======================================================== */}
      {tabActiva === "errores" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white uppercase tracking-wider">
                {tr("Errores de la app")}
              </h2>
              <p className="text-xs text-white/60">
                {tr("Los fallos que les salen a los usuarios, del móvil y del servidor. Se borran solos a los 90 días.")}
              </p>
            </div>
            {errores.length > 0 && (
              <button
                type="button"
                onClick={async () => {
                  if (!confirm(tr("¿Borrar todos los errores de la lista?"))) return;
                  await supabase.rpc("borrar_errores_admin");
                  await cargar();
                }}
                className="flex items-center gap-1 rounded-xl border border-red-500/30 bg-red-950/20 px-3 py-1.5 text-xs font-bold text-red-400 hover:bg-red-950/40"
              >
                <Trash2 size={13} /> <span>{tr("Vaciar la lista")}</span>
              </button>
            )}
          </div>

          {errores.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-[#19211c]/60 p-8 text-center text-white/50 text-xs">
              {tr("Ningún error registrado.")}
            </div>
          ) : (
            <div className="space-y-2">
              {errores.map((e) => (
                <div
                  key={e.id}
                  onClick={() => setErrorAbierto(errorAbierto === e.id ? null : e.id)}
                  className="cursor-pointer rounded-2xl border border-white/10 bg-[#19211c]/90 p-3.5 backdrop-blur-xl transition hover:border-white/20"
                >
                  <div className="flex items-center justify-between text-[11px] text-white/50">
                    <span>
                      {new Date(e.creado_en).toLocaleString(localeActual())} ·{" "}
                      {e.origen === "servidor" ? tr("servidor") : tr("móvil / navegador")}
                    </span>
                    <span className="font-mono text-[#d7dc9a]">{e.empresa ?? e.email ?? ""}</span>
                  </div>
                  <div className="mt-1 font-semibold text-sm text-red-400">{e.mensaje}</div>
                  {e.ruta && (
                    <div className="mt-0.5 font-mono text-[11px] text-white/40">{e.ruta}</div>
                  )}

                  {errorAbierto === e.id && (
                    <pre className="mt-3 max-h-60 overflow-auto whitespace-pre-wrap break-all rounded-xl bg-black/50 p-3 font-mono text-[11px] text-white/80 border border-white/10">
                      {[e.email, e.navegador, e.detalle].filter(Boolean).join("\n\n")}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Botón de Refresco General */}
      <div className="pt-2 flex justify-center">
        <GhostButton onClick={cargar} className="w-auto flex items-center gap-2">
          <RefreshCw size={14} />
          <span>{tr("Actualizar")}</span>
        </GhostButton>
      </div>

      {/* Sheet de Detalle de Empresa */}
      {empresaDetalle && (
        <Sheet
          title={empresaDetalle.nombre}
          onClose={() => setEmpresaDetalle(null)}
        >
          <div className="space-y-5">
            <div className="rounded-2xl border border-white/12 bg-black/30 p-4 space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-white/50">
                {tr("Clave de licencia")}
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-lg font-bold text-[#d7dc9a]">
                  {empresaDetalle.codigo}
                </span>
                <button
                  type="button"
                  onClick={() => copiar(empresaDetalle.codigo)}
                  className="flex items-center gap-1 rounded-lg border border-white/14 bg-white/5 px-2.5 py-1 text-xs font-semibold text-white"
                >
                  {copiado === empresaDetalle.codigo ? <Check size={13} /> : <Copy size={13} />}
                  <span>{copiado === empresaDetalle.codigo ? tr("Clave copiada") : tr("Copiar")}</span>
                </button>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="text-xs font-bold uppercase tracking-wider text-white/50">
                {tr("Información general")}
              </div>
              <div className="flex justify-between border-b border-white/10 py-1.5">
                <span className="text-white/60">{tr("ID de empresa")}</span>
                <span className="font-mono text-white/80">{empresaDetalle.id}</span>
              </div>
              <div className="flex justify-between border-b border-white/10 py-1.5">
                <span className="text-white/60">{tr("Fecha de registro")}</span>
                <span className="text-white/80">{fecha(empresaDetalle.created_at)}</span>
              </div>
              <div className="flex justify-between border-b border-white/10 py-1.5">
                <span className="text-white/60">{tr("Miembros activos")}</span>
                <span className="text-white/80 font-bold">{empresaDetalle.miembros_count}</span>
              </div>
              <div className="flex justify-between border-b border-white/10 py-1.5">
                <span className="text-white/60">{tr("Obras creadas")}</span>
                <span className="text-white/80 font-bold">{empresaDetalle.obras_count}</span>
              </div>
              <div className="flex justify-between border-b border-white/10 py-1.5">
                <span className="text-white/60">{tr("Estado de la suscripción")}</span>
                <span className="font-semibold text-[#d7dc9a]">
                  {clasificarSuscripcion(empresaDetalle).etiqueta}
                </span>
              </div>
            </div>

            {/* Acciones del Modal */}
            <div className="space-y-2 pt-3">
              <button
                type="button"
                onClick={async () => {
                  await renovarMes(empresaDetalle);
                  setEmpresaDetalle(null);
                }}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#d7dc9a] py-3 text-xs font-bold text-[#141a16] hover:bg-[#c8cd8b] transition shadow-md"
              >
                <Plus size={14} />
                <span>{tr("Extender suscripción (+1 mes)")}</span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  await ponerSuscripcion(empresaDetalle, empresaDetalle.activa_hasta, !empresaDetalle.bloqueada);
                  setEmpresaDetalle(null);
                }}
                className={clsx(
                  "w-full flex items-center justify-center gap-2 rounded-xl border py-2.5 text-xs font-bold transition",
                  empresaDetalle.bloqueada
                    ? "border-green-500/40 text-green-400 bg-green-950/20"
                    : "border-red-500/40 text-red-400 bg-red-950/20"
                )}
              >
                {empresaDetalle.bloqueada ? tr("Desbloquear empresa") : tr("Bloquear empresa")}
              </button>
            </div>
          </div>
        </Sheet>
      )}
    </div>
  );
}
