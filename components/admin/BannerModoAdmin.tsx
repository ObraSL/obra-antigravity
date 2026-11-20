"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Eye, ShieldCheck, X } from "lucide-react";
import { tr } from "@/lib/i18n";
import type { EmpresaAdmin } from "@/lib/types";

export function BannerModoAdmin() {
  const [empresaInspeccionada, setEmpresaInspeccionada] = useState<EmpresaAdmin | null>(null);

  useEffect(() => {
    const verificar = () => {
      try {
        const raw = localStorage.getItem("obra_admin_inspeccion_empresa");
        if (raw) {
          setEmpresaInspeccionada(JSON.parse(raw));
        } else {
          setEmpresaInspeccionada(null);
        }
      } catch {
        setEmpresaInspeccionada(null);
      }
    };

    verificar();
    window.addEventListener("obra_admin_inspeccion_changed", verificar);
    return () => window.removeEventListener("obra_admin_inspeccion_changed", verificar);
  }, []);

  if (!empresaInspeccionada) return null;

  const salirDeModo = () => {
    localStorage.removeItem("obra_admin_inspeccion_empresa");
    window.dispatchEvent(new Event("obra_admin_inspeccion_changed"));
    window.location.reload();
  };

  return (
    <div className="sticky top-0 z-50 flex items-center justify-between gap-3 border-b border-[#d7dc9a]/40 bg-[#162018]/95 px-4 py-2 backdrop-blur-md shadow-md text-white text-xs">
      <div className="flex items-center gap-2 min-w-0">
        <span className="flex h-2.5 w-2.5 rounded-full bg-[#d7dc9a] animate-pulse shrink-0" />
        <div className="flex items-center gap-1.5 truncate">
          <span className="font-bold text-[#d7dc9a] flex items-center gap-1 shrink-0">
            <Eye size={13} />
            {tr("Modo inspección")}:
          </span>
          <span className="font-semibold text-white truncate">{empresaInspeccionada.nombre}</span>
          <span className="hidden sm:inline-block font-mono text-[11px] rounded bg-[#d7dc9a]/15 px-1.5 py-0.2 text-[#d7dc9a] shrink-0">
            {empresaInspeccionada.codigo}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Link
          href="/admin"
          className="flex items-center gap-1 rounded-lg bg-[#d7dc9a] px-2.5 py-1 text-[11px] font-bold text-[#141a16] transition hover:bg-[#c8cd8b] shadow"
        >
          <ArrowLeft size={12} />
          <span>{tr("Volver a /admin")}</span>
        </Link>
        <button
          type="button"
          onClick={salirDeModo}
          title={tr("Salir del modo inspección")}
          className="flex h-6 w-6 items-center justify-center rounded-md border border-white/14 bg-white/5 text-white/60 hover:text-white hover:bg-white/10"
        >
          <X size={12} />
        </button>
      </div>
    </div>
  );
}
