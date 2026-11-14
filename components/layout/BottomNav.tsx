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
      <div className="pointer-events-auto relative flex w-full max-w-[340px] items-center justify-around overflow-hidden rounded-[24px] border border-white/18 bg-[#68736b]/88 px-2.5 py-2 backdrop-blur-xl shadow-[0_16px_36px_rgba(12,16,13,0.34)]">
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
                  ? "bg-[#49524b] text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.12),0_4px_12px_rgba(0,0,0,0.22)]"
                  : "text-white/80 hover:bg-white/10 hover:text-white"
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
