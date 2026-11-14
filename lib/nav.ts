import {
  Clock,
  Truck,
  Receipt,
  Wallet,
  Settings2,
  Calendar,
  CalendarRange,
  LayoutDashboard,
  Mic,
  type LucideIcon,
} from "lucide-react";
import type { Rol } from "@/lib/types";
import { rutaApagada, type Modulos } from "@/lib/modulos";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

// Estos son los que aparecen en la barra inferior en móvil; en escritorio
// se ven todos en la barra lateral, incluido Inicio y Resumen.
export const NAV_ITEMS: NavItem[] = [
  { href: "/fichajes", label: "Fichajes", icon: Clock },
  { href: "/vehiculos", label: "Vehículos", icon: Truck },
  { href: "/gastos", label: "Gastos", icon: Receipt },
  // Donde antes estaban las facturas (ahora van con los gastos)
  { href: "/dinero", label: "Dinero", icon: Wallet },
  { href: "/notas", label: "Notas de voz", icon: Mic },
  { href: "/ajustes", label: "Ajustes", icon: Settings2 },
];

export const NAV_ITEM_INICIO: NavItem = { href: "/", label: "Inicio", icon: LayoutDashboard };
export const NAV_ITEM_RESUMEN: NavItem = { href: "/resumen", label: "Resumen", icon: Calendar };
export const NAV_ITEM_AJUSTES: NavItem = { href: "/ajustes", label: "Ajustes", icon: Settings2 };
// Planificación no cabe en la barra de abajo del móvil: con un séptimo
// icono la cápsula se sale de la pantalla en los iPhone estrechos. Se llega
// a ella desde Inicio (y desde la barra lateral en el ordenador).
export const NAV_ITEM_PLANIFICACION: NavItem = {
  href: "/planificacion",
  label: "Planificación",
  icon: CalendarRange,
};

/**
 * El trabajador tiene la obra, fichar sus horas, ver los vehículos (sin
 * tocarlos) y su cuenta. Ni gastos, ni facturas, ni notas de voz.
 */
const NAV_TRABAJADOR: NavItem[] = [
  NAV_ITEM_INICIO,
  { href: "/fichajes", label: "Mis horas", icon: Clock },
  { href: "/vehiculos", label: "Vehículos", icon: Truck },
  NAV_ITEM_AJUSTES,
];

/**
 * El jefe de obra no ve "Dinero" (lo que paga el cliente es el margen de la
 * obra); sí los gastos, que los necesita para trabajar.
 */
const seccionesDe = (rol: Rol | null) =>
  rol === "jefe_obra" ? NAV_ITEMS.filter((i) => i.href !== "/dinero") : NAV_ITEMS;

/** Barra inferior del móvil. */
export function navMovil(rol: Rol | null, modulos: Modulos): NavItem[] {
  return (rol === "trabajador" ? NAV_TRABAJADOR : seccionesDe(rol)).filter((i) => !rutaApagada(i.href, modulos));
}

/** Barra lateral de escritorio: Inicio → Planificación → secciones → Resumen → Ajustes. */
export function navLateral(rol: Rol | null, modulos: Modulos): NavItem[] {
  return navLateralCompleto(rol).filter((i) => !rutaApagada(i.href, modulos));
}

function navLateralCompleto(rol: Rol | null): NavItem[] {
  if (rol === "trabajador") return NAV_TRABAJADOR;
  const secciones = seccionesDe(rol).filter((i) => i.href !== "/ajustes");
  return [
    NAV_ITEM_INICIO,
    NAV_ITEM_PLANIFICACION,
    ...secciones,
    NAV_ITEM_RESUMEN,
    NAV_ITEM_AJUSTES,
  ];
}

/** Páginas que un trabajador no puede abrir (aunque escriba la dirección a mano). */
export const RUTAS_SOLO_GESTORES = [
  "/gastos",
  "/facturas",
  "/notas",
  "/resumen",
  "/planificacion",
  "/dinero",
];
