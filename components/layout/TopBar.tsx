"use client";

import { useState } from "react";
import Link from "next/link";
import { Calendar, ChevronDown, CircleDot } from "lucide-react";
import { useObra } from "@/lib/obra-context";
import { useMiembro } from "@/lib/miembro-context";
import { Sheet } from "@/components/ui/Sheet";
import { Logo } from "@/components/ui/Logo";
import { ObraPicker } from "./ObraPicker";
import { tr } from "@/lib/i18n";

export function TopBar() {
  const { obraActual, obras } = useObra();
  const { gestiona } = useMiembro();
  const [picking, setPicking] = useState(false);

  if (obras.length === 0) return null;

  return (
    <>
      {/* El relleno de arriba deja sitio a la barra de estado del iPhone:
          sin él, el nombre de la obra quedaba tapado con la app instalada. */}
      <div className="sticky top-0 z-10 border-b border-obra-line bg-obra-bg px-4 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top))] md:px-6">
        <div className="mx-auto flex max-w-3xl items-center gap-2.5">
          {/* El emblema lleva siempre a Inicio, desde cualquier pantalla. */}
          <Link
            href="/"
            aria-label={tr("Ir a inicio")}
            className="flex h-10 w-10 shrink-0 items-center justify-center text-obra-text md:hidden"
          >
            <Logo size={26} />
          </Link>
          <button
            onClick={() => setPicking(true)}
            className="flex flex-1 items-center justify-between gap-2 rounded-[10px] border border-obra-card-border bg-obra-card px-3 py-2.5"
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <CircleDot
                size={14}
                className={obraActual?.activa === false ? "text-obra-text-faint" : "text-obra-green"}
              />
              <span className="truncate text-[14.5px] font-semibold text-obra-text">
                {obraActual ? obraActual.nombre : tr("Elegir obra")}
              </span>
            </div>
            <ChevronDown size={16} className="text-obra-text-dim" />
          </button>
          {gestiona && (
            <Link
              href="/resumen"
              aria-label={tr("Resumen mensual")}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border border-obra-card-border bg-obra-card text-obra-text transition-colors hover:border-obra-text-faint"
            >
              <Calendar size={17} />
            </Link>
          )}
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
