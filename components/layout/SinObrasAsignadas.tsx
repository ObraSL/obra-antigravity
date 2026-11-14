"use client";

import { Building2 } from "lucide-react";
import { tr } from "@/lib/i18n";

/** Trabajador aprobado pero al que todavía no le corresponde ninguna obra. */
export function SinObrasAsignadas() {
  return (
    <div className="mx-auto max-w-sm px-5 py-16 text-center">
      <Building2 size={30} className="mx-auto mb-2.5 text-obra-text-faint" />
      <div className="font-display text-xl font-bold uppercase text-obra-text">
        {tr("Todavía no hay obra")}
      </div>
      <div className="mt-1 text-[13.5px] text-obra-text-faint">
        {tr("Cuando te asignen una obra la verás aquí y podrás fichar tus horas.")}
      </div>
    </div>
  );
}
