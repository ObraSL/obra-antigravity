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
    <div className="relative h-[100dvh] w-full overflow-hidden bg-[#141916]">
      {/* Fondo arquitectónico a pantalla completa con viñeta y desenfoque suave */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/bg-obra.jpg"
          alt="Edificio en Construcción"
          className="h-full w-full object-cover object-center scale-[1.02] opacity-90 transition-transform duration-1000 ease-out"
        />
        {/* Viñeta atmosférica cinematográfica: oscura en los bordes y suave hacia el centro */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 50% 35%, rgba(20,26,22,0.35) 0%, rgba(16,21,18,0.72) 58%, rgba(10,13,11,0.94) 100%)",
          }}
        />
        {/* Suave velo con desenfoque para dar aspecto clásico e integrar la arquitectura sin distracciones */}
        <div className="absolute inset-0 bg-[#141916]/25 backdrop-blur-[1.5px]" />
      </div>

      <div className="relative z-10 mx-auto flex h-[100dvh] max-w-md flex-col justify-between px-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-[calc(0.75rem+env(safe-area-inset-top))]">
        {/* Barra superior compacta con selector de obra de ejemplo e idioma */}
        <div className="flex shrink-0 items-center justify-between gap-2">
          <button
            onClick={() => setPicking(true)}
            className="flex items-center gap-2 rounded-full border border-white/18 bg-[#1e2520]/80 px-3.5 py-1.5 text-left shadow-lg backdrop-blur-md transition hover:bg-[#1e2520]"
          >
            <span className="h-2 w-2 rounded-full bg-[#d7dc9a]" />
            <span className="max-w-[180px] truncate text-[12.5px] font-semibold text-white">
              {obra}
            </span>
            <ChevronDown size={14} className="shrink-0 text-white/75" />
          </button>

          <SelectorIdioma />
        </div>

        {/* Tarjeta inferior de vidrio esmerilado oliva con resplandor cálido superior (la "ramka") */}
        <div className="my-auto overflow-hidden rounded-[36px] border border-white/20 bg-[#252f28]/85 p-6 text-center backdrop-blur-2xl shadow-[0_24px_60px_rgba(0,0,0,0.55)]">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(85% 55% at 50% 0%, rgba(238,195,142,0.22) 0%, rgba(215,220,154,0.06) 45%, transparent 72%)",
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
                className="mt-1 flex min-h-[42px] w-full items-center justify-center gap-2 rounded-[14px] border border-[#d7dc9a]/40 bg-[#1c231e]/85 px-3 py-2 text-[13px] font-semibold text-[#d7dc9a] transition hover:bg-[#1c231e] active:scale-[0.99]"
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
    </div>
  );
}
