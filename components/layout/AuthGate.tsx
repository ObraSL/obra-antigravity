"use client";

import { Loader2 } from "lucide-react";
import { useSession } from "@/lib/use-session";
import { LandingMock } from "@/components/landing/LandingMock";

/**
 * Sin sesión: muestra la pantalla pública (maqueta). Con sesión: monta el
 * panel real (ObraProvider + DashboardShell), sin gastar peticiones de más
 * mientras no sepamos si hay usuario.
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const { session, loading } = useSession();

  if (loading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-obra-bg">
        <Loader2 className="animate-spin text-obra-yellow" size={26} />
      </div>
    );
  }

  if (!session) return <LandingMock />;

  return <>{children}</>;
}
