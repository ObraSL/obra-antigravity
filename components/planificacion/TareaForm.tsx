"use client";

import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import type { Tarea } from "@/lib/types";
import { todayStr } from "@/lib/format";
import { duracionDias } from "@/lib/gantt";
import { Field, Input } from "@/components/ui/Field";
import { PrimaryButton } from "@/components/ui/Button";
import { tr, trN } from "@/lib/i18n";

export type DatosTarea = {
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  avance: number;
  presupuesto: number | null;
};

/** Alta y edición de una tarea del plan. Al editar aparece el botón de borrar. */
export function TareaForm({
  tarea,
  onGuardar,
  onBorrar,
}: {
  tarea?: Tarea;
  onGuardar: (datos: DatosTarea) => Promise<void>;
  onBorrar?: () => Promise<void>;
}) {
  const [nombre, setNombre] = useState(tarea?.nombre ?? "");
  const [inicio, setInicio] = useState(tarea?.fecha_inicio ?? todayStr());
  const [fin, setFin] = useState(tarea?.fecha_fin ?? todayStr());
  const [avance, setAvance] = useState(tarea?.avance ?? 0);
  const [presupuesto, setPresupuesto] = useState(
    tarea?.presupuesto != null ? String(tarea.presupuesto) : ""
  );
  const [guardando, setGuardando] = useState(false);
  const [confirmandoBorrar, setConfirmandoBorrar] = useState(false);

  const fechasAlReves = fin < inicio;
  const valido = nombre.trim().length > 0 && !fechasAlReves;

  const guardar = async () => {
    setGuardando(true);
    await onGuardar({
      nombre: nombre.trim(),
      fecha_inicio: inicio,
      fecha_fin: fin,
      avance,
      presupuesto: presupuesto.trim() === "" ? null : Number(presupuesto),
    });
    setGuardando(false);
  };

  return (
    <div>
      <Field label={tr("Tarea")}>
        <Input
          autoFocus={!tarea}
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder={tr("Ej. Cimentación, Estructura, Tabiquería…")}
        />
      </Field>

      <div className="flex gap-3">
        <div className="flex-1">
          <Field label={tr("Empieza")}>
            <Input type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} />
          </Field>
        </div>
        <div className="flex-1">
          <Field label={tr("Termina")}>
            <Input type="date" value={fin} onChange={(e) => setFin(e.target.value)} />
          </Field>
        </div>
      </div>

      {fechasAlReves ? (
        <div className="mb-3.5 text-xs text-obra-red-text">
          {tr("La fecha de fin no puede ser anterior a la de inicio.")}
        </div>
      ) : (
        <div className="mb-3.5 text-xs text-obra-text-faint">
          {trN(duracionDias({ fecha_inicio: inicio, fecha_fin: fin }), "Dura {n} día.", "Dura {n} días.")}
        </div>
      )}

      <Field label={tr("Avance — {pct}%", { pct: avance })}>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={avance}
          onChange={(e) => setAvance(Number(e.target.value))}
          className="h-9 w-full accent-obra-yellow"
        />
        <div className="mt-1 flex gap-1.5">
          {[0, 25, 50, 75, 100].map((v) => (
            <button
              key={v}
              onClick={() => setAvance(v)}
              className={`flex-1 rounded-lg border py-1.5 text-[11.5px] font-bold transition-colors ${
                avance === v
                  ? "border-obra-yellow bg-obra-yellow/10 text-obra-text"
                  : "border-obra-card-border bg-obra-card text-obra-text-dim"
              }`}
            >
              {v}%
            </button>
          ))}
        </div>
      </Field>

      <Field label={tr("Presupuesto (€, opcional)")}>
        <Input
          type="number"
          inputMode="decimal"
          min={0}
          step="0.01"
          value={presupuesto}
          onChange={(e) => setPresupuesto(e.target.value)}
          placeholder={tr("Lo que hay previsto para esta parte")}
        />
      </Field>

      <PrimaryButton disabled={!valido || guardando} onClick={guardar}>
        {guardando && <Loader2 size={16} className="animate-spin" />}
        {tarea ? tr("Guardar cambios") : tr("Añadir tarea")}
      </PrimaryButton>

      {onBorrar &&
        (!confirmandoBorrar ? (
          <button
            onClick={() => setConfirmandoBorrar(true)}
            className="mt-3 flex w-full items-center justify-center gap-1.5 py-2 text-[13px] font-semibold text-obra-text-faint"
          >
            <Trash2 size={14} /> {tr("Borrar tarea")}
          </button>
        ) : (
          <button
            onClick={onBorrar}
            className="mt-3 w-full py-2 text-[13px] font-bold text-obra-red"
          >
            {tr("Tocar otra vez para borrarla de verdad")}
          </button>
        ))}
    </div>
  );
}
