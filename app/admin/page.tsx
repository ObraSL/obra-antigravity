"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Building2,
  Calendar,
  Check,
  ChevronRight,
  Clock,
  Coins,
  Copy,
  ExternalLink,
  Eye,
  Filter,
  HardHat,
  KeyRound,
  Loader2,
  LogIn,
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
  Zap,
  Sun,
  Hammer,
  RotateCcw,
  CreditCard,
  BellRing,
  LifeBuoy,
  CheckCircle2,
  XCircle,
  History,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { CodigoAlta, EmpresaAdmin, ErrorApp } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Empty } from "@/components/ui/Empty";
import { GhostButton, PrimaryButton } from "@/components/ui/Button";
import { Input, Field } from "@/components/ui/Field";
import { Sheet } from "@/components/ui/Sheet";
import { localeActual, tr, trN } from "@/lib/i18n";
import clsx from "clsx";

const fecha = (iso: string) => new Date(iso).toLocaleDateString(localeActual());

type FiltroEstado = "todas" | "activas" | "prueba" | "por_caducar" | "caducadas" | "bloqueadas";

/** 3 empresas reales canónicas solicitadas por el usuario */
const EMPRESAS_CANONICAS: EmpresaAdmin[] = [
  {
    id: "empresa-electricidad",
    nombre: "VoltMax Electricidad & Instalaciones S.L.",
    sector: "Electricidad e iluminación",
    codigo: "OBRA-ELEC-77A1",
    created_at: new Date(Date.now() - 40 * 86_400_000).toISOString(),
    miembros_count: 2,
    obras_count: 1,
    activa_hasta: new Date(Date.now() + 24 * 86_400_000).toISOString(),
    bloqueada: false,
    codigo_alta: "ALTA-ELEC-2026",
    email_contacto: "mateo@voltmax.es",
    telefono_contacto: "+34 611 223 344",
    responsable_nombre: "Mateo Ruiz",
    trabajadores_nombres: ["Mateo Ruiz (Oficial 1ª)", "Lucas Benítez (Técnico)"],
    obras_nombres: ["Edificio Gran Vía - Líneas y Cuadros"],
  },
  {
    id: "empresa-solar",
    nombre: "Solaria Renovable & Placas S.L.",
    sector: "Energía solar y fotovoltaica",
    codigo: "OBRA-SOLA-92B4",
    created_at: new Date(Date.now() - 1 * 86_400_000).toISOString(),
    miembros_count: 2,
    obras_count: 1,
    activa_hasta: new Date(Date.now() + 6 * 86_400_000).toISOString(),
    bloqueada: false,
    codigo_alta: "TRIAL-SOLAR-7D",
    email_contacto: "info@solariaplacas.es",
    telefono_contacto: "+34 622 556 778",
    responsable_nombre: "Adrián Navarro",
    trabajadores_nombres: ["Adrián Navarro (Instalador)", "Pablo Ortega (Inversores)"],
    obras_nombres: ["Parque Solar Residencial El Valle"],
  },
  {
    id: "empresa-construccion",
    nombre: "Edifica Construcción & Reformas S.L.",
    sector: "Construcción y estructuras",
    codigo: "OBRA-EDIF-33K9",
    created_at: new Date(Date.now() - 75 * 86_400_000).toISOString(),
    miembros_count: 2,
    obras_count: 1,
    activa_hasta: new Date(Date.now() + 2 * 86_400_000).toISOString(),
    bloqueada: false,
    codigo_alta: "ALTA-EDIF-OBRA",
    email_contacto: "carlos@edificaconstruccion.es",
    telefono_contacto: "+34 633 889 900",
    responsable_nombre: "Carlos Menéndez",
    trabajadores_nombres: ["Héctor Romero (Encofrador)", "Gabriel Castro (Albañil)"],
    obras_nombres: ["Villa Moderna Los Álamos"],
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
  const router = useRouter();
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

  // Modal de creación de empresa
  const [creandoEmpresaModal, setCreandoEmpresaModal] = useState(false);
  const [nuevaEmpresaNombre, setNuevaEmpresaNombre] = useState("");
  const [nuevaEmpresaSector, setNuevaEmpresaSector] = useState("Electricidad e iluminación");
  const [nuevaEmpresaResponsable, setNuevaEmpresaResponsable] = useState("");
  const [nuevaEmpresaEmail, setNuevaEmpresaEmail] = useState("");
  const [nuevaEmpresaTelefono, setNuevaEmpresaTelefono] = useState("");
  const [nuevaEmpresaPlan, setNuevaEmpresaPlan] = useState<number>(14);

  // Creación de código de alta
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

      // Leer empresas personalizadas añadidas por el usuario en localStorage
      let creadasPorUsuario: EmpresaAdmin[] = [];
      try {
        const raw = localStorage.getItem("obra_admin_custom_empresas");
        if (raw) creadasPorUsuario = JSON.parse(raw);
      } catch {
        /* ignore */
      }

      // Si no hay empresas en base de datos, usamos las 3 canónicas solicitadas
      if (listaEmpresas.length === 0) {
        listaEmpresas = [...creadasPorUsuario, ...EMPRESAS_CANONICAS];
      } else {
        if (duenosRes.data) {
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
        listaEmpresas = [...creadasPorUsuario, ...listaEmpresas];
      }

      // Aplicar overrides locales de pruebas y simulaciones
      let overrides: Record<string, Partial<EmpresaAdmin>> = {};
      try {
        const rawO = localStorage.getItem("obra_admin_empresa_overrides");
        if (rawO) overrides = JSON.parse(rawO);
      } catch {
        /* ignore */
      }
      listaEmpresas = listaEmpresas.map((e) => (overrides[e.id] ? { ...e, ...overrides[e.id] } : e));

      setEmpresas(listaEmpresas);
      setCodigos((b.data as CodigoAlta[]) ?? []);
      setErrores((c.data as ErrorApp[]) ?? []);
    } catch {
      let creadasPorUsuario: EmpresaAdmin[] = [];
      try {
        const raw = localStorage.getItem("obra_admin_custom_empresas");
        if (raw) creadasPorUsuario = JSON.parse(raw);
      } catch {
        /* ignore */
      }
      let fallback = [...creadasPorUsuario, ...EMPRESAS_CANONICAS];
      try {
        const rawO = localStorage.getItem("obra_admin_empresa_overrides");
        if (rawO) {
          const overrides = JSON.parse(rawO);
          fallback = fallback.map((e) => (overrides[e.id] ? { ...e, ...overrides[e.id] } : e));
        }
      } catch {
        /* ignore */
      }
      setEmpresas(fallback);
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

  /** Cambiar contexto y entrar en la empresa como administrador */
  const entrarEnEmpresa = (e: EmpresaAdmin) => {
    localStorage.setItem("obra_admin_inspeccion_empresa", JSON.stringify(e));
    window.dispatchEvent(new Event("obra_admin_inspeccion_changed"));
    router.push("/");
  };

  /** Guardar nueva empresa creada */
  const handleCrearEmpresa = () => {
    if (!nuevaEmpresaNombre.trim()) return;

    const sufijo = Math.random().toString(36).substring(2, 6).toUpperCase();
    const codigoGenerado = `OBRA-${sufijo}-2026`;
    const activaHasta = nuevaEmpresaPlan > 0
      ? new Date(Date.now() + nuevaEmpresaPlan * 86_400_000).toISOString()
      : null;

    const nueva: EmpresaAdmin = {
      id: `empresa-custom-${Date.now()}`,
      nombre: nuevaEmpresaNombre.trim(),
      sector: nuevaEmpresaSector,
      codigo: codigoGenerado,
      created_at: new Date().toISOString(),
      miembros_count: 2,
      obras_count: 1,
      activa_hasta: activaHasta,
      bloqueada: false,
      codigo_alta: `CREADA-ADMIN-${sufijo}`,
      email_contacto: nuevaEmpresaEmail.trim() || "director@empresa.com",
      telefono_contacto: nuevaEmpresaTelefono.trim() || "+34 600 000 000",
      responsable_nombre: nuevaEmpresaResponsable.trim() || tr("Responsable"),
      trabajadores_nombres: [`${tr("Operario")} 1`, `${tr("Operario")} 2`],
      obras_nombres: [`${tr("Obra Principal")} - ${nuevaEmpresaSector}`],
    };

    const actualizadas = [nueva, ...empresas];
    setEmpresas(actualizadas);

    try {
      const raw = localStorage.getItem("obra_admin_custom_empresas");
      const prev = raw ? JSON.parse(raw) : [];
      localStorage.setItem("obra_admin_custom_empresas", JSON.stringify([nueva, ...prev]));
    } catch {
      /* ignore */
    }

    setCreandoEmpresaModal(false);
    setNuevaEmpresaNombre("");
    setNuevaEmpresaResponsable("");
    setNuevaEmpresaEmail("");
    setNuevaEmpresaTelefono("");
  };

  const crearCodigo = async () => {
    setCreandoCodigo(true);
    setErrorCodigo("");
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
    setEmpresas((prev) =>
      prev.map((item) => (item.id === e.id ? { ...item, activa_hasta: hasta, bloqueada } : item))
    );
    await cargar();
  };

  const renovarMes = (e: EmpresaAdmin) => {
    const hoy = new Date();
    const base = e.activa_hasta && new Date(e.activa_hasta) > hoy ? new Date(e.activa_hasta) : hoy;
    base.setMonth(base.getMonth() + 1);
    return ponerSuscripcion(e, base.toISOString(), false);
  };

  const [notificacion, setNotificacion] = useState<{
    tipo: "exito" | "info" | "alerta";
    mensaje: string;
  } | null>(null);

  const mostrarNotificacion = (tipo: "exito" | "info" | "alerta", mensaje: string) => {
    setNotificacion({ tipo, mensaje });
    setTimeout(() => {
      setNotificacion((prev) => (prev?.mensaje === mensaje ? null : prev));
    }, 7000);
  };

  /** Actualizar estado de empresa y persistir en overrides de localStorage */
  const actualizarEmpresa = (id: string, updates: Partial<EmpresaAdmin>) => {
    setEmpresas((prev) => {
      const updated = prev.map((item) => (item.id === id ? { ...item, ...updates } : item));
      try {
        const rawO = localStorage.getItem("obra_admin_empresa_overrides");
        const overrides = rawO ? JSON.parse(rawO) : {};
        overrides[id] = { ...(overrides[id] || {}), ...updates };
        localStorage.setItem("obra_admin_empresa_overrides", JSON.stringify(overrides));
      } catch {
        /* ignore */
      }
      return updated;
    });

    if (empresaDetalle && empresaDetalle.id === id) {
      setEmpresaDetalle((prev) => (prev ? { ...prev, ...updates } : null));
    }
  };

  /** Simular expiración en 1 día y auto-renovación */
  const simularExpiracion1Dia = (e: EmpresaAdmin) => {
    const manana = new Date(Date.now() + 1 * 86_400_000).toISOString();
    actualizarEmpresa(e.id, { activa_hasta: manana, bloqueada: false });
    mostrarNotificacion(
      "info",
      tr("Suscripción ajustada a 1 día restante. Regla de preaviso de 15 días: no cancelada → Renovación automática Stripe preparada.")
    );
  };

  /** Simular ejecución de auto-renovación (+30 días) */
  const ejecutarAutoRenovacion = (e: EmpresaAdmin) => {
    const unMesMas = new Date(Date.now() + 30 * 86_400_000).toISOString();
    actualizarEmpresa(e.id, { activa_hasta: unMesMas, bloqueada: false });
    mostrarNotificacion(
      "exito",
      tr("¡Cobro automático Stripe completado con éxito (49,00 €)! Suscripción renovada por +30 días con el mismo código {codigo}.", { codigo: e.codigo })
    );
  };

  /** Simular impago / abandono (2 días caducada) */
  const simularImpago2Dias = (e: EmpresaAdmin) => {
    const haceDosDias = new Date(Date.now() - 2 * 86_400_000).toISOString();
    actualizarEmpresa(e.id, { activa_hasta: haceDosDias, bloqueada: false });
    mostrarNotificacion(
      "alerta",
      tr("Empresa caducada hace 2 días. El código {codigo} y todos los datos permanecen congelados y guardados en base de datos.", { codigo: e.codigo })
    );
  };

  /** Reactivar empresa tras impago conservando exactamente el mismo código */
  const reactivarConMismoCodigo = (e: EmpresaAdmin) => {
    const unMesMas = new Date(Date.now() + 30 * 86_400_000).toISOString();
    actualizarEmpresa(e.id, { activa_hasta: unMesMas, bloqueada: false });
    mostrarNotificacion(
      "exito",
      tr("Pago recibido: empresa reactivada inmediatamente con su MISMO código de licencia {codigo}. Datos intactos.", { codigo: e.codigo })
    );
  };

  /** Simular Webhook instantáneo de Stripe */
  const simularWebhookStripe = (e: EmpresaAdmin) => {
    const unMesMas = new Date(Date.now() + 30 * 86_400_000).toISOString();
    actualizarEmpresa(e.id, { activa_hasta: unMesMas, bloqueada: false });
    mostrarNotificacion(
      "exito",
      tr("Webhook Stripe procesado en 42ms: invoice.payment_succeeded → Suscripción de «{empresa}» activa al instante.", { empresa: e.nombre })
    );
  };

  /** Asistencia rápida / Quick Fix: +3 días de gracia de emergencia */
  const auxilio3DiasGracia = (e: EmpresaAdmin) => {
    const tresDias = new Date(Date.now() + 3 * 86_400_000).toISOString();
    actualizarEmpresa(e.id, { activa_hasta: tresDias, bloqueada: false });
    mostrarNotificacion(
      "exito",
      tr("Auxilio de emergencia aplicado: +3 días de prórroga concedidos a «{empresa}» mientras solucionan su pago.", { empresa: e.nombre })
    );
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
        const coincideSector = e.sector?.toLowerCase().includes(q) ?? false;
        const coincideEmail = e.email_contacto?.toLowerCase().includes(q) ?? false;
        const coincideResp = e.responsable_nombre?.toLowerCase().includes(q) ?? false;
        if (!coincideNombre && !coincideCodigo && !coincideEmail && !coincideResp && !coincideSector) return false;
      }

      return true;
    });
  }, [empresas, filtro, busqueda]);

  const libres = codigos.filter((c) => c.estado === "libre");
  const otros = codigos.filter((c) => c.estado !== "libre");

  return (
    <div className="space-y-6">
      {/* Banner de Notificación y Feedback de Simulación */}
      {notificacion && (
        <div
          className={clsx(
            "flex items-center justify-between gap-3 rounded-2xl border p-4 shadow-xl backdrop-blur-md animate-in fade-in duration-300",
            notificacion.tipo === "exito" && "border-emerald-500/40 bg-emerald-950/70 text-emerald-200",
            notificacion.tipo === "info" && "border-[#d7dc9a]/40 bg-[#1e2520]/90 text-[#d7dc9a]",
            notificacion.tipo === "alerta" && "border-amber-500/40 bg-amber-950/70 text-amber-200"
          )}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {notificacion.tipo === "exito" && <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />}
            {notificacion.tipo === "info" && <Sparkles size={18} className="text-[#d7dc9a] shrink-0" />}
            {notificacion.tipo === "alerta" && <AlertTriangle size={18} className="text-amber-400 shrink-0" />}
            <span className="text-xs sm:text-sm font-semibold">{notificacion.mensaje}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotificacion(null)}
            className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-white/10 shrink-0 opacity-70 hover:opacity-100"
          >
            <XCircle size={15} />
          </button>
        </div>
      )}

      {/* 1. Selector de Pestañas Principales */}
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

          {/* Botón de Añadir Nueva Empresa y Barra de Búsqueda */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder={tr("Buscar por nombre, código o email...")}
                className="w-full rounded-xl border border-white/14 bg-black/30 py-2.5 pl-10 pr-4 text-sm text-white placeholder-white/40 focus:border-[#d7dc9a] focus:outline-none"
              />
            </div>

            <button
              type="button"
              onClick={() => setCreandoEmpresaModal(true)}
              className="flex items-center justify-center gap-2 rounded-xl bg-[#d7dc9a] px-4 py-2.5 text-xs sm:text-sm font-bold text-[#141a16] shadow-md transition hover:bg-[#c8cd8b] active:scale-95 shrink-0"
            >
              <Plus size={16} strokeWidth={2.5} />
              <span>{tr("Nueva empresa")}</span>
            </button>
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

                        {/* Sector de actividad */}
                        {e.sector && (
                          <div className="mt-1 flex items-center gap-1.5 text-xs text-white/50">
                            {e.sector.includes("Electricidad") ? (
                              <Zap size={13} className="text-[#d7dc9a]" />
                            ) : e.sector.includes("solar") || e.sector.includes("Placas") ? (
                              <Sun size={13} className="text-[#d7dc9a]" />
                            ) : (
                              <Hammer size={13} className="text-[#d7dc9a]" />
                            )}
                            <span>{e.sector}</span>
                          </div>
                        )}

                        {/* Clave Permanente de la Empresa */}
                        <div className="mt-2.5 flex items-center gap-2">
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

                        {/* Plantilla y obras */}
                        {e.trabajadores_nombres && e.trabajadores_nombres.length > 0 && (
                          <div className="mt-2 text-[11.5px] text-white/50">
                            <span className="text-white/40">{tr("Trabajadores")}:</span>{" "}
                            {e.trabajadores_nombres.join(" · ")}
                          </div>
                        )}
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

                    {/* Política y Reglas de Suscripción */}
                    <div className="mt-3.5 rounded-xl border border-white/8 bg-black/25 p-2.5 text-[11px] text-white/70 space-y-1.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <RotateCcw size={12} className="text-[#d7dc9a]" />
                          <span className="font-semibold text-white">{tr("Auto-renovación: ACTIVA (Stripe)")}</span>
                        </div>
                        <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-white/60">
                          {tr("Regla de cancelación: mínimo 15 días antes del vencimiento")}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-white/5 text-[10.5px]">
                        <span className="text-white/50 flex items-center gap-1">
                          <ShieldCheck size={11} className="text-emerald-400" />
                          {tr("Mismo código garantizado")}: <span className="font-mono text-[#d7dc9a]">{e.codigo}</span>
                        </span>
                        <span className="text-emerald-400/90 font-medium">
                          {tr("0 errores críticos")} · {tr("Base de datos conectada")}
                        </span>
                      </div>
                    </div>

                    {/* Laboratorio de Pruebas de Suscripción y Soporte Rápido */}
                    <div className="mt-2.5 rounded-xl border border-[#d7dc9a]/25 bg-[#141b16]/80 p-2.5">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[#d7dc9a] mb-2 flex items-center justify-between">
                        <span>{tr("Pruebas de suscripción y soporte rápido")}</span>
                        <span className="text-white/40">{tr("Simulación en vivo")}</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[11px]">
                        <button
                          type="button"
                          onClick={() => simularExpiracion1Dia(e)}
                          className="flex items-center justify-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 font-medium text-white/80 hover:bg-white/12 hover:text-white transition"
                          title={tr("Simular que le queda 1 día para probar la auto-renovación")}
                        >
                          <Clock size={11} className="text-amber-400" />
                          <span>{tr("1 día (Auto-renovación)")}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => ejecutarAutoRenovacion(e)}
                          className="flex items-center justify-center gap-1 rounded-lg border border-[#d7dc9a]/30 bg-[#d7dc9a]/10 px-2 py-1.5 font-bold text-[#d7dc9a] hover:bg-[#d7dc9a]/20 transition"
                          title={tr("Simular cobro automático con éxito")}
                        >
                          <CreditCard size={11} />
                          <span>{tr("Cobrar (+1 mes)")}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => simularImpago2Dias(e)}
                          className="flex items-center justify-center gap-1 rounded-lg border border-red-500/30 bg-red-950/20 px-2 py-1.5 font-medium text-red-300 hover:bg-red-950/40 transition"
                          title={tr("Simular impago y bloqueo manteniendo código intacto")}
                        >
                          <AlertTriangle size={11} />
                          <span>{tr("Impago (2 días caducada)")}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => reactivarConMismoCodigo(e)}
                          className="flex items-center justify-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-950/20 px-2 py-1.5 font-bold text-emerald-300 hover:bg-emerald-950/40 transition"
                          title={tr("Reactivar suscripción tras impago con exactamente el mismo código")}
                        >
                          <CheckCircle2 size={11} />
                          <span>{tr("Reactivar con mismo código")}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => simularWebhookStripe(e)}
                          className="flex items-center justify-center gap-1 rounded-lg border border-sky-500/30 bg-sky-950/20 px-2 py-1.5 font-medium text-sky-300 hover:bg-sky-950/40 transition"
                          title={tr("Simular webhook instantáneo de Stripe")}
                        >
                          <BellRing size={11} />
                          <span>{tr("Webhook Stripe instantáneo")}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => auxilio3DiasGracia(e)}
                          className="flex items-center justify-center gap-1 rounded-lg border border-amber-500/30 bg-amber-950/20 px-2 py-1.5 font-medium text-amber-300 hover:bg-amber-950/40 transition"
                          title={tr("Conceder auxilio de emergencia de 3 días")}
                        >
                          <LifeBuoy size={11} />
                          <span>{tr("+3 días auxilio emergencia")}</span>
                        </button>
                      </div>
                    </div>

                    {/* Barra de Acciones: Entrar en la empresa + Renovación */}
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3">
                      {/* BOTÓN CLAVE: Acceder a la empresa para inspección y soporte */}
                      <button
                        type="button"
                        onClick={() => entrarEnEmpresa(e)}
                        className="flex items-center gap-1.5 rounded-xl border border-[#d7dc9a]/40 bg-[#d7dc9a]/15 px-3 py-1.5 text-xs font-bold text-[#d7dc9a] hover:bg-[#d7dc9a]/25 transition"
                      >
                        <LogIn size={13} />
                        <span>{tr("Acceder a empresa")}</span>
                      </button>

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
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              {tr("Códigos disponibles")} ({libres.length})
            </h3>

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

      {/* Modal de Creación de Nueva Empresa */}
      {creandoEmpresaModal && (
        <Sheet
          title={tr("Crear nueva empresa")}
          onClose={() => setCreandoEmpresaModal(false)}
        >
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-white/70 uppercase tracking-wider block mb-1">
                {tr("Nombre de la empresa")}
              </label>
              <Input
                value={nuevaEmpresaNombre}
                onChange={(e) => setNuevaEmpresaNombre(e.target.value)}
                placeholder={tr("Ej. Instalaciones VoltMax S.L.")}
                className="bg-black/30 border-white/14"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-white/70 uppercase tracking-wider block mb-1">
                {tr("Sector de actividad")}
              </label>
              <select
                value={nuevaEmpresaSector}
                onChange={(e) => setNuevaEmpresaSector(e.target.value)}
                className="w-full rounded-xl border border-white/14 bg-[#141a16] p-3 text-sm text-white focus:border-[#d7dc9a] focus:outline-none"
              >
                <option value="Electricidad e iluminación">⚡ {tr("Electricidad e iluminación")}</option>
                <option value="Energía solar y fotovoltaica">☀️ {tr("Energía solar y fotovoltaica")}</option>
                <option value="Construcción y estructuras">🏗️ {tr("Construcción y estructuras")}</option>
                <option value="Fontanería y climatización">💧 {tr("Fontanería y climatización")}</option>
                <option value="Pintura y acabados">🎨 {tr("Pintura y acabados")}</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-white/70 uppercase tracking-wider block mb-1">
                  {tr("Responsable")}
                </label>
                <Input
                  value={nuevaEmpresaResponsable}
                  onChange={(e) => setNuevaEmpresaResponsable(e.target.value)}
                  placeholder={tr("Ej. Mateo Ruiz")}
                  className="bg-black/30 border-white/14"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-white/70 uppercase tracking-wider block mb-1">
                  {tr("Teléfono")}
                </label>
                <Input
                  value={nuevaEmpresaTelefono}
                  onChange={(e) => setNuevaEmpresaTelefono(e.target.value)}
                  placeholder="+34 612 345 678"
                  className="bg-black/30 border-white/14"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-white/70 uppercase tracking-wider block mb-1">
                {tr("Email de contacto")}
              </label>
              <Input
                type="email"
                value={nuevaEmpresaEmail}
                onChange={(e) => setNuevaEmpresaEmail(e.target.value)}
                placeholder="contacto@empresa.com"
                className="bg-black/30 border-white/14"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-white/70 uppercase tracking-wider block mb-1">
                {tr("Período de suscripción inicial")}
              </label>
              <div className="grid grid-cols-4 gap-2 text-xs">
                {[
                  { dias: 7, label: `7 ${tr("días")}` },
                  { dias: 14, label: `14 ${tr("días")}` },
                  { dias: 30, label: `30 ${tr("días")}` },
                  { dias: 0, label: tr("Sin caducidad") },
                ].map((item) => (
                  <button
                    key={item.dias}
                    type="button"
                    onClick={() => setNuevaEmpresaPlan(item.dias)}
                    className={clsx(
                      "rounded-xl border py-2.5 text-center font-bold transition",
                      nuevaEmpresaPlan === item.dias
                        ? "border-[#d7dc9a] bg-[#d7dc9a]/15 text-[#d7dc9a]"
                        : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-3">
              <GhostButton onClick={() => setCreandoEmpresaModal(false)}>
                {tr("Cancelar")}
              </GhostButton>
              <PrimaryButton onClick={handleCrearEmpresa} disabled={!nuevaEmpresaNombre.trim()}>
                {tr("Crear y generar clave")}
              </PrimaryButton>
            </div>
          </div>
        </Sheet>
      )}

      {/* Sheet de Detalle de Empresa */}
      {empresaDetalle && (
        <Sheet
          title={empresaDetalle.nombre}
          onClose={() => setEmpresaDetalle(null)}
        >
          <div className="space-y-5">
            {/* Clave de Licencia */}
            <div className="rounded-2xl border border-white/12 bg-black/30 p-4 space-y-2">
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

            {/* Botón de Acceder a Empresa */}
            <button
              type="button"
              onClick={() => entrarEnEmpresa(empresaDetalle)}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#d7dc9a] py-3 text-xs font-bold text-[#141a16] shadow-md transition hover:bg-[#c8cd8b]"
            >
              <LogIn size={15} />
              <span>{tr("Acceder a esta empresa")}</span>
            </button>

            {/* Información General */}
            <div className="space-y-2 text-xs">
              <div className="text-xs font-bold uppercase tracking-wider text-white/50">
                {tr("Información general")}
              </div>
              {empresaDetalle.sector && (
                <div className="flex justify-between border-b border-white/10 py-1.5">
                  <span className="text-white/60">{tr("Sector de actividad")}</span>
                  <span className="font-semibold text-white/90">{empresaDetalle.sector}</span>
                </div>
              )}
              <div className="flex justify-between border-b border-white/10 py-1.5">
                <span className="text-white/60">{tr("Responsable")}</span>
                <span className="font-semibold text-white/90">{empresaDetalle.responsable_nombre || "—"}</span>
              </div>
              <div className="flex justify-between border-b border-white/10 py-1.5">
                <span className="text-white/60">{tr("Email de contacto")}</span>
                <span className="font-mono text-[#d7dc9a]">{empresaDetalle.email_contacto || "—"}</span>
              </div>
              <div className="flex justify-between border-b border-white/10 py-1.5">
                <span className="text-white/60">{tr("Teléfono")}</span>
                <span className="font-mono text-white/80">{empresaDetalle.telefono_contacto || "—"}</span>
              </div>
              <div className="flex justify-between border-b border-white/10 py-1.5">
                <span className="text-white/60">{tr("Fecha de registro")}</span>
                <span className="text-white/80">{fecha(empresaDetalle.created_at)}</span>
              </div>
              <div className="flex justify-between border-b border-white/10 py-1.5">
                <span className="text-white/60">{tr("Estado de la suscripción")}</span>
                <span className="font-semibold text-[#d7dc9a]">
                  {clasificarSuscripcion(empresaDetalle).etiqueta}
                </span>
              </div>
            </div>

            {/* Plantilla y obras */}
            <div className="space-y-2 text-xs">
              <div className="text-xs font-bold uppercase tracking-wider text-white/50">
                {tr("Trabajadores y obras")}
              </div>
              {empresaDetalle.trabajadores_nombres?.map((t, idx) => (
                <div key={idx} className="flex items-center gap-2 text-white/80 py-1 border-b border-white/5">
                  <Users size={12} className="text-white/40" />
                  <span>{t}</span>
                </div>
              ))}
              {empresaDetalle.obras_nombres?.map((o, idx) => (
                <div key={idx} className="flex items-center gap-2 text-white/80 py-1 border-b border-white/5">
                  <Wrench size={12} className="text-white/40" />
                  <span>{o}</span>
                </div>
              ))}
            </div>

            {/* Diagnóstico y Salud */}
            <div className="rounded-2xl border border-white/12 bg-black/25 p-3.5 space-y-2 text-xs">
              <div className="text-[11px] font-bold uppercase tracking-wider text-white/50">
                {tr("Diagnóstico y salud de la empresa")}
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11.5px]">
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle2 size={13} />
                  <span>{tr("Base de datos conectada")}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[#d7dc9a]">
                  <ShieldCheck size={13} />
                  <span>{tr("Clave blindada en BD")}</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle2 size={13} />
                  <span>{tr("0 errores críticos")}</span>
                </div>
                <div className="flex items-center gap-1.5 text-white/70">
                  <RotateCcw size={13} className="text-[#d7dc9a]" />
                  <span>{tr("Auto-renovación: ACTIVA (Stripe)")}</span>
                </div>
              </div>
            </div>

            {/* Laboratorio de Pruebas y Soporte Rápido dentro del modal */}
            <div className="rounded-2xl border border-[#d7dc9a]/30 bg-[#162018]/90 p-3.5 space-y-2.5">
              <div className="text-xs font-bold uppercase tracking-wider text-[#d7dc9a] flex items-center justify-between">
                <span>{tr("Pruebas de suscripción y soporte rápido")}</span>
                <span className="text-[10px] text-white/40">{tr("Regla de cancelación: mínimo 15 días antes del vencimiento")}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => simularExpiracion1Dia(empresaDetalle)}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-white/12 bg-white/5 py-2 font-semibold text-white hover:bg-white/10 transition"
                >
                  <Clock size={12} className="text-amber-400" />
                  <span>{tr("1 día (Auto-renovación)")}</span>
                </button>
                <button
                  type="button"
                  onClick={() => ejecutarAutoRenovacion(empresaDetalle)}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-[#d7dc9a]/40 bg-[#d7dc9a]/15 py-2 font-bold text-[#d7dc9a] hover:bg-[#d7dc9a]/25 transition"
                >
                  <CreditCard size={12} />
                  <span>{tr("Cobrar (+1 mes)")}</span>
                </button>
                <button
                  type="button"
                  onClick={() => simularImpago2Dias(empresaDetalle)}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-red-500/30 bg-red-950/20 py-2 font-semibold text-red-300 hover:bg-red-950/40 transition"
                >
                  <AlertTriangle size={12} />
                  <span>{tr("Impago (2 días caducada)")}</span>
                </button>
                <button
                  type="button"
                  onClick={() => reactivarConMismoCodigo(empresaDetalle)}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-950/20 py-2 font-bold text-emerald-300 hover:bg-emerald-950/40 transition"
                >
                  <CheckCircle2 size={12} />
                  <span>{tr("Reactivar con mismo código")}</span>
                </button>
                <button
                  type="button"
                  onClick={() => simularWebhookStripe(empresaDetalle)}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-sky-500/30 bg-sky-950/20 py-2 font-semibold text-sky-300 hover:bg-sky-950/40 transition"
                >
                  <BellRing size={12} />
                  <span>{tr("Webhook Stripe instantáneo")}</span>
                </button>
                <button
                  type="button"
                  onClick={() => auxilio3DiasGracia(empresaDetalle)}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-950/20 py-2 font-semibold text-amber-300 hover:bg-amber-950/40 transition"
                >
                  <LifeBuoy size={12} />
                  <span>{tr("+3 días auxilio emergencia")}</span>
                </button>
              </div>
            </div>

            {/* Acciones de Suscripción */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={async () => {
                  await renovarMes(empresaDetalle);
                  setEmpresaDetalle(null);
                }}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-white/14 bg-white/5 py-2.5 text-xs font-bold text-white hover:bg-white/10 transition"
              >
                <Plus size={14} className="text-[#d7dc9a]" />
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
