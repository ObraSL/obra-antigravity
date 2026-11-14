"use client";

import { useRouter } from "next/navigation";
import { LockKeyhole } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/ui/Logo";
import { GhostButton } from "@/components/ui/Button";
import { tr } from "@/lib/i18n";

/**
 * La empresa tiene la prueba gratuita terminada o el admin de la plataforma
 * la ha bloqueado. No se borra nada: en cuanto se renueve, todo vuelve.
 */
export function SuscripcionInactiva() {
  const router = useRouter();

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
          <LockKeyhole size={18} className="text-obra-yellow" />
          <h1 className="font-display text-2xl font-bold uppercase text-obra-text">
            {tr("Suscripción inactiva")}
          </h1>
        </div>
        <p className="mb-6 text-[14px] leading-relaxed text-obra-text-dim">
          {tr("El acceso de tu empresa está pausado. No se ha borrado nada: tus obras, horas y gastos siguen guardados y vuelven en cuanto se renueve la suscripción. Contacta con el administrador de la plataforma.")}
        </p>

        <div className="mt-auto">
          <GhostButton onClick={salir}>{tr("Salir")}</GhostButton>
        </div>
      </div>
    </div>
  );
}
