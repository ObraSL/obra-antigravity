"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Check, Copy, Loader2 } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { tr } from "@/lib/i18n";

export default function AltaOkPage() {
  return (
    <Suspense fallback={null}>
      <AltaOk />
    </Suspense>
  );
}

/** Vuelta de Stripe con el pago hecho: se enseña el código de alta. */
function AltaOk() {
  const sessionId = useSearchParams().get("session_id");
  const [codigo, setCodigo] = useState<string | null>(null);
  const [error, setError] = useState(sessionId ? "" : tr("Falta información del pago."));
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (!sessionId) return;
    fetch(`/api/alta/codigo?session_id=${encodeURIComponent(sessionId)}`)
      .then((r) => r.json())
      .then((d) => (d.codigo ? setCodigo(d.codigo) : setError(d.error ? tr(d.error) : tr("No se pudo comprobar el pago."))))
      .catch(() => setError(tr("No se pudo comprobar el pago.")));
  }, [sessionId]);

  const copiar = async () => {
    if (!codigo) return;
    try {
      await navigator.clipboard.writeText(codigo);
      setCopiado(true);
    } catch {
      /* se puede copiar a mano */
    }
  };

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-sm flex-col justify-center px-6 py-10">
      <div className="mb-7 flex flex-col items-center gap-3">
        <Logo size={44} className="text-obra-text" />
        <div className="font-display text-2xl font-extrabold uppercase tracking-wide text-obra-text">
          {error ? tr("Pago sin confirmar") : codigo ? tr("Pago recibido") : tr("Comprobando el pago…")}
        </div>
      </div>

      {error ? (
        <div className="rounded-xl bg-obra-red-bg px-3.5 py-3 text-[14px] font-semibold text-obra-red-text">
          {error} {tr("Si el cargo aparece en tu tarjeta, escríbenos y te damos el código.")}
        </div>
      ) : !codigo ? (
        <div className="flex justify-center py-6">
          <Loader2 className="animate-spin text-obra-yellow" size={22} />
        </div>
      ) : (
        <>
          <p className="mb-3 text-center text-[14px] text-obra-text-dim">
            {tr("Este es tu código para crear la empresa. Guárdalo: sirve una sola vez.")}
          </p>
          <button
            onClick={copiar}
            className="mb-5 flex items-center justify-center gap-2 rounded-xl border border-obra-card-border bg-obra-card px-4 py-4 font-mono-obra text-xl font-bold tracking-wider text-obra-text"
          >
            {codigo}
            {copiado ? (
              <Check size={18} className="text-obra-green" />
            ) : (
              <Copy size={18} className="text-obra-text-faint" />
            )}
          </button>
          <Link
            href={`/login?alta=${encodeURIComponent(codigo)}`}
            className="flex w-full items-center justify-center rounded-xl bg-obra-yellow px-4 py-3 text-[15px] font-bold text-obra-yellow-ink"
          >
            {tr("Crear mi empresa")}
          </Link>
        </>
      )}
    </div>
  );
}
