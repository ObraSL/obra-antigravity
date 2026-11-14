"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Sparkles } from "lucide-react";
import { Sheet } from "@/components/ui/Sheet";
import { SelectorIdioma } from "@/components/ui/SelectorIdioma";
import { tr } from "@/lib/i18n";

const OBRAS_DEMO = ["Skyline Heights Phase", "Obra Marbella", "Obra Centro"];

/**
 * Pantalla pública (Screen 1 de la referencia Dribbble):
 * Lienzo Pistachio-Sage (#737F73), render arquitectónico 3D de la villa
 * iluminada en la mitad superior y tarjeta arqueada de vidrio esmerilado
 * oliva (#60675D) en la mitad inferior con botones Login (#D7DC9A) y
 * Sign up (#0E0C0D), más acceso directo Demo en 1 clic.
 *
 * Ocupa exactamente 100dvh sin scroll vertical ni horizontal.
 */
export function LandingMock() {
  const [obra, setObra] = useState(OBRAS_DEMO[0]);
  const [picking, setPicking] = useState(false);

  return (
    <div className="mx-auto flex h-[100dvh] max-w-md flex-col justify-between overflow-hidden px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-[calc(0.75rem+env(safe-area-inset-top))]">
      {/* Barra superior compacta con selector de obra de ejemplo e idioma */}
      <div className="relative z-10 flex shrink-0 items-center justify-between gap-2">
        <button
          onClick={() => setPicking(true)}
          className="flex items-center gap-2 rounded-full border border-white/18 bg-[#5a655d]/80 px-3.5 py-1.5 text-left backdrop-blur-md transition hover:bg-[#5a655d]"
        >
          <span className="h-2 w-2 rounded-full bg-[#d7dc9a]" />
          <span className="max-w-[180px] truncate text-[12.5px] font-semibold text-white">
            {obra}
          </span>
          <ChevronDown size={14} className="shrink-0 text-white/75" />
        </button>

        <SelectorIdioma />
      </div>

      {/* Render 3D de la villa moderna con iluminación cálida (Screen 1 Dribbble) */}
      <div className="relative -mx-4 my-auto flex min-h-0 flex-1 items-center justify-center overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/hero-villa.png"
          alt="Architectural Villa Render"
          className="max-h-full w-full object-contain object-bottom select-none"
        />
      </div>

      {/* Tarjeta inferior de vidrio esmerilado oliva con resplandor cálido superior */}
      <div className="relative shrink-0 overflow-hidden rounded-[36px] border border-white/18 bg-[#60675d]/92 p-6 text-center backdrop-blur-xl shadow-[0_20px_50px_rgba(12,16,13,0.38)]">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(85% 55% at 50% 0%, rgba(238,195,142,0.28) 0%, rgba(215,220,154,0.08) 45%, transparent 72%)",
          }}
        />

        <div className="relative">
          <h1 className="text-[32px] font-bold leading-tight tracking-tight text-white">
            Welcome
          </h1>
          <p className="mx-auto mt-2 max-w-[270px] text-[13px] leading-relaxed text-white/80">
            {tr("Inicia sesión para fichar, apuntar gastos y subir facturas")}
          </p>

          <div className="mt-5 flex flex-col gap-2.5">
            <Link
              href="/login"
              className="flex min-h-[50px] w-full items-center justify-center rounded-[18px] bg-[#d7dc9a] px-4 py-3 text-[15.5px] font-bold text-[#141814] shadow-[0_8px_20px_rgba(20,24,20,0.22)] transition hover:brightness-105 active:scale-[0.99]"
            >
              {tr("Iniciar sesión")}
            </Link>

            <Link
              href="/login?alta=OBRA2026"
              className="flex min-h-[50px] w-full items-center justify-center rounded-[18px] bg-[#0e0c0d] px-4 py-3 text-[15.5px] font-bold text-white shadow-[0_8px_20px_rgba(0,0,0,0.3)] transition hover:bg-black/85 active:scale-[0.99]"
            >
              {tr("Crear cuenta")}
            </Link>

            <Link
              href="/login?demo=1"
              className="mt-1 flex min-h-[42px] w-full items-center justify-center gap-2 rounded-[14px] border border-[#d7dc9a]/40 bg-white/10 px-3 py-2 text-[13px] font-semibold text-[#d7dc9a] transition hover:bg-white/15 active:scale-[0.99]"
            >
              <Sparkles size={14} />
              <span>{tr("Entrar a la app (Demo en 1 Clic)")}</span>
            </Link>
          </div>
        </div>
      </div>

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
