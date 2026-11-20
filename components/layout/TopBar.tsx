"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, Calendar, ChevronDown, ShieldCheck } from "lucide-react";
import { useObra } from "@/lib/obra-context";
import { useMiembro } from "@/lib/miembro-context";
import { Sheet } from "@/components/ui/Sheet";
import { ObraPicker } from "./ObraPicker";
import { tr } from "@/lib/i18n";

export function TopBar() {
  const { obraActual, obras } = useObra();
  const { miembro, gestiona, esAdminPlataforma } = useMiembro();
  const [picking, setPicking] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    const cargarAvatar = () => {
      const guardado = localStorage.getItem("obra_user_avatar");
      if (guardado) setAvatarUrl(guardado);
    };
    cargarAvatar();
    window.addEventListener("obra_avatar_changed", cargarAvatar);
    return () => window.removeEventListener("obra_avatar_changed", cargarAvatar);
  }, []);

  if (obras.length === 0) return null;

  const nombreSaludo = miembro?.nombre?.trim() || "Alex";

  return (
    <>
      {/* Cabecera estilo Dribbble: avatar táctico a la izquierda, saludo + selector
          de obra en el centro y botón cuadrado de cristal esmerilado a la derecha. */}
      <div
        className="sticky top-0 z-10 bg-obra-bg/90 px-4 pb-2.5 pt-[calc(0.75rem+env(safe-area-inset-top))] backdrop-blur-md md:px-6"
        style={{ viewTransitionName: "cabecera" }}
      >
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Link
              href="/ajustes"
              aria-label={tr("Mi cuenta y ajustes")}
              className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-[14px] border border-white/18 bg-[#141915] shadow-[0_4px_12px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.18)]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={avatarUrl || "/avatar-alex.png"}
                alt={nombreSaludo}
                className="h-full w-full object-cover"
              />
            </Link>

            <button
              onClick={() => setPicking(true)}
              className="group flex min-w-0 flex-1 flex-col items-start text-left"
            >
              <span className="truncate text-[15px] font-medium leading-tight tracking-tight text-white">
                {tr("Morning {nombre}", { nombre: nombreSaludo })}
              </span>
              <span className="mt-0.5 flex max-w-full items-center gap-1 text-[12.5px] font-normal text-white/75 group-hover:text-white">
                <span className="truncate">
                  {obraActual ? obraActual.nombre : tr("Elegir obra")}
                </span>
                <ChevronDown size={13} className="shrink-0 opacity-80" />
              </span>
            </button>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/admin"
              aria-label={tr("Panel de administración")}
              title={tr("Panel de administración")}
              className="flex h-11 items-center gap-1.5 rounded-[14px] border border-[#d7dc9a]/40 bg-[#d7dc9a]/15 px-3 text-[#d7dc9a] backdrop-blur-md transition hover:bg-[#d7dc9a]/25 active:scale-95 shadow-[0_4px_12px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.15)]"
            >
              <ShieldCheck size={17} strokeWidth={2.4} />
              <span className="text-xs font-bold">{tr("Admin")}</span>
            </Link>
            {gestiona && (
              <Link
                href="/resumen"
                aria-label={tr("Resumen mensual")}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] border border-white/14 bg-[#141915]/90 text-white backdrop-blur-md transition-colors hover:bg-[#1c221e] shadow-[0_4px_12px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.15)]"
              >
                <Calendar size={17} />
              </Link>
            )}
            <Link
              href="/notas"
              aria-label={tr("Notas")}
              className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] border border-white/14 bg-[#141915]/90 text-white backdrop-blur-md transition-colors hover:bg-[#1c221e] shadow-[0_4px_12px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.15)]"
            >
              <Bell size={17} />
              <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-[#e0826d]" />
            </Link>
          </div>
        </div>
      </div>

      {picking && (
        <Sheet title={tr("Elegir obra")} onClose={() => setPicking(false)}>
          <ObraPicker onDone={() => setPicking(false)} />
        </Sheet>
      )}
    </>
  );
}
