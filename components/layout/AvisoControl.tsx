"use client";

import { useState } from "react";
import { LogOut, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMiembro } from "@/lib/miembro-context";
import { createClient } from "@/lib/supabase/client";
import { obtenerPosicion } from "@/lib/geo";
import { AVISO_CONTROL_VERSION } from "@/lib/types";
import { Logo } from "@/components/ui/Logo";
import { PrimaryButton, GhostButton } from "@/components/ui/Button";
import { tr, trJsx } from "@/lib/i18n";

/**
 * Antes de poder fichar por primera vez (o cuando cambie el texto de
 * verdad), el trabajador ve esto y toca "Lo he leído". Es un aviso
 * informativo, no una "firma" de un contrato — en una relación laboral el
 * consentimiento pesa poco por la desigualdad entre las partes; lo que
 * cuenta es que quede constancia de que se le avisó, cuándo y de qué
 * versión del texto.
 */
export function AvisoControl() {
  const router = useRouter();
  const { refrescar, modulos } = useMiembro();
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const confirmar = async () => {
    setGuardando(true);
    setError("");
    // Se pide el permiso de ubicación aquí, una sola vez: el navegador
    // pregunta ahora mismo (con la app ya explicando para qué es), no cada
    // vez que se ficha. Si dice que no, se ficha igual — no bloquea.
    if (modulos.geolocalizacion) await obtenerPosicion();
    const { error: err } = await createClient().rpc("confirmar_aviso_control", {
      version: AVISO_CONTROL_VERSION,
    });
    setGuardando(false);
    if (err) {
      setError(tr("No se pudo guardar. Inténtalo otra vez."));
      return;
    }
    await refrescar();
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
          <ShieldCheck size={18} className="text-obra-yellow" />
          <h1 className="font-display text-2xl font-bold uppercase text-obra-text">
            {tr("Antes de fichar")}
          </h1>
        </div>

        <div className="rounded-2xl border border-obra-card-border bg-obra-card p-4 text-[13.5px] leading-relaxed text-obra-text-dim">
          <p className="mb-3">
            {tr("Esta app registra tu")} <span className="font-semibold text-obra-text">{tr("hora de entrada y salida")}</span> {tr("con el reloj del servidor, no con el del móvil.")}
          </p>
          <p className="mb-3">
            {trJsx("Cuando fichas, la app también comprueba si tu móvil está {dentro}. No guarda tu ubicación exacta ni te sigue en ningún otro momento — solo ese resultado (dentro/fuera) en el instante de fichar.", {
              dentro: <span className="font-semibold text-obra-text">{tr("dentro o fuera de la obra")}</span>,
            })}
          </p>
          <p>
            {tr("Algunas obras tienen una")}{" "}
            <span className="font-semibold text-obra-text">{tr("hora mínima para fichar la entrada")}</span>{tr(", para que no se pueda marcar la llegada antes de que empiece el turno.")}
          </p>
        </div>

        {error && <div className="mt-3 text-[13px] text-obra-red-text">{error}</div>}

        <p className="mt-4 text-[12px] leading-relaxed text-obra-text-faint">
          {tr("Al tocar «Lo he leído», el móvil te va a pedir permiso de ubicación. Acéptalo — así, cada vez que fiches, no hace falta pedirlo otra vez.")}
        </p>

        <div className="mt-3">
          <PrimaryButton disabled={guardando} onClick={confirmar}>
            {guardando ? tr("Guardando…") : tr("Lo he leído")}
          </PrimaryButton>
        </div>

        <div className="mt-auto pt-8">
          <GhostButton onClick={salir} className="flex items-center justify-center gap-2">
            <LogOut size={15} /> {tr("Cerrar sesión")}
          </GhostButton>
        </div>
      </div>
    </div>
  );
}
