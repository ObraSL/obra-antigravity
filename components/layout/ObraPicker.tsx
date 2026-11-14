"use client";

import { useState } from "react";
import { Check, Plus } from "lucide-react";
import { useObra } from "@/lib/obra-context";
import { useMiembro } from "@/lib/miembro-context";
import { Field, Input } from "@/components/ui/Field";
import { GhostButton, PrimaryButton } from "@/components/ui/Button";
import clsx from "clsx";
import { tr } from "@/lib/i18n";

export function ObraPicker({ onDone }: { onDone: () => void }) {
  const { obras, obraId, setObraId, crearObra } = useObra();
  const { rol } = useMiembro();
  const puedeCrear = rol === "dueno" || rol === "manager";
  const [creando, setCreando] = useState(false);
  const [nombre, setNombre] = useState("");
  const [direccion, setDireccion] = useState("");
  const [guardando, setGuardando] = useState(false);

  // Las obras cerradas no se eligen para trabajar del día a día: se ven y se
  // abren desde Ajustes, para no confundirlas con las que siguen activas.
  const activas = obras.filter((o) => o.activa);

  return (
    <div>
      {activas.map((o) => (
        <button
          key={o.id}
          onClick={() => {
            setObraId(o.id);
            onDone();
          }}
          className={clsx(
            "mb-2 flex w-full items-center justify-between rounded-xl border px-3.5 py-3 text-left",
            o.id === obraId ? "border-obra-yellow-dim bg-obra-card" : "border-obra-line"
          )}
        >
          <div>
            <div className="text-[15px] font-semibold text-obra-text">{o.nombre}</div>
            {o.direccion && <div className="mt-0.5 text-xs text-obra-text-faint">{o.direccion}</div>}
          </div>
          {o.id === obraId && <Check size={18} className="text-obra-yellow" />}
        </button>
      ))}

      {puedeCrear && (!creando ? (
        <GhostButton
          onClick={() => setCreando(true)}
          className="mt-1.5 flex items-center justify-center gap-1.5"
        >
          <Plus size={16} /> {tr("Nueva obra")}
        </GhostButton>
      ) : (
        <div className="mt-2.5 border-t border-obra-line pt-3.5">
          <Field label={tr("Nombre de la obra")}>
            <Input
              autoFocus
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
              const creada = await crearObra(nombre.trim(), direccion.trim());
              setGuardando(false);
              if (creada) onDone();
            }}
          >
            {tr("Crear obra")}
          </PrimaryButton>
        </div>
      ))}
    </div>
  );
}
