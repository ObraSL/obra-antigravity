"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Field, Input } from "@/components/ui/Field";
import { PrimaryButton } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { tr } from "@/lib/i18n";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [hecho, setHecho] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError(tr("La contraseña debe tener al menos 6 caracteres."));
      return;
    }
    if (password !== password2) {
      setError(tr("Las dos contraseñas no coinciden."));
      return;
    }

    setCargando(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(
        error.message.includes("session")
          ? tr("El enlace ha caducado o ya se usó. Pide uno nuevo desde «¿Olvidaste tu contraseña?».")
          : error.message
      );
      setCargando(false);
      return;
    }
    setHecho(true);
    setCargando(false);
    setTimeout(() => {
      router.push("/");
      router.refresh();
    }, 1500);
  };

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-sm flex-col justify-center px-6 pb-[calc(2.5rem+env(safe-area-inset-bottom))] pt-[calc(2.5rem+env(safe-area-inset-top))]">
      <div className="mb-8 flex flex-col items-center gap-3">
        <Logo size={48} className="text-obra-text" />
        <div className="font-display text-2xl font-extrabold uppercase tracking-wide text-obra-text">
          {tr("Nueva contraseña")}
        </div>
      </div>

      {hecho ? (
        <div className="text-center text-sm font-semibold text-obra-green">
          {tr("Contraseña actualizada. Entrando…")}
        </div>
      ) : (
        <form onSubmit={submit}>
          <Field label={tr("Contraseña nueva")}>
            <Input
              type="password"
              required
              minLength={6}
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </Field>
          <Field label={tr("Repite la contraseña")}>
            <Input
              type="password"
              required
              minLength={6}
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              placeholder="••••••••"
            />
          </Field>

          {error && <div className="mb-3.5 text-sm text-obra-red-text">{error}</div>}

          <PrimaryButton type="submit" disabled={cargando}>
            {cargando && <Loader2 size={16} className="animate-spin" />}
            {tr("Guardar contraseña")}
          </PrimaryButton>
        </form>
      )}
    </div>
  );
}
