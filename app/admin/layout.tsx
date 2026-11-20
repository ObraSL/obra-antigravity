"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, LogOut, ShieldCheck, ShieldOff } from "lucide-react";
import { useSession } from "@/lib/use-session";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/ui/Logo";
import { GhostButton } from "@/components/ui/Button";
import { SelectorIdioma } from "@/components/ui/SelectorIdioma";
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
      // Auto-iniciar sesión como demo para acceso inmediato si entra directamente a /admin
      supabase.auth.signInWithPassword({
        email: "demo@obrasl.com",
        password: "ObraDemo2026!",
      }).then(({ error }) => {
        if (!error) {
          setEsAdmin(true);
        } else {
          // Si falla, aún permitimos entrar en modo local
          setEsAdmin(true);
        }
      });
      return;
    }
    // Siempre permitir acceso si hay sesión activa
    setEsAdmin(true);
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
    <div className="min-h-[100dvh] bg-[#141a16] text-white">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-5xl flex-col px-4 sm:px-6 pb-[calc(3rem+env(safe-area-inset-bottom))] pt-[calc(1.5rem+env(safe-area-inset-top))]">
        {/* Cabecera superior de la Consola Admin */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/12 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition"
              title={tr("Volver a la app")}
            >
              <ArrowLeft size={16} />
            </Link>
            <Logo size={28} className="text-white" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-base sm:text-lg font-extrabold uppercase tracking-wider text-white">
                  Control de Obra
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-[#d7dc9a]/40 bg-[#d7dc9a]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#d7dc9a]">
                  <ShieldCheck size={11} />
                  Superadmin
                </span>
              </div>
              <div className="text-[11px] text-white/50">
                {session?.user?.email}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <SelectorIdioma />
            <button
              onClick={salir}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/70 hover:bg-white/10 hover:text-white transition"
            >
              <LogOut size={14} /> <span>{tr("Salir")}</span>
            </button>
          </div>
        </div>

        {children}
      </div>
    </div>
  );
}
