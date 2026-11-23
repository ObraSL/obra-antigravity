"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
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
import type { CodigoAlta, EmpresaAdmin, ErrorApp, RegistroAuditoria } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Empty } from "@/components/ui/Empty";
import { GhostButton, PrimaryButton } from "@/components/ui/Button";
import { Input, Field } from "@/components/ui/Field";
import { Sheet } from "@/components/ui/Sheet";
import { localeActual, tr, trN } from "@/lib/i18n";
import clsx from "clsx";

const fecha = (iso: string) => new Date(iso).toLocaleDateString(localeActual());
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const esUuidReal = (id: string) => UUID_RE.test(id);

/** Formatea marcas de tiempo ISO recibidas de BD manteniendo textos legibles de demo. */
function formatearUltimaActividad(valor: string | null | undefined): string | null {
  if (!valor) return null;
  if (!valor.includes("T") || Number.isNaN(Date.parse(valor))) return valor;
  const dt = new Date(valor);
  const dias = Math.floor((Date.now() - dt.getTime()) / 86_400_000);
  if (dias >= 7) return `${dias} днів тому (Мовчить)`;
  if (dias >= 2) return dt.toLocaleDateString(localeActual());
  const hora = dt.toLocaleTimeString(localeActual(), { hour: "2-digit", minute: "2-digit" });
  return dias === 1 ? `Вчора о ${hora}` : `Сьогодні о ${hora}`;
}

type FiltroEstado = "todas" | "activas" | "pausadas" | "inactivas" | "atencion";

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
    errores_24h_count: 3,
    ultima_actividad: "Сьогодні о 08:45",
    motivo_estado: "3 помилки за добу: збій GPS на екрані Fichajes",
    stripe_event: "paid",
    historial_audit: [
      {
        fecha: new Date(Date.now() - 6 * 86_400_000).toISOString(),
        accion: "Pago mensual Stripe",
        detalle: "Cobro automático 49,00 € procesado (invoice.payment_succeeded)",
        admin: "Stripe Webhook",
      },
    ],
  },
  {
    id: "empresa-solar",
    nombre: "Solaria Renovable & Placas S.L.",
    sector: "Energía solar y fotovoltaica",
    codigo: "OBRA-SOLA-92B4",
    created_at: new Date(Date.now() - 12 * 86_400_000).toISOString(),
    miembros_count: 2,
    obras_count: 1,
    activa_hasta: new Date(Date.now() + 2 * 86_400_000).toISOString(),
    bloqueada: false,
    codigo_alta: "TRIAL-SOLAR-7D",
    email_contacto: "info@solariaplacas.es",
    telefono_contacto: "+34 622 556 778",
    responsable_nombre: "Adrián Navarro",
    trabajadores_nombres: ["Adrián Navarro (Instalador)", "Pablo Ortega (Inversores)"],
    obras_nombres: ["Parque Solar Residencial El Valle"],
    errores_24h_count: 0,
    ultima_actividad: "Вчора о 17:30",
    motivo_estado: "Пільговий період (2 дні): невдала оплата Stripe (Картка прострочена)",
    stripe_event: "failed",
    historial_audit: [
      {
        fecha: new Date(Date.now() - 1 * 86_400_000).toISOString(),
        accion: "Fallo de cobro Stripe",
        detalle: "Tarjeta rechazada: tarjeta caducada (card_expired). Período de gracia activado.",
        admin: "Stripe Webhook",
      },
    ],
  },
  {
    id: "empresa-construccion",
    nombre: "Edifica Construcción & Reformas S.L.",
    sector: "Construcción y estructuras",
    codigo: "OBRA-EDIF-33K9",
    created_at: new Date(Date.now() - 75 * 86_400_000).toISOString(),
    miembros_count: 2,
    obras_count: 1,
    activa_hasta: new Date(Date.now() - 2 * 86_400_000).toISOString(),
    bloqueada: false,
    codigo_alta: "ALTA-EDIF-OBRA",
    email_contacto: "carlos@edificaconstruccion.es",
    telefono_contacto: "+34 633 889 900",
    responsable_nombre: "Carlos Menéndez",
    trabajadores_nombres: ["Héctor Romero (Encofrador)", "Gabriel Castro (Albañil)"],
    obras_nombres: ["Villa Moderna Los Álamos"],
    errores_24h_count: 0,
    ultima_actividad: "8 днів тому (Мовчить)",
    motivo_estado: "Прострочена: платіж Stripe відхилено банком (Insufficient funds)",
    stripe_event: "failed",
    historial_audit: [
      {
        fecha: new Date(Date.now() - 2 * 86_400_000).toISOString(),
        accion: "Fallo definitivo Stripe",
        detalle: "Fondos insuficientes (insufficient_funds). Suscripción caducada.",
        admin: "Stripe Webhook",
      },
    ],
  },
];

/** Incidencias técnicas canónicas de la app */
const ERRORES_CANONICOS: ErrorApp[] = [
  {
    id: 101,
    creado_en: new Date(Date.now() - 2 * 3600_000).toISOString(),
    mensaje: "GeolocationPositionError: Timeout expired (GPS)",
    origen: "navegador",
    ruta: "/fichajes",
    email: "lucas@voltmax.es",
    empresa: "VoltMax Electricidad & Instalaciones S.L.",
    navegador: "Chrome Mobile 122.0 / Android 14 (Samsung Galaxy A54)",
    detalle: "Error: GeolocationPositionError: Timeout expired\n  at navigator.geolocation.getCurrentPosition (fichaje-gps.ts:42)\n  at registrarFichaje (fichajes/page.tsx:118)",
  },
  {
    id: 102,
    creado_en: new Date(Date.now() - 5 * 3600_000).toISOString(),
    mensaje: "NetworkError: Failed to fetch /api/fichajes/entrada",
    origen: "navegador",
    ruta: "/fichajes",
    email: "mateo@voltmax.es",
    empresa: "VoltMax Electricidad & Instalaciones S.L.",
    navegador: "Safari Mobile 17.2 / iOS 17.1 (iPhone 13)",
    detalle: "TypeError: Failed to fetch\n  at fetchConReintentos (api.ts:28)\n  at submitFichaje (fichajes/page.tsx:145)",
  },
  {
    id: 103,
    creado_en: new Date(Date.now() - 9 * 3600_000).toISOString(),
    mensaje: "CameraPermissionDenied: User denied Geolocation prompt",
    origen: "navegador",
    ruta: "/fichajes",
    email: "lucas@voltmax.es",
    empresa: "VoltMax Electricidad & Instalaciones S.L.",
    navegador: "Chrome Mobile 122.0 / Android 14 (Samsung Galaxy A54)",
    detalle: "NotAllowedError: Geolocation permission denied by user\n  at solicitarPermiso (fichaje-gps.ts:19)",
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

/** Estado simple de 3 estados para lectura rápida en la lista principal. */
function estadoSimple(e: EmpresaAdmin): {
  clave: "activa" | "pausada" | "inactiva";
  etiqueta: string;
  clase: string;
} {
  if (e.bloqueada) {
    return {
      clave: "pausada",
      etiqueta: tr("Pausada"),
      clase: "border-amber-500/40 bg-amber-950/35 text-amber-300",
    };
  }
  if (clasificarSuscripcion(e).tipo === "caducada") {
    return {
      clave: "inactiva",
      etiqueta: tr("Inactiva"),
      clase: "border-red-500/40 bg-red-950/35 text-red-400",
    };
  }
  return {
    clave: "activa",
    etiqueta: tr("Activa"),
    clase: "border-emerald-500/40 bg-emerald-950/30 text-emerald-400",
  };
}

/** Calcula los días que lleva la empresa registrada en la plataforma. */
function tiempoConNosotros(iso: string): string {
  const dias = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000));
  return `${dias} ${tr("días")}`;
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

  // Empresa seleccionada en la vista detalle de pantalla completa
  const [empresaSeleccionadaId, setEmpresaSeleccionadaId] = useState<string | null>(null);

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

  // Modal de acción con confirmación y auditoría
  const [modalAccion, setModalAccion] = useState<{
    tipo: "renovar_mes" | "poner_fecha" | "bloquear" | "desbloquear";
    empresa: EmpresaAdmin;
  } | null>(null);
  const [motivoBloqueo, setMotivoBloqueo] = useState("");
  const [fechaPersonalizada, setFechaPersonalizada] = useState("");
  const [procesandoAccion, setProcesandoAccion] = useState(false);
  const [errorAccion, setErrorAccion] = useState("");

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
        const mapaDuenos = new Map((duenosRes.data ?? []).map((d) => [d.empresa_id, d]));
        listaEmpresas = listaEmpresas.map((e) => {
          const d = mapaDuenos.get(e.id);
          return {
            ...e,
            email_contacto: e.email_contacto || d?.email || null,
            responsable_nombre: e.responsable_nombre || d?.nombre || null,
            errores_24h_count: Number(e.errores_24h_count ?? 0),
            ultima_actividad: formatearUltimaActividad(e.ultima_actividad),
            historial_audit: Array.isArray(e.historial_audit) ? e.historial_audit : [],
          };
        });
        const idsExistentes = new Set(listaEmpresas.map((e) => e.id));
        const faltantes = EMPRESAS_CANONICAS.filter((e) => !idsExistentes.has(e.id));
        listaEmpresas = [...creadasPorUsuario, ...listaEmpresas, ...faltantes];
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
      const errsRaw = (c.data as ErrorApp[]) ?? [];
      setErrores(errsRaw.length > 0 ? errsRaw : ERRORES_CANONICOS);
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
      setErrores(ERRORES_CANONICOS);
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

  /** Actualizar estado de empresa; en empresas demo persiste en localStorage overrides. */
  const actualizarEmpresa = (
    id: string,
    updates: Partial<EmpresaAdmin>,
    persistirOverride = !esUuidReal(id)
  ) => {
    setEmpresas((prev) => {
      const updated = prev.map((item) => (item.id === id ? { ...item, ...updates } : item));
      try {
        const rawO = localStorage.getItem("obra_admin_empresa_overrides");
        const overrides = rawO ? JSON.parse(rawO) : {};
        if (persistirOverride) {
          overrides[id] = { ...(overrides[id] || {}), ...updates };
        } else {
          delete overrides[id];
        }
        localStorage.setItem("obra_admin_empresa_overrides", JSON.stringify(overrides));
      } catch {
        /* ignore */
      }
      return updated;
    });
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

  /** Ejecutar acción confirmada desde el modal de auditoría */
  const ejecutarModalAccion = async () => {
    if (!modalAccion) return;
    setProcesandoAccion(true);
    setErrorAccion("");

    const { tipo, empresa } = modalAccion;

    try {
      let nuevaActivaHasta = empresa.activa_hasta;
      let nuevoBloqueada = empresa.bloqueada;
      let accionAudit = "";
      let detalleAudit = "";
      let nuevoMotivo = empresa.motivo_estado;

      if (tipo === "renovar_mes") {
        const hoy = new Date();
        const base = empresa.activa_hasta && new Date(empresa.activa_hasta) > hoy ? new Date(empresa.activa_hasta) : hoy;
        base.setMonth(base.getMonth() + 1);
        nuevaActivaHasta = base.toISOString();
        nuevoBloqueada = false;
        accionAudit = "Extensión de suscripción (+1 mes)";
        detalleAudit = `Suscripción ampliada 30 días hasta ${fecha(nuevaActivaHasta)}`;
        nuevoMotivo = null;
      } else if (tipo === "poner_fecha") {
        if (!fechaPersonalizada) {
          setErrorAccion(tr("Selecciona una fecha válida."));
          setProcesandoAccion(false);
          return;
        }
        nuevaActivaHasta = new Date(fechaPersonalizada).toISOString();
        accionAudit = "Ajuste manual de fecha";
        detalleAudit = `Fecha fijada manualmente a ${fecha(nuevaActivaHasta)}`;
        if (new Date(nuevaActivaHasta).getTime() > Date.now()) {
          nuevoBloqueada = false;
          nuevoMotivo = null;
        }
      } else if (tipo === "bloquear") {
        if (!motivoBloqueo.trim()) {
          setErrorAccion(tr("Indica un motivo obligatorio para el bloqueo."));
          setProcesandoAccion(false);
          return;
        }
        nuevoBloqueada = true;
        accionAudit = "Bloqueo manual";
        detalleAudit = `Bloqueada por Superadmin. Motivo: ${motivoBloqueo.trim()}`;
        nuevoMotivo = `Bloqueada: ${motivoBloqueo.trim()}`;
      } else if (tipo === "desbloquear") {
        nuevoBloqueada = false;
        accionAudit = "Desbloqueo manual";
        detalleAudit = "Acceso restablecido por Superadmin";
        nuevoMotivo = null;
      }

      if (esUuidReal(empresa.id)) {
        const { error: rpcError } = await supabase.rpc("establecer_suscripcion", {
          p_empresa: empresa.id,
          p_activa_hasta: nuevaActivaHasta,
          p_bloqueada: nuevoBloqueada,
          p_motivo: nuevoMotivo ?? null,
          p_accion: accionAudit,
          p_detalle: detalleAudit,
        });
        if (rpcError) {
          setErrorAccion(rpcError.message || "Error al guardar en base de datos.");
          setProcesandoAccion(false);
          return;
        }
      }

      const nuevoRegistro: RegistroAuditoria = {
        fecha: new Date().toISOString(),
        accion: accionAudit,
        detalle: detalleAudit,
        admin: "Superadmin",
      };

      const historialPrevio = empresa.historial_audit || [];
      const historialNuevo = [nuevoRegistro, ...historialPrevio];

      actualizarEmpresa(
        empresa.id,
        {
          activa_hasta: nuevaActivaHasta,
          bloqueada: nuevoBloqueada,
          historial_audit: historialNuevo,
          motivo_estado: nuevoMotivo,
        },
        !esUuidReal(empresa.id)
      );

      mostrarNotificacion("exito", tr("Acción completada y registrada en el historial de auditoría."));
      setModalAccion(null);
      setMotivoBloqueo("");
      setFechaPersonalizada("");
    } catch (err: any) {
      setErrorAccion(err?.message || "Error al procesar la acción.");
    } finally {
      setProcesandoAccion(false);
    }
  };

  // Contadores simples para la vista de lista (Activa / Pausada / Inactiva)
  const totalEmpresas = empresas.length;
  const activasSimpleCount = empresas.filter((e) => estadoSimple(e).clave === "activa").length;
  const pausadasSimpleCount = empresas.filter((e) => estadoSimple(e).clave === "pausada").length;
  const inactivasSimpleCount = empresas.filter((e) => estadoSimple(e).clave === "inactiva").length;

  // Empresas que requieren atención urgente
  const empresasAtencion = useMemo(() => {
    return empresas.filter((e) => {
      const s = clasificarSuscripcion(e);
      const porCaducarOcaducada = s.tipo === "caducada" || s.tipo === "gracia" || (s.diasRestantes !== null && s.diasRestantes <= 7);
      const falloStripe = e.stripe_event === "failed";
      const tieneErrores24h = (e.errores_24h_count ?? 0) >= 1;
      const inactivo7Dias = Boolean(
        e.ultima_actividad &&
          (e.ultima_actividad.includes("8") ||
            e.ultima_actividad.includes("Мовчить") ||
            e.ultima_actividad.includes("días") ||
            e.ultima_actividad.includes("днів"))
      );
      const bloqueada = e.bloqueada;
      return porCaducarOcaducada || falloStripe || tieneErrores24h || inactivo7Dias || bloqueada;
    });
  }, [empresas]);

  // Filtrado de empresas en la lista compacta
  const empresasFiltradas = useMemo(() => {
    const idsAtencion = new Set(empresasAtencion.map((a) => a.id));
    return empresas.filter((e) => {
      const st = estadoSimple(e);

      if (filtro === "activas" && st.clave !== "activa") return false;
      if (filtro === "pausadas" && st.clave !== "pausada") return false;
      if (filtro === "inactivas" && st.clave !== "inactiva") return false;
      if (filtro === "atencion" && !idsAtencion.has(e.id)) return false;

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
  }, [empresas, empresasAtencion, filtro, busqueda]);

  const empresaSeleccionada = empresas.find((e) => e.id === empresaSeleccionadaId) ?? null;

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
          onClick={() => {
            setTabActiva("codigos");
            setEmpresaSeleccionadaId(null);
          }}
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
          onClick={() => {
            setTabActiva("errores");
            setEmpresaSeleccionadaId(null);
          }}
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
          PESTAÑA 1: LISTA COMPACTA -> PANTALLA DE UNA EMPRESA
         ======================================================== */}
      {tabActiva === "empresas" && !empresaSeleccionada && (
        <div className="space-y-4">
          {/* Buscador + Nueva empresa */}
          <div className="flex flex-col sm:flex-row gap-2.5">
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

          {/* Píldoras simples de filtro */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {(
              [
                { id: "todas", label: `${tr("Todas")} (${totalEmpresas})`, alerta: false },
                { id: "activas", label: `${tr("Activas")} (${activasSimpleCount})`, alerta: false },
                { id: "pausadas", label: `${tr("Pausadas")} (${pausadasSimpleCount})`, alerta: false },
                { id: "inactivas", label: `${tr("Inactivas")} (${inactivasSimpleCount})`, alerta: false },
                {
                  id: "atencion",
                  label: `${tr("Requiere atención")} (${empresasAtencion.length})`,
                  alerta: empresasAtencion.length > 0,
                },
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
                    : f.alerta
                    ? "border-amber-500/35 bg-amber-950/25 text-amber-300 hover:bg-amber-950/40"
                    : "border-white/10 bg-white/5 text-white/65 hover:bg-white/10 hover:text-white"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Lista compacta de 1 fila por empresa (escala a 100+ empresas sin saturar) */}
          {cargando ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin text-[#d7dc9a]" size={26} />
            </div>
          ) : empresasFiltradas.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-[#19211c]/60 p-8 text-center text-white/50 text-sm">
              {tr("No se encontraron empresas con ese filtro.")}
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-white/12 bg-[#19211c]/90 divide-y divide-white/8 shadow-lg backdrop-blur-xl">
              {empresasFiltradas.map((e) => {
                const st = estadoSimple(e);
                return (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => setEmpresaSeleccionadaId(e.id)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition hover:bg-white/[0.04] active:bg-white/[0.06]"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-bold text-white">{e.nombre}</div>
                      <div className="mt-0.5 flex items-center gap-2 text-[11px] text-white/45 flex-wrap">
                        <span className="font-mono">{e.codigo}</span>
                        {Boolean(e.errores_24h_count && e.errores_24h_count > 0) && (
                          <span className="inline-flex items-center gap-1 rounded bg-red-950/50 px-1.5 py-0.2 font-semibold text-red-300 border border-red-500/30">
                            <AlertTriangle size={10} />
                            <span>{e.errores_24h_count ?? 0}</span>
                          </span>
                        )}
                        {e.stripe_event === "failed" && (
                          <span className="font-semibold text-red-400">Stripe</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <span
                        className={clsx(
                          "rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider",
                          st.clase
                        )}
                      >
                        {st.etiqueta}
                      </span>
                      <ChevronRight size={16} className="text-white/35" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          PESTAÑA 1 (VISTA DETALLE): UNA SOLA EMPRESA EN PANTALLA
         ======================================================== */}
      {tabActiva === "empresas" && empresaSeleccionada && (() => {
        const s = clasificarSuscripcion(empresaSeleccionada);
        const st = estadoSimple(empresaSeleccionada);
        const erroresEmpresa = errores.filter(
          (err) =>
            err.empresa === empresaSeleccionada.nombre ||
            err.email === empresaSeleccionada.email_contacto
        );

        return (
          <div className="space-y-4">
            {/* Barra superior: Volver + Acceder a empresa */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setEmpresaSeleccionadaId(null)}
                className="flex items-center gap-1.5 rounded-xl border border-white/12 bg-white/5 px-3 py-2 text-xs font-semibold text-white/80 hover:bg-white/10 hover:text-white transition"
              >
                <ArrowLeft size={14} />
                <span>{tr("Volver a la lista")}</span>
              </button>

              <button
                type="button"
                onClick={() => entrarEnEmpresa(empresaSeleccionada)}
                className="flex items-center gap-1.5 rounded-xl bg-[#d7dc9a] px-4 py-2 text-xs font-bold text-[#141a16] shadow-md transition hover:bg-[#c8cd8b] active:scale-95"
              >
                <LogIn size={14} />
                <span>{tr("Acceder a empresa")}</span>
              </button>
            </div>

            {/* Tarjeta principal de la empresa */}
            <div className="rounded-2xl border border-white/12 bg-[#19211c]/95 p-4 sm:p-5 backdrop-blur-xl shadow-lg space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-bold text-white">{empresaSeleccionada.nombre}</h2>
                    <span className={clsx("rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider", st.clase)}>
                      {st.etiqueta}
                    </span>
                    <span className={clsx("rounded-full border px-2.5 py-0.5 text-[10.5px] font-semibold", s.badgeClase)}>
                      {s.etiqueta}
                    </span>
                    {empresaSeleccionada.stripe_event && (
                      <span
                        className={clsx(
                          "rounded-full border px-2 py-0.5 text-[10.5px] font-semibold",
                          empresaSeleccionada.stripe_event === "paid" && "border-emerald-500/30 bg-emerald-950/30 text-emerald-300",
                          empresaSeleccionada.stripe_event === "failed" && "border-red-500/40 bg-red-950/40 text-red-300",
                          empresaSeleccionada.stripe_event === "trialing" && "border-amber-500/30 bg-amber-950/30 text-amber-300",
                          empresaSeleccionada.stripe_event === "canceled" && "border-white/20 bg-white/5 text-white/50"
                        )}
                      >
                        {empresaSeleccionada.stripe_event === "paid" && tr("Stripe: Cobro correcto")}
                        {empresaSeleccionada.stripe_event === "failed" && tr("Stripe: Fallo de cobro")}
                        {empresaSeleccionada.stripe_event === "trialing" && tr("Stripe: En prueba")}
                        {empresaSeleccionada.stripe_event === "canceled" && tr("Stripe: Cancelado")}
                      </span>
                    )}
                  </div>

                  {empresaSeleccionada.sector && (
                    <div className="flex items-center gap-1.5 text-xs text-white/55">
                      {empresaSeleccionada.sector.includes("Electricidad") ? (
                        <Zap size={13} className="text-[#d7dc9a]" />
                      ) : empresaSeleccionada.sector.includes("solar") || empresaSeleccionada.sector.includes("Placas") ? (
                        <Sun size={13} className="text-[#d7dc9a]" />
                      ) : (
                        <Hammer size={13} className="text-[#d7dc9a]" />
                      )}
                      <span>{empresaSeleccionada.sector}</span>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => copiar(empresaSeleccionada.codigo)}
                  className="inline-flex items-center gap-1.5 self-start rounded-lg border border-[#d7dc9a]/30 bg-[#d7dc9a]/10 px-2.5 py-1 font-mono text-xs font-bold text-[#d7dc9a] hover:bg-[#d7dc9a]/20 transition shrink-0"
                  title={tr("Copiar clave")}
                >
                  <span>{empresaSeleccionada.codigo}</span>
                  {copiado === empresaSeleccionada.codigo ? <Check size={12} /> : <Copy size={12} />}
                </button>
              </div>

              {empresaSeleccionada.motivo_estado && (
                <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-950/25 px-3 py-2 text-xs font-medium text-amber-200">
                  <AlertTriangle size={14} className="text-amber-400 shrink-0" />
                  <span>{empresaSeleccionada.motivo_estado}</span>
                </div>
              )}

              {/* 4 cifras clave de un vistazo */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="rounded-xl border border-white/10 bg-black/25 p-3">
                  <div className="text-[10.5px] text-white/50">{tr("Con nosotros")}</div>
                  <div className="mt-0.5 text-sm font-bold text-white">
                    {tiempoConNosotros(empresaSeleccionada.created_at)}
                  </div>
                  <div className="text-[10px] text-white/40">{fecha(empresaSeleccionada.created_at)}</div>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/25 p-3">
                  <div className="text-[10.5px] text-white/50">{tr("Estado de la suscripción")}</div>
                  <div className="mt-0.5 text-sm font-bold text-[#d7dc9a]">
                    {empresaSeleccionada.activa_hasta ? fecha(empresaSeleccionada.activa_hasta) : tr("Sin caducidad")}
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/25 p-3">
                  <div className="text-[10.5px] text-white/50">{tr("Última actividad")}</div>
                  <div className="mt-0.5 text-sm font-bold text-white/90 truncate">
                    {empresaSeleccionada.ultima_actividad || "—"}
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/25 p-3">
                  <div className="text-[10.5px] text-white/50">{tr("Errores")}</div>
                  <div
                    className={clsx(
                      "mt-0.5 font-mono text-sm font-bold",
                      erroresEmpresa.length > 0 ? "text-red-400" : "text-emerald-400"
                    )}
                  >
                    {erroresEmpresa.length}
                  </div>
                </div>
              </div>

              {/* Acciones rápidas de suscripción con confirmación */}
              <div className="flex flex-wrap items-center gap-2 border-t border-white/10 pt-3">
                <button
                  type="button"
                  onClick={() => setModalAccion({ tipo: "renovar_mes", empresa: empresaSeleccionada })}
                  className="flex items-center gap-1.5 rounded-xl border border-white/14 bg-white/5 px-3 py-2 text-xs font-semibold text-white hover:bg-white/10 transition"
                >
                  <Plus size={13} className="text-[#d7dc9a]" />
                  <span>{tr("+1 mes")}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setModalAccion({ tipo: "poner_fecha", empresa: empresaSeleccionada })}
                  className="flex items-center gap-1.5 rounded-xl border border-white/14 bg-white/5 px-3 py-2 text-xs font-semibold text-white hover:bg-white/10 transition"
                >
                  <Calendar size={13} className="text-[#d7dc9a]" />
                  <span>{tr("Establecer fecha")}</span>
                </button>

                {empresaSeleccionada.bloqueada ? (
                  <button
                    type="button"
                    onClick={() => setModalAccion({ tipo: "desbloquear", empresa: empresaSeleccionada })}
                    className="rounded-xl border border-green-500/40 bg-green-950/20 px-3 py-2 text-xs font-semibold text-green-400 hover:bg-green-950/40 transition"
                  >
                    {tr("Desbloquear")}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setModalAccion({ tipo: "bloquear", empresa: empresaSeleccionada })}
                    className="rounded-xl border border-red-500/40 bg-red-950/20 px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-950/40 transition"
                  >
                    {tr("Bloquear")}
                  </button>
                )}
              </div>
            </div>

            {/* Errores específicos de esta empresa */}
            <div className="rounded-2xl border border-white/12 bg-[#19211c]/90 p-4 backdrop-blur-xl space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-white/70">
                <span className="flex items-center gap-1.5">
                  <AlertTriangle size={14} className={erroresEmpresa.length > 0 ? "text-red-400" : "text-emerald-400"} />
                  <span>{tr("Errores de la app")}</span>
                </span>
                <span className="font-mono text-[#d7dc9a]">{erroresEmpresa.length}</span>
              </div>

              {erroresEmpresa.length === 0 ? (
                <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-center text-xs text-emerald-400/85">
                  {tr("0 errores críticos")}
                </div>
              ) : (
                <div className="space-y-2">
                  {erroresEmpresa.map((err) => (
                    <div
                      key={err.id}
                      onClick={() => setErrorAbierto(errorAbierto === err.id ? null : err.id)}
                      className="cursor-pointer rounded-xl border border-red-500/25 bg-red-950/20 p-3 transition hover:border-red-500/45"
                    >
                      <div className="flex items-center justify-between text-[11px] text-white/50">
                        <span>{new Date(err.creado_en).toLocaleString(localeActual())}</span>
                        <span className="font-mono text-[#d7dc9a]">{err.email ?? ""}</span>
                      </div>
                      <div className="mt-1 text-xs sm:text-sm font-semibold text-red-300">{err.mensaje}</div>
                      {err.ruta && (
                        <div className="mt-0.5 font-mono text-[11px] text-white/50">
                          {tr("Pantalla / Ruta")}: {err.ruta}
                        </div>
                      )}
                      {errorAbierto === err.id && (
                        <div className="mt-2.5 space-y-1.5 rounded-lg bg-black/50 p-2.5 font-mono text-[11px] border border-white/10">
                          {err.navegador && (
                            <div className="text-white/75">
                              <span className="text-white/40">{tr("Dispositivo / Navegador")}: </span>
                              {err.navegador}
                            </div>
                          )}
                          {err.detalle && (
                            <pre className="max-h-52 overflow-auto whitespace-pre-wrap break-all text-red-300">
                              {err.detalle}
                            </pre>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Contacto, plantilla y obras */}
            <div className="rounded-2xl border border-white/12 bg-[#19211c]/90 p-4 backdrop-blur-xl space-y-3 text-xs">
              <div className="text-xs font-bold uppercase tracking-wider text-white/60">
                {tr("Información general")}
              </div>

              <div className="flex flex-wrap items-center gap-3 text-white/70">
                {empresaSeleccionada.responsable_nombre && (
                  <span className="font-semibold text-white">{empresaSeleccionada.responsable_nombre}</span>
                )}
                {empresaSeleccionada.email_contacto && (
                  <a href={`mailto:${empresaSeleccionada.email_contacto}`} className="flex items-center gap-1 text-[#d7dc9a] hover:underline">
                    <Mail size={12} /> {empresaSeleccionada.email_contacto}
                  </a>
                )}
                {empresaSeleccionada.telefono_contacto && (
                  <a href={`tel:${empresaSeleccionada.telefono_contacto}`} className="flex items-center gap-1 text-white/75 hover:underline">
                    <Phone size={12} /> {empresaSeleccionada.telefono_contacto}
                  </a>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-white/10 pt-3">
                <div className="space-y-1.5">
                  <div className="text-[11px] font-semibold text-white/50 flex items-center gap-1.5">
                    <Users size={12} />
                    <span>{trN(empresaSeleccionada.miembros_count, "{n} miembro", "{n} miembros")}</span>
                  </div>
                  {empresaSeleccionada.trabajadores_nombres?.map((t, idx) => (
                    <div key={idx} className="text-white/80 py-0.5">{t}</div>
                  ))}
                </div>
                <div className="space-y-1.5">
                  <div className="text-[11px] font-semibold text-white/50 flex items-center gap-1.5">
                    <Wrench size={12} />
                    <span>{trN(empresaSeleccionada.obras_count, "{n} obra", "{n} obras")}</span>
                  </div>
                  {empresaSeleccionada.obras_nombres?.map((o, idx) => (
                    <div key={idx} className="text-white/80 py-0.5">{o}</div>
                  ))}
                </div>
              </div>
            </div>

            {/* Historial de Auditoría */}
            <div className="rounded-2xl border border-white/12 bg-[#19211c]/90 p-4 backdrop-blur-xl space-y-2.5 text-xs">
              <div className="text-xs font-bold uppercase tracking-wider text-white/60 flex items-center gap-1.5">
                <History size={13} className="text-[#d7dc9a]" />
                <span>{tr("Historial de auditoría")}</span>
              </div>
              {!empresaSeleccionada.historial_audit || empresaSeleccionada.historial_audit.length === 0 ? (
                <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-center text-white/40 text-[11px]">
                  {tr("Sin registros de auditoría aún")}
                </div>
              ) : (
                <div className="space-y-1.5 max-h-60 overflow-y-auto">
                  {empresaSeleccionada.historial_audit.map((h, idx) => (
                    <div key={idx} className="rounded-xl border border-white/10 bg-black/25 p-2.5 space-y-1">
                      <div className="flex items-center justify-between text-[10.5px] text-white/50">
                        <span className="font-semibold text-white/90">{h.accion}</span>
                        <span>{new Date(h.fecha).toLocaleString(localeActual())}</span>
                      </div>
                      <div className="text-[11px] text-white/70">{h.detalle}</div>
                      {h.admin && <div className="text-[10px] text-[#d7dc9a] font-mono">{h.admin}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Simulador de pruebas colapsado por defecto */}
            <details className="rounded-2xl border border-white/10 bg-[#141b16]/85 p-3.5 text-xs">
              <summary className="cursor-pointer select-none font-bold uppercase tracking-wider text-[#d7dc9a]/85">
                {tr("Pruebas de suscripción y soporte rápido")}
              </summary>
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={() => simularExpiracion1Dia(empresaSeleccionada)}
                  className="flex items-center justify-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-2 font-medium text-white/80 hover:bg-white/12 transition"
                >
                  <Clock size={11} className="text-amber-400" />
                  <span>{tr("1 día (Auto-renovación)")}</span>
                </button>
                <button
                  type="button"
                  onClick={() => ejecutarAutoRenovacion(empresaSeleccionada)}
                  className="flex items-center justify-center gap-1 rounded-lg border border-[#d7dc9a]/30 bg-[#d7dc9a]/10 px-2 py-2 font-bold text-[#d7dc9a] hover:bg-[#d7dc9a]/20 transition"
                >
                  <CreditCard size={11} />
                  <span>{tr("Cobrar (+1 mes)")}</span>
                </button>
                <button
                  type="button"
                  onClick={() => simularImpago2Dias(empresaSeleccionada)}
                  className="flex items-center justify-center gap-1 rounded-lg border border-red-500/30 bg-red-950/20 px-2 py-2 font-medium text-red-300 hover:bg-red-950/40 transition"
                >
                  <AlertTriangle size={11} />
                  <span>{tr("Impago (2 días caducada)")}</span>
                </button>
                <button
                  type="button"
                  onClick={() => reactivarConMismoCodigo(empresaSeleccionada)}
                  className="flex items-center justify-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-950/20 px-2 py-2 font-bold text-emerald-300 hover:bg-emerald-950/40 transition"
                >
                  <CheckCircle2 size={11} />
                  <span>{tr("Reactivar con mismo código")}</span>
                </button>
                <button
                  type="button"
                  onClick={() => simularWebhookStripe(empresaSeleccionada)}
                  className="flex items-center justify-center gap-1 rounded-lg border border-sky-500/30 bg-sky-950/20 px-2 py-2 font-medium text-sky-300 hover:bg-sky-950/40 transition"
                >
                  <BellRing size={11} />
                  <span>{tr("Webhook Stripe instantáneo")}</span>
                </button>
                <button
                  type="button"
                  onClick={() => auxilio3DiasGracia(empresaSeleccionada)}
                  className="flex items-center justify-center gap-1 rounded-lg border border-amber-500/30 bg-amber-950/20 px-2 py-2 font-medium text-amber-300 hover:bg-amber-950/40 transition"
                >
                  <LifeBuoy size={11} />
                  <span>{tr("+3 días auxilio emergencia")}</span>
                </button>
              </div>
            </details>
          </div>
        );
      })()}

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

      {/* Modal de Confirmación y Auditoría para Acciones de Suscripción y Bloqueo */}
      {modalAccion && (
        <Sheet
          title={
            modalAccion.tipo === "renovar_mes"
              ? tr("Confirmar renovación (+1 mes)")
              : modalAccion.tipo === "poner_fecha"
              ? tr("Confirmar cambio de fecha")
              : modalAccion.tipo === "bloquear"
              ? tr("Confirmar bloqueo")
              : tr("Confirmar desbloqueo")
          }
          onClose={() => {
            if (!procesandoAccion) {
              setModalAccion(null);
              setMotivoBloqueo("");
              setFechaPersonalizada("");
              setErrorAccion("");
            }
          }}
        >
          <div className="space-y-4">
            <div className="rounded-xl border border-white/10 bg-black/30 p-3.5 space-y-1">
              <div className="text-xs text-white/50">{tr("Empresas")}:</div>
              <div className="text-sm font-bold text-white">{modalAccion.empresa.nombre}</div>
              <div className="font-mono text-xs text-[#d7dc9a]">{modalAccion.empresa.codigo}</div>
            </div>

            {modalAccion.tipo === "renovar_mes" && (
              <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
                {tr("¿Seguro que deseas extender la suscripción de «{empresa}» por 30 días más?", {
                  empresa: modalAccion.empresa.nombre,
                })}
              </p>
            )}

            {modalAccion.tipo === "poner_fecha" && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-white/70 block">
                  {tr("Fecha personalizada")}
                </label>
                <input
                  type="date"
                  value={fechaPersonalizada}
                  onChange={(e) => setFechaPersonalizada(e.target.value)}
                  className="w-full rounded-xl border border-white/14 bg-black/40 p-2.5 text-sm text-white focus:border-[#d7dc9a] focus:outline-none"
                />
                <p className="text-[11px] text-white/50">
                  {tr("¿Establecer la fecha de expiración de «{empresa}» al {fecha}?", {
                    empresa: modalAccion.empresa.nombre,
                    fecha: fechaPersonalizada ? fecha(fechaPersonalizada) : "...",
                  })}
                </p>
              </div>
            )}

            {modalAccion.tipo === "bloquear" && (
              <div className="space-y-3">
                <p className="text-xs sm:text-sm text-red-300 leading-relaxed">
                  {tr("¿Seguro que deseas bloquear a «{empresa}»? El acceso quedará suspendido temporalmente.", {
                    empresa: modalAccion.empresa.nombre,
                  })}
                </p>
                <div>
                  <label className="text-xs font-semibold text-white/70 block mb-1">
                    {tr("Motivo del bloqueo")} <span className="text-red-400">*</span>
                  </label>
                  <Input
                    value={motivoBloqueo}
                    onChange={(e) => setMotivoBloqueo(e.target.value)}
                    placeholder={tr("Ej. Falta de pago recurrente tras 3 avisos")}
                    className="bg-black/30 border-white/14"
                  />
                </div>
              </div>
            )}

            {modalAccion.tipo === "desbloquear" && (
              <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
                {tr("¿Seguro que deseas desbloquear a «{empresa}»? Se restablecerá el acceso inmediatamente.", {
                  empresa: modalAccion.empresa.nombre,
                })}
              </p>
            )}

            {errorAccion && (
              <div className="rounded-xl border border-red-500/40 bg-red-950/40 p-2.5 text-xs text-red-300">
                {errorAccion}
              </div>
            )}

            <div className="flex gap-2 pt-3">
              <GhostButton
                disabled={procesandoAccion}
                onClick={() => {
                  setModalAccion(null);
                  setMotivoBloqueo("");
                  setFechaPersonalizada("");
                  setErrorAccion("");
                }}
              >
                {tr("Cancelar")}
              </GhostButton>
              <PrimaryButton
                disabled={procesandoAccion}
                onClick={ejecutarModalAccion}
              >
                {procesandoAccion && <Loader2 size={16} className="animate-spin" />}
                {tr("Confirmar acción")}
              </PrimaryButton>
            </div>
          </div>
        </Sheet>
      )}
    </div>
  );
}
