"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, Loader2, ShieldAlert, X } from "lucide-react";
import { tr } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";

interface Props {
  onClose: () => void;
}

export function ModalEliminarCuenta({ onClose }: Props) {
  const router = useRouter();
  const [palabra, setPalabra] = useState("");
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState("");
  const [completado, setCompletado] = useState(false);

  const confirmacionOk = palabra.trim().toUpperCase() === "ELIMINAR";

  const handleEliminar = async () => {
    if (!confirmacionOk || procesando) return;
    setProcesando(true);
    setError("");

    try {
      const res = await fetch("/api/usuario/eliminar-cuenta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || tr("No se pudo eliminar la cuenta."));
      }

      setCompletado(true);
      const supabase = createClient();
      await supabase.auth.signOut();

      setTimeout(() => {
        router.push("/login");
        router.refresh();
      }, 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : tr("Error desconocido"));
      setProcesando(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-red-500/30 bg-[#161a17] p-6 text-white shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1.5 text-white/50 hover:bg-white/10 hover:text-white transition"
          aria-label={tr("Cerrar")}
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 text-red-400">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-500/15 border border-red-500/20">
            <AlertTriangle size={22} />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-white tracking-wide">
              {tr("Eliminar cuenta")}
            </h3>
            <p className="text-[11.5px] uppercase tracking-wider text-red-400 font-semibold">
              {tr("Zona de peligro")} · Apple 5.1.1(v)
            </p>
          </div>
        </div>

        {completado ? (
          <div className="mt-6 flex flex-col items-center justify-center py-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Check size={24} />
            </div>
            <p className="mt-3 text-base font-bold text-white">
              {tr("Cuenta eliminada correctamente")}
            </p>
            <p className="mt-1 text-xs text-white/60">
              {tr("Redirigiendo a la pantalla de acceso...")}
            </p>
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            <div className="rounded-xl border border-red-500/20 bg-red-950/20 p-3.5 text-[12.5px] leading-relaxed text-red-200/90">
              {tr("Esta acción es irreversible. Se eliminarán tus credenciales de acceso y tu vinculación con la empresa.")}
            </div>

            <div className="text-[12px] text-white/70">
              {tr("Para confirmar, escribe la palabra")} <span className="font-mono font-bold text-red-400">ELIMINAR</span> {tr("a continuación:")}
            </div>

            <input
              type="text"
              value={palabra}
              onChange={(e) => setPalabra(e.target.value)}
              placeholder="ELIMINAR"
              className="w-full rounded-xl border border-white/15 bg-black/40 px-3.5 py-2.5 text-center font-mono text-sm uppercase tracking-widest text-white placeholder-white/20 focus:border-red-400 focus:outline-none"
              autoFocus
            />

            {error && (
              <div className="rounded-lg border border-red-500/40 bg-red-950/40 p-2.5 text-xs text-red-300">
                {error}
              </div>
            )}

            <div className="mt-5 flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={procesando}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-white/70 hover:bg-white/10 hover:text-white transition"
              >
                {tr("Cancelar")}
              </button>
              <button
                type="button"
                onClick={handleEliminar}
                disabled={!confirmacionOk || procesando}
                className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg transition hover:bg-red-500 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {procesando ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>{tr("Eliminando...")}</span>
                  </>
                ) : (
                  <span>{tr("Eliminar cuenta definitivamente")}</span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
