"use client";

import { useState } from "react";
import { Building2, Plus } from "lucide-react";
import { useObra } from "@/lib/obra-context";
import { Field, Input } from "@/components/ui/Field";
import { PrimaryButton } from "@/components/ui/Button";
import { tr } from "@/lib/i18n";

export function SinObras() {
  const { crearObra } = useObra();
  const [nombre, setNombre] = useState("");
  const [direccion, setDireccion] = useState("");
  const [guardando, setGuardando] = useState(false);

  return (
    <div className="mx-auto max-w-sm px-5 py-10">
      <div className="mb-6 text-center">
        <Building2 size={32} className="mx-auto mb-2.5 text-obra-text-faint" />
        <div className="font-display text-2xl font-bold uppercase text-obra-text">
          {tr("Crea tu primera obra")}
        </div>
        <div className="mt-1 text-[13.5px] text-obra-text-faint">
          {tr("Fichajes, gastos y facturas se organizan por obra.")}
        </div>
      </div>
      <Field label={tr("Nombre de la obra")}>
        <Input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder={tr("Ej. Demolición C/ Mayor 12")}
        />
      </Field>
      <Field label={tr("Dirección (opcional)")}>
        <Input
          value={direccion}
          onChange={(e) => setDireccion(e.target.value)}
          placeholder={tr("Ej. Calle Mayor 12, Madrid")}
        />
      </Field>
      <PrimaryButton
        disabled={!nombre.trim() || guardando}
        onClick={async () => {
          setGuardando(true);
          await crearObra(nombre.trim(), direccion.trim());
          setGuardando(false);
        }}
      >
        <Plus size={16} /> {tr("Crear obra")}
      </PrimaryButton>
    </div>
  );
}
