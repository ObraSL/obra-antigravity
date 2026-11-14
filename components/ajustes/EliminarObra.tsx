"use client";

import { useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { eliminarObraDefinitivamente } from "@/lib/eliminar-obra";
import type { Obra } from "@/lib/types";
import { Field, Input } from "@/components/ui/Field";
import { tr, trJsx } from "@/lib/i18n";

/**
 * Borrar una obra es irreversible: fichajes, gastos, fotos de recibos,
 * audios, todo desaparece. Doble candado a propósito — escribir el nombre
 * tal cual (para no borrar la de al lado por un toque en falso) y la
 * contraseña de la cuenta (para que no sea "un toque más" sin pensarlo).
 */
export function EliminarObra({
  obra,
  onEliminada,
}: {
  obra: Obra;
  onEliminada: () => void;
}) {
  const [nombre, setNombre] = useState("");
  const [password, setPassword] = useState("");
  const [borrando, setBorrando] = useState(false);
  const [error, setError] = useState("");

  const nombreOk = nombre.trim() === obra.nombre;

  const eliminar = async () => {
    if (!nombreOk || !password) return;
    setBorrando(true);
    setError("");
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email) {
      setError(tr("No se pudo confirmar tu cuenta. Vuelve a iniciar sesión e inténtalo de nuevo."));
      setBorrando(false);
      return;
    }

    const { error: errAuth } = await supabase.auth.signInWithPassword({
      email: user.email,
      password,
    });
    if (errAuth) {
      setError(tr("Contraseña incorrecta."));
      setBorrando(false);
      return;
    }

    const errBorrado = await eliminarObraDefinitivamente(supabase, obra.id);
    setBorrando(false);
    if (errBorrado) {
      setError(errBorrado);
      return;
    }
    onEliminada();
  };

  return (
    <div>
      <div className="mb-3.5 flex items-start gap-2.5 rounded-xl bg-obra-red-bg px-3.5 py-3">
        <AlertTriangle size={18} className="mt-0.5 shrink-0 text-obra-red" />
        <div className="text-[13px] leading-relaxed text-obra-red-text">
          {trJsx("Esto borra {siempre} todos los fichajes, gastos, fotos de recibos, cobros y notas de audio de «{obra}». No hay vuelta atrás y no queda copia en la app.", {
            siempre: <span className="font-bold">{tr("para siempre")}</span>,
            obra: obra.nombre,
          })}
        </div>
      </div>

      <Field label={tr("Escribe «{obra}» para confirmar", { obra: obra.nombre })}>
        <Input
          value={nombre}
          onChange={(e) => {
            setNombre(e.target.value);
            if (error) setError("");
          }}
          placeholder={obra.nombre}
          autoComplete="off"
        />
      </Field>

      <Field label={tr("Tu contraseña")}>
        <Input
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (error) setError("");
          }}
          placeholder="••••••••"
        />
      </Field>

      {error && <div className="mb-3.5 text-[13px] text-obra-red-text">{error}</div>}

      <button
        disabled={!nombreOk || !password || borrando}
        onClick={eliminar}
        className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-obra-red-bg py-3 text-[14px] font-bold text-obra-red disabled:opacity-40"
      >
        {borrando && <Loader2 size={16} className="animate-spin" />}
        {tr("Borrar «{obra}» para siempre", { obra: obra.nombre })}
      </button>
    </div>
  );
}
