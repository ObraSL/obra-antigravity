"use client";

import { ViewTransition } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Loader2, ShieldCheck } from "lucide-react";
import { tr } from "@/lib/i18n";
import { useObra } from "@/lib/obra-context";
import { useMiembro } from "@/lib/miembro-context";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { BottomNav } from "./BottomNav";
import { SinObras } from "./SinObras";
import { SinObrasAsignadas } from "./SinObrasAsignadas";
import { PullToRefresh } from "./PullToRefresh";
import { ModalConsentimientoLegal } from "@/components/legal/ModalConsentimientoLegal";
import { BannerModoAdmin } from "@/components/admin/BannerModoAdmin";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { obras, loading } = useObra();
  const { gestiona } = useMiembro();

  return (
    <div className="flex min-h-[100dvh]">
      <Sidebar />
      {/* min-w-0 es imprescindible: por defecto un hijo de un flex NO se
          encoge por debajo del ancho mínimo de su contenido, así que en
          cuanto una tarjeta pedía más que la pantalla estiraba TODA la
          página y en el iPhone se podía arrastrar de lado. Sin esto, el
          arreglo del rebote no sirve de nada. */}
      <div className="flex min-h-[100dvh] min-w-0 flex-1 flex-col">
        <BannerModoAdmin />
        <TopBar />
        <main className="flex-1 pb-6">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="animate-spin text-obra-yellow" size={26} />
            </div>
          ) : obras.length === 0 ? (
            // Solo quien puede crear obras ve el formulario de "crea la primera".
            gestiona ? <SinObras /> : <SinObrasAsignadas />
          ) : (
            <PullToRefresh>
              <div className="mx-auto max-w-3xl px-4 pb-28 pt-4 md:px-6 md:py-6">
                <ViewTransition
                  key={pathname}
                  enter={{ adelante: "pag-adelante", atras: "pag-atras", default: "pag-fundido" }}
                  exit={{ adelante: "pag-adelante", atras: "pag-atras", default: "pag-fundido" }}
                  default="none"
                >
                  <div>{children}</div>
                </ViewTransition>
              </div>
            </PullToRefresh>
          )}
        </main>
        {/* Botón flotante siempre visible para saltar a la Consola de Administración */}
        <div className="fixed bottom-20 right-4 z-40 md:bottom-6 md:right-6">
          <Link
            href="/admin"
            className="flex items-center gap-2 rounded-full border border-[#d7dc9a]/40 bg-[#141a16]/95 px-3.5 py-2 text-xs font-bold text-[#d7dc9a] shadow-2xl backdrop-blur-md transition hover:bg-[#1c241f] hover:scale-105 active:scale-95"
            title={tr("Panel de administración")}
          >
            <ShieldCheck size={16} strokeWidth={2.4} />
            <span className="tracking-tight">{tr("Consola Admin")}</span>
          </Link>
        </div>
        {obras.length > 0 && <BottomNav />}
        <ModalConsentimientoLegal />
      </div>
    </div>
  );
}
