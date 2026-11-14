"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import clsx from "clsx";
import { navLateral } from "@/lib/nav";
import { useMiembro } from "@/lib/miembro-context";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/ui/Logo";
import { tr } from "@/lib/i18n";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const { rol, modulos } = useMiembro();
  const items = navLateral(rol, modulos);

  const salir = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <aside className="sticky top-0 hidden h-[100dvh] w-60 shrink-0 flex-col border-r border-obra-line bg-obra-bg-elevated md:flex">
      <Link href="/" className="flex items-center gap-2.5 px-5 py-5" aria-label={tr("Ir a inicio")}>
        <Logo size={30} className="shrink-0 text-obra-text" />
        <div className="font-display text-lg font-extrabold uppercase tracking-wide text-obra-text">
          {tr("Control de Obra")}
        </div>
      </Link>

      <nav className="flex-1 px-3">
        {items.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-[14.5px] font-semibold transition-colors",
                active
                  ? "bg-obra-card text-obra-yellow"
                  : "text-obra-text-dim hover:bg-obra-card hover:text-obra-text"
              )}
            >
              <Icon size={18} strokeWidth={active ? 2.4 : 2} />
              {tr(item.label)}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={salir}
        className="mx-3 mb-5 flex items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] font-semibold text-obra-text-faint hover:bg-obra-card hover:text-obra-red-text"
      >
        <LogOut size={17} />
        {tr("Cerrar sesión")}
      </button>
    </aside>
  );
}
