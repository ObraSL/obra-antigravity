"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import clsx from "clsx";
import { navLateral, tipoSalto } from "@/lib/nav";
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
    <aside className="sticky top-0 hidden h-[100dvh] w-60 shrink-0 flex-col border-r border-white/10 bg-[#5c675e]/80 backdrop-blur-md md:flex">
      <Link href="/" className="flex items-center gap-2.5 px-5 py-5" aria-label={tr("Ir a inicio")}>
        <Logo size={24} className="shrink-0 text-[#d7dc9a]" />
        <div className="font-sans text-[15px] font-medium tracking-tight text-white">
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
              transitionTypes={tipoSalto(pathname, item.href)}
              className={clsx(
                "mb-1 flex items-center gap-3 rounded-xl px-3 py-2 text-[13.5px] transition-all",
                active
                  ? "bg-[#1c221e] text-[#d7dc9a] font-medium border border-white/10 shadow-[0_2px_8px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.12)]"
                  : "text-white/75 font-normal hover:bg-white/8 hover:text-white"
              )}
            >
              <Icon size={17} strokeWidth={active ? 2.1 : 1.7} />
              <span className="tracking-tight">{tr(item.label)}</span>
            </Link>
          );
        })}
      </nav>

      <button
        onClick={salir}
        className="mx-3 mb-5 flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-normal text-white/60 hover:bg-white/8 hover:text-white transition-colors"
      >
        <LogOut size={16} />
        <span className="tracking-tight">{tr("Cerrar sesión")}</span>
      </button>
    </aside>
  );
}
