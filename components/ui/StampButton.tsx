"use client";

import type { LucideIcon } from "lucide-react";
import clsx from "clsx";
import { tr } from "@/lib/i18n";

/**
 * Momento Firma #1: Sello Táctico de Fichaje en 2 Segundos.
 * Diseñado con altura mínima táctil >= 60px, contraste solar AAA y respuesta física.
 */
export function StampButton({
  label,
  hora,
  color,
  icon: Icon,
  onClick,
  disabled,
  pendiente,
}: {
  label: string;
  hora: string | null | undefined;
  color: "green" | "orange";
  icon: LucideIcon;
  onClick: () => void;
  disabled?: boolean;
  /** Se intentó fichar pero no había red: está en cola, se enviará solo. */
  pendiente?: boolean;
}) {
  const marcado = !!hora;
  const esEntrada = color === "green";
  const activoParaFichar = !disabled && !marcado && !pendiente;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || marcado || pendiente}
      className={clsx(
        "relative flex min-h-[62px] flex-1 flex-col items-center justify-center gap-1 rounded-xl px-2 py-2.5 transition-all",
        // Estado 1: Ya marcado (sello certificado en verde esmeralda o naranja terracota)
        marcado &&
          (esEntrada
            ? "border-2 border-obra-green bg-obra-green/10 text-obra-green shadow-xs -rotate-0.5"
            : "border-2 border-obra-orange bg-obra-orange/10 text-obra-orange shadow-xs rotate-0.5"),
        // Estado 2: Pendiente en cola sin cobertura (offline pulse)
        pendiente && "animate-pulse border-2 border-dashed border-amber-500 bg-amber-500/15 text-amber-800",
        // Estado 3: Activo listo para pulsar (Entrada en Signal Lime de alta visibilidad, Salida en Terracota)
        activoParaFichar &&
          (esEntrada
            ? "border-2 border-obra-text bg-obra-yellow text-obra-yellow-ink shadow-[0_2px_10px_rgba(212,229,101,0.35)] hover:brightness-95 active:scale-[0.98]"
            : "border-2 border-obra-orange bg-obra-orange/15 text-obra-orange hover:bg-obra-orange/20 active:scale-[0.98]"),
        // Estado 4: Deshabilitado (p. ej. salida antes de fichar la entrada)
        disabled && !marcado && !pendiente && "cursor-not-allowed border border-dashed border-obra-line bg-obra-bg/50 opacity-45"
      )}
    >
      <div className="flex items-center gap-1.5">
        <Icon
          size={16}
          strokeWidth={marcado ? 2.5 : 2.2}
          className={clsx(
            marcado
              ? esEntrada
                ? "text-obra-green"
                : "text-obra-orange"
              : pendiente
                ? "text-amber-700"
                : activoParaFichar
                  ? esEntrada
                    ? "text-obra-yellow-ink"
                    : "text-obra-orange"
                  : "text-obra-text-faint"
          )}
        />
        <span
          className={clsx(
            "text-[11px] font-extrabold uppercase tracking-wider",
            marcado
              ? esEntrada
                ? "text-obra-green"
                : "text-obra-orange"
              : pendiente
                ? "text-amber-800"
                : activoParaFichar
                  ? esEntrada
                    ? "text-obra-yellow-ink"
                    : "text-obra-orange"
                  : "text-obra-text-faint"
          )}
        >
          {label}
        </span>
      </div>

      <span
        className={clsx(
          "font-mono-obra text-[15px] font-bold tracking-tight",
          marcado ? "text-obra-text" : pendiente ? "text-amber-800" : activoParaFichar && esEntrada ? "text-obra-yellow-ink" : "text-obra-text-faint"
        )}
      >
        {pendiente ? tr("Enviando…") : hora || "—:—"}
      </span>
    </button>
  );
}
