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
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-20 flex justify-center px-4 pb-[calc(14px+env(safe-area-inset-bottom))] md:hidden">
      <div className="pointer-events-auto flex items-center gap-0.5 rounded-full border border-obra-nav-border bg-obra-nav-bg p-1.5 shadow-[0_12px_32px_rgba(0,0,0,0.35)]">
        {navMovil(rol, modulos).map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={tr(item.label)}
              className={clsx(
                "flex h-11 w-11 items-center justify-center rounded-full transition-all active:scale-95",
                active
                  ? "bg-obra-yellow text-obra-yellow-ink font-bold shadow-[0_2px_8px_rgba(212,229,101,0.35)]"
                  : "text-[#A3B1A7] hover:text-white hover:bg-white/5"
              )}
            >
              <Icon size={19} strokeWidth={active ? 2.5 : 2} />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
