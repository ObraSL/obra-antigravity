"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { reportarError } from "@/lib/errores";
import { tr } from "@/lib/i18n";
import { PrimaryButton } from "@/components/ui/Button";

/** Si una pantalla revienta: se avisa a /admin y se ofrece reintentar. */
export default function ErrorPantalla({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    reportarError(error, "pantalla (error.tsx)");
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[70dvh] max-w-sm flex-col items-center justify-center px-6 text-center">
      <AlertTriangle size={30} className="mb-3 text-obra-yellow" />
      <div className="font-display text-xl font-bold uppercase text-obra-text">{tr("Algo ha fallado")}</div>
      <p className="mb-5 mt-1 text-[13.5px] text-obra-text-faint">
        {tr("Ya nos ha llegado el aviso. Prueba otra vez; si sigue pasando, vuelve más tarde.")}
      </p>
      <PrimaryButton onClick={() => retry()}>{tr("Reintentar")}</PrimaryButton>
    </div>
  );
}
