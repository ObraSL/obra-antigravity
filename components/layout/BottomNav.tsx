"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navMovil } from "@/lib/nav";
import { useMiembro } from "@/lib/miembro-context";
import clsx from "clsx";
import { tr } from "@/lib/i18n";

export function BottomNav() {
  const pathname = usePathname();
  const { rol, modulos } = useMiembro();
  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-20 flex justify-center px-5 pb-[calc(14px+env(safe-area-inset-bottom))] md:hidden">
      <div className="pointer-events-auto relative flex w-full max-w-[340px] items-center justify-around overflow-hidden rounded-[26px] border border-white/14 bg-[#0e120f]/92 px-2.5 py-2 backdrop-blur-2xl shadow-[0_20px_45px_rgba(0,0,0,0.45),inset_0_1px_1px_rgba(255,255,255,0.18)]">
        {/* Resplandor cálido coral en el extremo derecho, fiel a la referencia Dribbble */}
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-24 opacity-60"
          style={{
            background:
              "radial-gradient(circle at 85% 90%, rgba(224,130,109,0.55) 0%, transparent 72%)",
          }}
        />
        {navMovil(rol, modulos).map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={tr(item.label)}
              className={clsx(
                "relative flex h-11 w-11 items-center justify-center rounded-[14px] transition-all active:scale-95",
                active
                  ? "bg-[#1c221e] text-[#d7dc9a] border border-white/12 shadow-[0_3px_10px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.15)]"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              )}
            >
              <Icon size={19} strokeWidth={active ? 2.4 : 1.9} />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
