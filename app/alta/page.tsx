"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Field, Input } from "@/components/ui/Field";
import { PrimaryButton } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { SelectorIdioma } from "@/components/ui/SelectorIdioma";
import { localeActual, tr } from "@/lib/i18n";

type Precio = { disponible: false } | { disponible: true; importe: number; moneda: string; intervalo: string };

/** Para una empresa nueva sin código: paga con tarjeta y recibe su código de alta. */
export default function AltaPage() {
  const [precio, setPrecio] = useState<Precio | null>(null);
  const [email, setEmail] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/alta/checkout")
      .then((r) => r.json())
      .then(setPrecio)
      .catch(() => setPrecio({ disponible: false }));
  }, []);

  const pagar = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setError("");
    const r = await fetch("/api/alta/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const datos = await r.json().catch(() => ({}));
    if (datos.url) {
      window.location.href = datos.url;
      return;
    }
    setError(datos.error ? tr(datos.error) : tr("No se pudo abrir el pago. Inténtalo otra vez."));
    setCargando(false);
  };

  const importe =
    precio?.disponible &&
    new Intl.NumberFormat(localeActual(), { style: "currency", currency: precio.moneda.toUpperCase() }).format(
      precio.importe
    );

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-sm flex-col justify-center px-6 pb-[calc(2.5rem+env(safe-area-inset-bottom))] pt-[calc(2.5rem+env(safe-area-inset-top))]">
      <Link
        href="/login"
        className="absolute left-4 top-5 flex h-10 w-10 items-center justify-center rounded-full border border-obra-card-border bg-obra-card text-obra-text-dim"
        aria-label={tr("Volver")}
      >
        <ArrowLeft size={18} />
      </Link>
      <SelectorIdioma className="absolute right-4 top-5" />

      <div className="mb-7 flex flex-col items-center gap-3">
        <Logo size={44} className="text-obra-text" />
        <div className="font-display text-2xl font-extrabold uppercase tracking-wide text-obra-text">
          {tr("Alta de empresa")}
        </div>
      </div>

      {precio === null ? (
        <div className="flex justify-center py-6">
          <Loader2 className="animate-spin text-obra-yellow" size={22} />
        </div>
      ) : !precio.disponible ? (
        <div className="rounded-xl bg-obra-yellow/12 px-3.5 py-3 text-[14px] text-obra-text">
          {tr("El alta con tarjeta todavía no está abierta. Pide tu código directamente a Control de Obra.")}
        </div>
      ) : (
        <form onSubmit={pagar}>
          <div className="mb-5 rounded-xl bg-obra-yellow/12 px-3.5 py-3 text-[14px] text-obra-text">
            <div className="font-bold">{tr("14 días gratis")}</div>
            {tr(
              precio.intervalo === "year"
                ? "Después, {importe} al año. Puedes darte de baja cuando quieras. Al terminar el pago recibirás tu código para crear la empresa."
                : "Después, {importe} al mes. Puedes darte de baja cuando quieras. Al terminar el pago recibirás tu código para crear la empresa.",
              { importe: importe || "" }
            )}
          </div>
          <Field label={tr("Email de la empresa")}>
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={tr("tú@empresa.com")}
            />
          </Field>
          {error && (
            <div className="mb-3.5 rounded-xl bg-obra-red-bg px-3.5 py-3 text-[14px] font-semibold text-obra-red-text">
              {error}
            </div>
          )}
          <PrimaryButton type="submit" disabled={cargando}>
            {cargando && <Loader2 size={16} className="animate-spin" />}
            {tr("Pagar con tarjeta")}
          </PrimaryButton>
        </form>
      )}
    </div>
  );
}
