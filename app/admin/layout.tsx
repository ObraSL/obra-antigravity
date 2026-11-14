"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogOut, ShieldOff } from "lucide-react";
import { useSession } from "@/lib/use-session";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/ui/Logo";
import { GhostButton } from "@/components/ui/Button";
import { tr } from "@/lib/i18n";

/**
 * Panel del administrador de la plataforma: una cuenta completamente
 * aparte de cualquier empresa-cliente (ni "dueno", ni ningún otro rol —
 * vive solo en admins_plataforma). A propósito NO comparte nada con el
 * layout de (dashboard): ni ObraProvider, ni MiembroProvider, ni el menú
 * de Fichajes/Gastos/Dinero. Solo esto.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const { session, loading: cargandoSesion } = useSession();
  const [esAdmin, setEsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (cargandoSesion) return;
    if (!session) {
      router.replace("/login");
      return;
    }
    supabase.rpc("soy_admin_plataforma").then(({ data }) => setEsAdmin(Boolean(data)));
  }, [cargandoSesion, session, supabase, router]);

  const salir = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  if (cargandoSesion || (session && esAdmin === null)) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-obra-bg">
        <Loader2 className="animate-spin text-obra-yellow" size={26} />
      </div>
    );
  }

  if (!esAdmin) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-3 bg-obra-bg px-6 text-center">
        <ShieldOff size={28} className="text-obra-text-faint" />
        <div className="text-[15px] font-semibold text-obra-text">{tr("Esto no es para esta cuenta")}</div>
        <GhostButton className="mt-2 w-auto px-5" onClick={salir}>
          {tr("Cerrar sesión")}
        </GhostButton>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-obra-bg">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-2xl flex-col px-5 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-[calc(2rem+env(safe-area-inset-top))]">
        <div className="mb-7 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Logo size={28} className="text-obra-text" />
            <div className="font-display text-lg font-extrabold uppercase tracking-wide text-obra-text">
              {tr("Admin")}
            </div>
          </div>
          <button
            onClick={salir}
            className="flex items-center gap-1.5 text-[13px] font-semibold text-obra-text-faint"
          >
            <LogOut size={15} /> {tr("Salir")}
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}
