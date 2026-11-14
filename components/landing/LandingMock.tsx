"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, LogIn, Search } from "lucide-react";
import { Sparkline } from "@/components/ui/Sparkline";
import { Sheet } from "@/components/ui/Sheet";
import { Logo } from "@/components/ui/Logo";
import { tr } from "@/lib/i18n";

const OBRAS_DEMO = ["Obra Marbella", "Obra Centro", "Obra Norte"];

/**
 * Pantalla pública (sin sesión iniciada) — de momento una maqueta visual,
 * calcada en estructura de la referencia: selector de obra arriba a modo de
 * "buscador", icono de inicio de sesión a la derecha, tarjeta de progreso
 * grande y tarjeta de plan de obra debajo.
 *
 * Ocupa exactamente el alto de la pantalla (100dvh) y NO hace scroll: la
 * tarjeta del plano se encoge o se estira según el móvil, así entra igual en
 * un iPhone SE que en un Pro Max o en un Android.
 */
export function LandingMock() {
  const [obra, setObra] = useState(OBRAS_DEMO[0]);
  const [picking, setPicking] = useState(false);

  return (
    <div className="mx-auto flex h-[100dvh] max-w-md flex-col overflow-hidden px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))]">
      <div className="flex shrink-0 items-center gap-3">
        <Logo size={30} className="shrink-0 text-obra-text" />

        <button
          onClick={() => setPicking(true)}
          className="flex flex-1 items-center gap-2 rounded-full border border-obra-card-border bg-obra-card px-4 py-2.5 text-left shadow-[0_2px_10px_rgba(33,28,21,0.06)]"
        >
          <Search size={15} className="shrink-0 text-obra-text-faint" />
          <span className="flex-1 truncate text-[14px] font-semibold text-obra-text">{obra}</span>
          <ChevronDown size={15} className="shrink-0 text-obra-text-faint" />
        </button>

        <Link
          href="/login"
          aria-label={tr("Iniciar sesión")}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-obra-nav-bg text-white"
        >
          <LogIn size={17} />
        </Link>
      </div>

      <div className="relative mt-4 shrink-0 overflow-hidden rounded-[26px] border border-obra-slate-border bg-obra-slate p-5 shadow-[0_12px_28px_rgba(15,20,16,0.22)]">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(110% 130% at 95% 5%, rgba(212,229,101,0.18) 0%, rgba(52,211,153,0.08) 35%, transparent 65%)",
          }}
        />
        <div className="relative text-xs font-bold uppercase tracking-wider text-[#A3B1A7]">
          {tr("Progreso de la obra")}
        </div>
        <div className="relative mt-1 flex items-end justify-between gap-3">
          <div>
            <div className="font-mono-obra text-5xl font-bold leading-none text-[#F7F9F5]">72%</div>
            <div className="mt-1.5 text-xs text-[#A3B1A7]">
              {tr("Vista previa — inicia sesión para ver el progreso real")}
            </div>
          </div>
          <div className="h-10 w-28 shrink-0">
            <Sparkline values={[3, 5, 4, 7, 6, 8, 9]} className="h-full w-full" />
          </div>
        </div>
      </div>

      {/* Ocupa el espacio que sobre: se encoge en pantallas pequeñas */}
      <div className="mt-3 flex min-h-0 flex-1 flex-col overflow-hidden rounded-[28px] border border-obra-card-border bg-obra-card shadow-[0_10px_30px_rgba(33,28,21,0.08)]">
        <div className="min-h-0 flex-1">
          <BuildingPlanArt />
        </div>
        <div className="shrink-0 p-4">
          <div className="text-[15px] font-bold text-obra-text">{tr("Plan de la obra")}</div>
          <div className="mt-0.5 text-xs text-obra-text-faint">
            {tr("Vista de ejemplo — aquí verás el plano y las fotos de tu obra")}
          </div>
        </div>
      </div>

      <Link
        href="/login"
        className="mt-3 shrink-0 rounded-2xl border border-dashed border-obra-card-border p-3.5 text-center text-[13.5px] font-semibold text-obra-text-dim"
      >
        {tr("Inicia sesión para fichar, apuntar gastos y subir facturas")}
      </Link>

      {picking && (
        <Sheet title={tr("Elegir obra")} onClose={() => setPicking(false)}>
          <div className="flex flex-col gap-2">
            {OBRAS_DEMO.map((o) => (
              <button
                key={o}
                onClick={() => {
                  setObra(o);
                  setPicking(false);
                }}
                className="rounded-xl border border-obra-card-border bg-obra-card p-3 text-left text-[14.5px] font-semibold text-obra-text"
              >
                {o}
              </button>
            ))}
          </div>
        </Sheet>
      )}
    </div>
  );
}

/** Ilustración original (formas geométricas propias, no copiadas de ninguna referencia). */
function BuildingPlanArt() {
  return (
    <svg
      viewBox="0 0 400 200"
      className="block h-full w-full"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id="landing-plan-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2D3830" />
          <stop offset="100%" stopColor="#1C231E" />
        </linearGradient>
      </defs>
      <rect width="400" height="200" fill="url(#landing-plan-bg)" />
      {/* Retícula de plano arquitectónico */}
      <defs>
        <pattern id="grid-cad" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.8" />
        </pattern>
      </defs>
      <rect width="400" height="200" fill="url(#grid-cad)" />
      <g opacity="0.95" stroke="#D4E565" strokeWidth="2" fill="none" strokeLinejoin="round">
        <polygon points="140,150 200,110 260,150 260,190 140,190" fill="rgba(212,229,101,0.08)" />
        <polygon points="140,150 200,110 260,150 200,170" fill="rgba(52,211,153,0.12)" />
        <line x1="200" y1="110" x2="200" y2="170" stroke="#34D399" />
        <rect x="150" y="160" width="18" height="24" fill="rgba(212,229,101,0.2)" stroke="#D4E565" />
        <rect x="232" y="160" width="18" height="24" fill="rgba(212,229,101,0.2)" stroke="#D4E565" />
      </g>
      <g opacity="0.45" stroke="#A3B1A7" strokeWidth="1.2" fill="none">
        <polygon points="60,180 100,158 140,180" />
        <polygon points="260,180 300,150 340,180" />
      </g>
    </svg>
  );
}
