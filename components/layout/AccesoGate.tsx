"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useMiembro } from "@/lib/miembro-context";
import { AVISO_CONTROL_VERSION } from "@/lib/types";
import { RUTAS_SOLO_GESTORES } from "@/lib/nav";
import { rutaApagada } from "@/lib/modulos";
import { PendienteAprobacion } from "./PendienteAprobacion";
import { AvisoControl } from "./AvisoControl";
import { SuscripcionInactiva } from "./SuscripcionInactiva";

/**
 * Ya hay sesión: aquí decidimos si esa cuenta tiene acceso y hasta dónde.
 * Sin aprobar → pantalla de espera. Trabajador → fuera de las secciones
 * que no le tocan (por si llega escribiendo la dirección a mano).
 */
export function AccesoGate({ children }: { children: React.ReactNode }) {
  const { miembro, loading, esTrabajador, esAdminPlataforma, suscripcionInactiva, modulos } = useMiembro();
  const necesitaLeerAviso = esTrabajador && miembro?.aprobado && miembro.aviso_control_version !== AVISO_CONTROL_VERSION;
  const pathname = usePathname();
  const router = useRouter();

  const rutaProhibida =
    (esTrabajador && RUTAS_SOLO_GESTORES.some((r) => pathname.startsWith(r))) ||
    (!loading && rutaApagada(pathname, modulos));

  useEffect(() => {
    if (rutaProhibida) router.replace("/");
  }, [rutaProhibida, router]);

  // Una cuenta de administrador de la plataforma no pertenece a ninguna
  // empresa: no tiene sentido esperar aquí a que un dueño la apruebe.
  useEffect(() => {
    if (!loading && esAdminPlataforma) router.replace("/admin");
  }, [loading, esAdminPlataforma, router]);

  if (loading || rutaProhibida || esAdminPlataforma) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-obra-bg">
        <Loader2 className="animate-spin text-obra-yellow" size={26} />
      </div>
    );
  }

  if (!miembro?.aprobado) return <PendienteAprobacion />;
  if (suscripcionInactiva) return <SuscripcionInactiva />;
  if (necesitaLeerAviso) return <AvisoControl />;

  return <>{children}</>;
}
