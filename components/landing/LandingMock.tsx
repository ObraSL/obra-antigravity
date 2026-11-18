"use client";

import Link from "next/link";
import { HardHat, ShieldCheck } from "lucide-react";
import { SelectorIdioma } from "@/components/ui/SelectorIdioma";
import { Logo } from "@/components/ui/Logo";
import { tr } from "@/lib/i18n";

/**
 * Pantalla pública (Landing v2):
 * Fondo cinematográfico de construcción arquitectónica a pantalla completa,
 * barra superior con identidad de marca oficial e idioma, y tarjeta de cristal
 * esmerilado puro (Obsidian Glass) con 2 accesos demo en 1 clic (Dueño vs Trabajador).
 */
export function LandingMock() {
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
        {/* Barra superior con identidad de marca (logo + nombre de la app) e idioma */}
        <div className="flex shrink-0 items-center justify-between gap-2">
          <div className="flex items-center gap-2 rounded-full border border-white/28 bg-[#141a16]/75 px-3.5 py-1.5 backdrop-blur-xl shadow-lg">
            <Logo size={18} className="text-[#d7dc9a]" />
            <span className="text-[13px] font-bold tracking-tight text-white">
              Control de Obra
            </span>
          </div>

          <SelectorIdioma />
        </div>

        {/* Tarjeta de cristal arquitectónico puro (marco táctico Obsidian Glass de alta refracción) */}
        <div className="my-auto overflow-hidden rounded-[36px] border border-white/28 bg-[#1c241e]/72 p-6 text-center backdrop-blur-3xl shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.32),0_24px_65px_rgba(0,0,0,0.62)]">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(85% 50% at 50% 0%, rgba(238,195,142,0.24) 0%, rgba(215,220,154,0.06) 45%, transparent 72%)",
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

              {/* 2 Acciones de demostración en 1 clic: Dueño vs Trabajador */}
              <div className="mt-2 pt-3 border-t border-white/12">
                <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[#d7dc9a]">
                  {tr("Acceso de prueba")}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/login?demo=dueno"
                    className="flex min-h-[46px] flex-col items-center justify-center rounded-[14px] border border-[#d7dc9a]/40 bg-[#d7dc9a]/16 px-2.5 py-1.5 text-center transition hover:bg-[#d7dc9a]/25 active:scale-[0.98]"
                  >
                    <span className="text-[12px] font-bold text-[#d7dc9a] flex items-center gap-1">
                      <ShieldCheck size={13} />
                      {tr("Demo Dueño")}
                    </span>
                    <span className="text-[10px] text-white/65">{tr("Control total")}</span>
                  </Link>

                  <Link
                    href="/login?demo=trabajador"
                    className="flex min-h-[46px] flex-col items-center justify-center rounded-[14px] border border-white/20 bg-white/10 px-2.5 py-1.5 text-center transition hover:bg-white/16 active:scale-[0.98]"
                  >
                    <span className="text-[12px] font-bold text-white flex items-center gap-1">
                      <HardHat size={13} />
                      {tr("Demo Trabajador")}
                    </span>
                    <span className="text-[10px] text-white/65">{tr("Fichaje y horas")}</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
