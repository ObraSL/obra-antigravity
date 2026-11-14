"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, Calendar, ChevronDown } from "lucide-react";
import { useObra } from "@/lib/obra-context";
import { useMiembro } from "@/lib/miembro-context";
import { Sheet } from "@/components/ui/Sheet";
import { ObraPicker } from "./ObraPicker";
import { tr } from "@/lib/i18n";

export function TopBar() {
  const { obraActual, obras } = useObra();
  const { miembro, gestiona } = useMiembro();
  const [picking, setPicking] = useState(false);

  if (obras.length === 0) return null;

  const nombreSaludo = miembro?.nombre?.trim() || "Alex";

  return (
    <>
      {/* Cabecera estilo Dribbble: avatar táctico a la izquierda, saludo + selector
          de obra en el centro y botón cuadrado de cristal esmerilado a la derecha. */}
      <div className="sticky top-0 z-10 bg-obra-bg/90 px-4 pb-2.5 pt-[calc(0.75rem+env(safe-area-inset-top))] backdrop-blur-md md:px-6">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Link
              href="/"
              aria-label={tr("Ir a inicio")}
              className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-[14px] border border-white/18 bg-[#141915] shadow-[0_4px_12px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.18)]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/avatar-alex.png"
                alt={nombreSaludo}
                className="h-full w-full object-cover"
              />
            </Link>

            <button
              onClick={() => setPicking(true)}
              className="group flex min-w-0 flex-1 flex-col items-start text-left"
            >
              <span className="truncate text-[16px] font-semibold leading-tight tracking-tight text-white">
                Morning {nombreSaludo}
              </span>
              <span className="mt-0.5 flex max-w-full items-center gap-1 text-[12.5px] font-normal text-white/75 group-hover:text-white">
                <span className="truncate">
                  {obraActual ? obraActual.nombre : tr("Elegir obra")}
                </span>
                <ChevronDown size={13} className="shrink-0 opacity-80" />
              </span>
            </button>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {gestiona && (
              <Link
                href="/resumen"
                aria-label={tr("Resumen mensual")}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] border border-white/14 bg-[#141915]/90 text-white backdrop-blur-md transition-colors hover:bg-[#1c221e] shadow-[0_4px_12px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.15)]"
              >
                <Calendar size={17} />
              </Link>
            )}
            <Link
              href="/notas"
              aria-label={tr("Notas")}
              className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] border border-white/14 bg-[#141915]/90 text-white backdrop-blur-md transition-colors hover:bg-[#1c221e] shadow-[0_4px_12px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.15)]"
            >
              <Bell size={17} />
              <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-[#e0826d]" />
            </Link>
          </div>
        </div>
      </div>

      {picking && (
        <Sheet title={tr("Elegir obra")} onClose={() => setPicking(false)}>
          <ObraPicker onDone={() => setPicking(false)} />
        </Sheet>
      )}
    </>
  );
}
