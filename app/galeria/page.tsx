import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  CheckCircle2,
  Clock,
  FileSpreadsheet,
  FileText,
  KeyRound,
  LayoutDashboard,
  LogIn,
  Receipt,
  Settings,
  ShieldAlert,
  Smartphone,
  Truck,
  Wallet,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default function GaleriaIndexPage() {
  if (process.env.NEXT_PUBLIC_GALERIA !== "1") {
    notFound();
  }

  const pantallas = [
    {
      id: "landing",
      titulo: "01. Portada Pública (LandingMock)",
      desc: "Maqueta pública sin sesión en 100dvh sin scroll vertical ni horizontal.",
      icon: Smartphone,
      roles: ["Anónimo"],
    },
    {
      id: "login",
      titulo: "02. Acceso y Registro (/login)",
      desc: "Vistas entrar, registro, código de invitación y olvido de contraseña.",
      icon: LogIn,
      roles: ["Anónimo"],
    },
    {
      id: "alta",
      titulo: "03. Alta y Pago Stripe (/alta)",
      desc: "Presentación del servicio con precio formateado y prueba de 14 días.",
      icon: KeyRound,
      roles: ["Nuevo cliente"],
    },
    {
      id: "home-dueno",
      titulo: "04. Portada Dueño / Gestor (/)",
      desc: "Telemetría hero en pizarra profunda, balance al céntimo y estado de cuadrilla.",
      icon: LayoutDashboard,
      roles: ["dueno", "manager", "jefe_obra"],
    },
    {
      id: "home-trabajador",
      titulo: "05. Portada Trabajador + Sello (/)",
      desc: "Sello táctico en 2 segundos, modo sin cobertura, horas acumuladas.",
      icon: Clock,
      roles: ["trabajador"],
    },
    {
      id: "fichajes",
      titulo: "06. Fichajes de Cuadrilla (/fichajes)",
      desc: "Gestión de fichajes del día, corrección del dueño y cambio de obra.",
      icon: CheckCircle2,
      roles: ["dueno", "manager", "jefe_obra"],
    },
    {
      id: "gastos",
      titulo: "07. Gastos: Tickets y Facturas (/gastos)",
      desc: "Agrupación por meses, filtros combinables, desglose y comprobantes.",
      icon: Receipt,
      roles: ["dueno", "manager", "jefe_obra"],
    },
    {
      id: "dinero",
      titulo: "08. Dinero de la Obra (/dinero)",
      desc: "Cobros del cliente, entregas para la obra y dinero en mano del encargado.",
      icon: Wallet,
      roles: ["dueno", "manager", "jefe_obra"],
    },
    {
      id: "planificacion",
      titulo: "09. Planificación y Gantt (/planificacion)",
      desc: "Diagrama escalonado con láser de 'Hoy' e importador de Excel.",
      icon: FileSpreadsheet,
      roles: ["dueno", "manager", "jefe_obra"],
    },
    {
      id: "vehiculos",
      titulo: "10. Vehículos de Empresa (/vehiculos)",
      desc: "Coger y devolver vehículo con registro de km y combustible vinculado.",
      icon: Truck,
      roles: ["Todos los roles"],
    },
    {
      id: "notas",
      titulo: "11. Notas de la Obra (/notas)",
      desc: "Notas fijadas en cabecera con aviso a la cuadrilla.",
      icon: FileText,
      roles: ["dueno", "manager", "jefe_obra"],
    },
    {
      id: "resumen",
      titulo: "12. Resumen Mensual (/resumen)",
      desc: "Desglose por trabajador, días corregidos y exportación Excel lazy-loaded.",
      icon: Calendar,
      roles: ["dueno", "manager", "jefe_obra"],
    },
    {
      id: "ajustes",
      titulo: "13. Ajustes y Accesos (/ajustes)",
      desc: "Configuración de módulos, invitaciones por código y soporte técnico.",
      icon: Settings,
      roles: ["Todos los roles"],
    },
    {
      id: "admin",
      titulo: "14. Panel de Plataforma (/admin)",
      desc: "Gestión global de empresas, códigos de alta, sesiones de soporte y errores.",
      icon: ShieldAlert,
      roles: ["admin_plataforma"],
    },
  ];

  return (
    <div className="min-h-screen bg-[#141915] text-[#F7F9F5] p-6 sm:p-10">
      <div className="max-w-5xl mx-auto">
        <header className="border-b border-[#2E3831] pb-6 mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-obra-yellow text-obra-yellow-ink font-bold font-mono">
                v2
              </span>
              <h1 className="font-display text-2xl sm:text-3xl font-extrabold uppercase tracking-wide text-white">
                Galería de Verificación Interactiva
              </h1>
            </div>
            <p className="mt-1 text-sm text-[#A3B1A7]">
              Ambiente de prueba determinista 100% en memoria (cero llamadas de red). Selecciona una pantalla para probarla en todos los viewports (320px a 1280px) e idiomas (ES, UK, EN).
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-obra-slate-border bg-obra-slate px-4 py-2 font-mono text-xs text-obra-yellow">
            NEXT_PUBLIC_GALERIA=1 (ACTIVA)
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pantallas.map((p) => {
            const Icon = p.icon;
            return (
              <Link
                key={p.id}
                href={`/galeria/${p.id}`}
                className="group flex flex-col justify-between rounded-2xl border border-[#2E3831] bg-obra-slate p-5 transition-all hover:border-obra-yellow/60 hover:bg-[#232B25] hover:shadow-[0_4px_20px_rgba(0,0,0,0.35)]"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-obra-slate-card text-obra-yellow border border-obra-slate-border">
                        <Icon size={20} />
                      </div>
                      <span className="font-bold text-[16px] text-white group-hover:text-obra-yellow transition-colors">
                        {p.titulo}
                      </span>
                    </div>
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-[#A3B1A7]">{p.desc}</p>
                </div>
                <div className="mt-4 flex flex-wrap gap-1.5 border-t border-[#2E3831] pt-3">
                  {p.roles.map((r) => (
                    <span
                      key={r}
                      className="rounded-md bg-[#181E1A] px-2 py-0.5 font-mono text-[10.5px] text-[#A3B1A7]"
                    >
                      {r}
                    </span>
                  ))}
                  <span className="ml-auto font-mono text-xs text-obra-yellow opacity-0 group-hover:opacity-100 transition-opacity">
                    Abrir visor →
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
