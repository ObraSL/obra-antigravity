"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, ShieldAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { SoporteAcceso as SoporteAccesoFila } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Field";
import { GhostButton, PrimaryButton } from "@/components/ui/Button";
import { localeActual, tr } from "@/lib/i18n";

/**
 * Punto 17: acceso de soporte para el desarrollador. Da acceso de nivel
 * dueño a una cuenta YA REGISTRADA, por un número de horas, y queda todo
 * apuntado aquí: quién lo dio, cuándo caduca, y quién lo quitó si se quitó
 * antes de tiempo. Pasadas las horas, se apaga solo (no hace falta volver
 * aquí a quitarlo).
 */
export function SoporteAcceso() {
  const supabase = useMemo(() => createClient(), []);
  const [accesos, setAccesos] = useState<SoporteAccesoFila[]>([]);
  const [cargando, setCargando] = useState(true);
  const [email, setEmail] = useState("");
  const [horas, setHoras] = useState("24");
  const [dando, setDando] = useState(false);
  const [error, setError] = useState("");
  const [ahora, setAhora] = useState(() => Date.now());

  const cargar = useCallback(async () => {
    setAhora(Date.now());
    const { data } = await supabase
      .from("soporte_accesos")
      .select("*")
      .order("otorgado_en", { ascending: false });
    setAccesos((data as SoporteAccesoFila[]) ?? []);
    setCargando(false);
  }, [supabase]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const darAcceso = async () => {
    setError("");
    setDando(true);
    const { error: err } = await supabase.rpc("dar_acceso_soporte", {
      email_soporte: email.trim(),
      horas: Number(horas),
    });
    setDando(false);
    if (err) {
      setError(err.message);
      return;
    }
    setEmail("");
    await cargar();
  };

  const revocar = async (id: string) => {
    await supabase.rpc("revocar_acceso_soporte", { acceso_id: id });
    await cargar();
  };

  const estado = (a: SoporteAccesoFila): "activo" | "caducado" | "revocado" => {
    if (a.revocado_en) return "revocado";
    if (new Date(a.expira_en).getTime() < ahora) return "caducado";
    return "activo";
  };

  if (cargando) {
    return (
      <div className="mb-7 flex justify-center py-4">
        <Loader2 className="animate-spin text-obra-yellow" size={20} />
      </div>
    );
  }

  return (
    <div className="mb-7">
      <Card className="p-3">
        <div className="mb-2.5 text-[13px] text-obra-text-dim">
          {tr("Dale acceso temporal al desarrollador para que pueda ayudarte. Tiene que haberse registrado antes con ese correo. Pasadas las horas, se le quita solo.")}
        </div>
        <Field label={tr("Correo de la cuenta de soporte")}>
          <Input
            type="email"
            placeholder={tr("soporte@ejemplo.com")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field label={tr("Horas de acceso")}>
          <Input
            type="number"
            inputMode="numeric"
            min={1}
            max={720}
            value={horas}
            onChange={(e) => setHoras(e.target.value)}
          />
        </Field>
        {error && <div className="mb-2.5 text-[13px] text-obra-red-text">{error}</div>}
        <PrimaryButton disabled={!email.trim() || !horas || dando} onClick={darAcceso}>
          {dando && <Loader2 size={16} className="animate-spin" />} {tr("Dar acceso")}
        </PrimaryButton>
      </Card>

      {accesos.length > 0 && (
        <div className="mt-2.5 flex flex-col gap-2">
          {accesos.map((a) => {
            const e = estado(a);
            return (
              <Card key={a.id} className="flex items-center justify-between gap-2 p-3">
                <div className="min-w-0">
                  <div className="truncate text-[13.5px] font-semibold text-obra-text">{a.email}</div>
                  <div className="mt-0.5 text-[11.5px] text-obra-text-faint">
                    {e === "activo" && `${tr("Hasta ")}${new Date(a.expira_en).toLocaleString(localeActual())}`}
                    {e === "caducado" && tr("Caducado")}
                    {e === "revocado" && tr("Revocado")}
                  </div>
                </div>
                {e === "activo" ? (
                  <GhostButton
                    className="flex w-auto shrink-0 items-center gap-1.5 px-3 py-2 text-[12px]"
                    onClick={() => revocar(a.id)}
                  >
                    <ShieldAlert size={14} /> {tr("Quitar ya")}
                  </GhostButton>
                ) : (
                  <div className="shrink-0 rounded-full border border-obra-line px-2.5 py-1 text-[11px] font-bold uppercase text-obra-text-faint">
                    {e === "caducado" ? tr("Caducado") : tr("Revocado")}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
