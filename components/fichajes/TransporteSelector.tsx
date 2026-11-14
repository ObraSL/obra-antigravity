"use client";

import { useState } from "react";
import { Car, Users } from "lucide-react";
import clsx from "clsx";
import type { Transporte } from "@/lib/types";
import { Field, Input } from "@/components/ui/Field";
import { PrimaryButton } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { tr } from "@/lib/i18n";

/** Texto corto para enseñar cómo llegó alguien a la obra. */
export function textoTransporte(transporte: Transporte | null, traidoPor: string | null) {
  if (transporte === "propio") return tr("Vino en su coche");
  if (transporte === "traido") return traidoPor ? tr("Le trajo {nombre}", { nombre: traidoPor }) : tr("Le trajeron");
  return null;
}

/**
 * Cómo llegó hoy a la obra. Quien le trajo se escribe a mano: así el
 * trabajador no necesita ver la lista del resto de la plantilla.
 */
export function TransporteSelector({
  transporte,
  traidoPor,
  onGuardar,
}: {
  transporte: Transporte | null;
  traidoPor: string | null;
  onGuardar: (transporte: Transporte, traidoPor: string | null) => void;
}) {
  const [quien, setQuien] = useState(traidoPor ?? "");
  const [pidiendoQuien, setPidiendoQuien] = useState(false);

  const opcion = (
    valor: Transporte,
    Icono: typeof Car,
    etiqueta: string,
    onClick: () => void
  ) => (
    <button
      onClick={onClick}
      className={clsx(
        "flex flex-1 flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-[12.5px] font-semibold transition-colors",
        transporte === valor
          ? "border-obra-yellow bg-obra-yellow/10 text-obra-text"
          : "border-obra-card-border bg-obra-card text-obra-text-dim"
      )}
    >
      <Icono size={18} className={transporte === valor ? "text-obra-yellow" : ""} />
      {etiqueta}
    </button>
  );

  return (
    <div>
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-obra-text-dim">
        {tr("¿Cómo has llegado?")}
      </div>
      <div className="flex gap-2">
        {opcion("propio", Car, tr("En mi coche"), () => {
          setPidiendoQuien(false);
          onGuardar("propio", null);
        })}
        {opcion("traido", Users, tr("Me trajeron"), () => setPidiendoQuien(true))}
      </div>

      {transporte === "traido" && (
        <button
          onClick={() => setPidiendoQuien(true)}
          className="mt-2 w-full text-center text-[12.5px] text-obra-text-faint"
        >
          {traidoPor ? tr("Le trajo {nombre} · cambiar", { nombre: traidoPor }) : tr("Decir quién te trajo")}
        </button>
      )}

      {/* Ventana aparte (no un campo pegado abajo): en el móvil, con el
          campo y el botón "Ok" juntos al fondo de la pantalla, el teclado
          tapaba el botón y no se podía confirmar. Así el botón siempre
          queda por encima del teclado, igual que en "Zona / tarea". */}
      {pidiendoQuien && (
        <Sheet title={tr("¿Quién te trajo?")} onClose={() => setPidiendoQuien(false)}>
          <Field label={tr("Nombre")}>
            <Input
              autoFocus
              value={quien}
              onChange={(e) => setQuien(e.target.value)}
              placeholder={tr("Ej. Mi hermano, un compañero…")}
            />
          </Field>
          <PrimaryButton
            onClick={() => {
              onGuardar("traido", quien.trim() || null);
              setPidiendoQuien(false);
            }}
          >
            {tr("Ok")}
          </PrimaryButton>
        </Sheet>
      )}
    </div>
  );
}
