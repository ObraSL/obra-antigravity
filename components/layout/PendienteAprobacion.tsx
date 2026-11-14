"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Hourglass, Loader2, LogOut, RefreshCw } from "lucide-react";
import { useMiembro } from "@/lib/miembro-context";
import { useSession } from "@/lib/use-session";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/ui/Logo";
import { Field, Input } from "@/components/ui/Field";
import { GhostButton, PrimaryButton } from "@/components/ui/Button";
import { tr } from "@/lib/i18n";

/**
 * Pantalla de quien acaba de registrarse y todavía no tiene acceso.
 * Escribe su nombre para que el dueño sepa a quién está aprobando; hasta
 * que el dueño no le dé acceso, no ve absolutamente nada de las obras.
 */
export function PendienteAprobacion() {
  const router = useRouter();
  const { miembro, guardarNombre, refrescar } = useMiembro();
  const { session } = useSession();

  const [nombre, setNombre] = useState(miembro?.nombre ?? "");
  const [guardando, setGuardando] = useState(false);
  const [comprobando, setComprobando] = useState(false);
  const [error, setError] = useState("");

  const email = miembro?.email ?? session?.user.email ?? "";
  const yaTieneNombre = Boolean(miembro?.nombre);

  const guardar = async () => {
    if (!nombre.trim()) return;
    setGuardando(true);
    setError("");
    const fallo = await guardarNombre(nombre.trim());
    if (fallo) setError(fallo);
    setGuardando(false);
  };

  const comprobar = async () => {
    setComprobando(true);
    await refrescar();
    setComprobando(false);
  };

  const salir = async () => {
    await createClient().auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <div className="flex min-h-[100dvh] flex-col bg-obra-bg px-5 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-[calc(2rem+env(safe-area-inset-top))]">
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col">
        <Logo size={34} className="mb-7 text-obra-text" />

        <div className="mb-1 flex items-center gap-2">
          <Hourglass size={18} className="text-obra-yellow" />
          <h1 className="font-display text-2xl font-bold uppercase text-obra-text">
            {tr("Cuenta creada")}
          </h1>
        </div>
        <p className="mb-6 text-[13.5px] leading-relaxed text-obra-text-dim">
          {tr("Tu cuenta")} <span className="font-semibold text-obra-text">{email}</span> {tr("ya existe, pero todavía no tiene acceso a las obras. El dueño tiene que aprobarla.")}
        </p>

        <div className="rounded-2xl border border-obra-card-border bg-obra-card p-4">
          <Field label={tr("Tu nombre y apellido")}>
            <Input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder={tr("Ej. Andrés Gómez")}
              autoComplete="name"
            />
          </Field>
          <div className="mb-3 text-[12.5px] leading-relaxed text-obra-text-faint">
            {tr("Escríbelo como te conocen en la obra: es lo que verá el dueño para saber que eres tú.")}
          </div>
          <PrimaryButton disabled={!nombre.trim() || guardando} onClick={guardar}>
            {guardando ? (
              <Loader2 size={16} className="animate-spin" />
            ) : yaTieneNombre ? (
              <>
                <Check size={16} /> {tr("Nombre guardado")}
              </>
            ) : (
              tr("Enviar mi nombre")
            )}
          </PrimaryButton>
          {error && <div className="mt-2 text-xs text-obra-red-text">{error}</div>}
        </div>

        {yaTieneNombre && (
          <div className="mt-4 rounded-2xl border border-obra-line bg-obra-bg-elevated p-4 text-center">
            <div className="text-[13.5px] font-semibold text-obra-text">
              {tr("Esperando a que te den acceso")}
            </div>
            <div className="mt-1 text-[12.5px] text-obra-text-faint">
              {tr("Avisa al dueño. En cuanto te apruebe, entra desde aquí.")}
            </div>
            <button
              onClick={comprobar}
              disabled={comprobando}
              className="mx-auto mt-3 flex items-center gap-1.5 text-[13px] font-semibold text-obra-yellow"
            >
              <RefreshCw size={14} className={comprobando ? "animate-spin" : ""} /> {tr("Comprobar de nuevo")}
            </button>
          </div>
        )}

        <div className="mt-auto pt-8">
          <GhostButton onClick={salir} className="flex items-center justify-center gap-2">
            <LogOut size={15} /> {tr("Cerrar sesión")}
          </GhostButton>
        </div>
      </div>
    </div>
  );
}
