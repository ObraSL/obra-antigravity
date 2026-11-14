"use client";

import clsx from "clsx";
import { Building2, Wallet } from "lucide-react";
import type { PagadoPor } from "@/lib/types";
import { tr } from "@/lib/i18n";

/**
 * Selector de quién puso el dinero. Por defecto la empresa: así, si no se
 * toca nada, el gasto queda como pago de la empresa (que es lo normal) y
 * solo hay que marcar lo que pagó el dueño de su mano.
 *
 * Se dice "lo pagué yo" y no "mi dinero" a propósito: puede ser dinero que
 * le dio el jefe para gastos. Por eso cuenta en "mi caja".
 */
export function PagadoPorSelector({
  valor,
  onChange,
}: {
  valor: PagadoPor;
  onChange: (v: PagadoPor) => void;
}) {
  const opciones: { id: PagadoPor; label: string; icon: typeof Wallet }[] = [
    { id: "empresa", label: "La empresa", icon: Building2 },
    { id: "personal", label: "Lo pagué yo", icon: Wallet },
  ];

  return (
    <div className="flex gap-2">
      {opciones.map((o) => {
        const activo = valor === o.id;
        const Icon = o.icon;
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            className={clsx(
              "flex flex-1 items-center justify-center gap-2 rounded-xl border py-3 text-[13.5px] font-semibold transition-colors",
              activo
                ? "border-obra-yellow bg-obra-yellow/10 text-obra-yellow"
                : "border-obra-card-border bg-obra-card text-obra-text-dim"
            )}
          >
            <Icon size={15} />
            {tr(o.label)}
          </button>
        );
      })}
    </div>
  );
}

/** Etiqueta para las listas. Solo se muestra en lo que pagó el dueño. */
export function PagadoPorBadge({ pagadoPor }: { pagadoPor: PagadoPor }) {
  if (pagadoPor !== "personal") return null;
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-obra-yellow/12 px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide text-obra-yellow">
      <Wallet size={11} />
      {tr("Pagué yo")}
    </span>
  );
}

/** Suma de importes pagados del bolsillo propio. */
export function totalPersonal(items: { importe: number; pagado_por: PagadoPor }[]) {
  return items
    .filter((i) => i.pagado_por === "personal")
    .reduce((s, i) => s + Number(i.importe || 0), 0);
}
