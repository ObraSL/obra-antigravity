"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Check, MapPin, Mic, Scale, Shield, ShieldAlert, ShieldCheck, X } from "lucide-react";
import { tr } from "@/lib/i18n";

const STORAGE_KEY = "obra_legal_consent_v2";

interface Props {
  forzarAbierto?: boolean;
  onClose?: () => void;
}

export function ModalConsentimientoLegal({ forzarAbierto = false, onClose }: Props) {
  const [abierto, setAbierto] = useState(false);
  const [aceptadoCheck, setAceptadoCheck] = useState(true);

  useEffect(() => {
    if (forzarAbierto) {
      setAbierto(true);
      return;
    }
    const guardado = localStorage.getItem(STORAGE_KEY);
    if (!guardado) {
      setAbierto(true);
    }
  }, [forzarAbierto]);

  const handleAceptar = () => {
    localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    setAbierto(false);
    if (onClose) onClose();
  };

  const handleCerrar = () => {
    setAbierto(false);
    if (onClose) onClose();
  };

  if (!abierto) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/15 bg-[#161a17] p-5 sm:p-6 text-white shadow-2xl">
        {forzarAbierto && (
          <button
            type="button"
            onClick={handleCerrar}
            className="absolute right-4 top-4 rounded-full p-1.5 text-white/50 hover:bg-white/10 hover:text-white transition"
            aria-label={tr("Cerrar")}
          >
            <X size={18} />
          </button>
        )}

        {/* Encabezado */}
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#D7DC9A]/15 text-[#D7DC9A] border border-[#D7DC9A]/20">
            <Scale size={22} />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-white tracking-wide">
              {tr("Términos, permisos y descargo de responsabilidad")}
            </h3>
            <p className="text-[11px] uppercase tracking-wider text-[#D7DC9A] font-semibold">
              {tr("Software «tal cual» (AS IS) y descargo legal")}
            </p>
          </div>
        </div>

        <p className="mt-3.5 text-xs leading-relaxed text-white/70">
          {tr("Al continuar, confirmas que aceptas las condiciones de uso y el tratamiento de permisos para el correcto funcionamiento de la aplicación:")}
        </p>

        {/* Lista de 3 compromisos y permisos */}
        <div className="mt-4 space-y-2.5">
          {/* 1. Ubicación */}
          <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
              <MapPin size={15} />
            </div>
            <div>
              <div className="text-xs font-bold text-white">
                {tr("Ubicación GPS puntual")}
              </div>
              <div className="text-[11.5px] leading-relaxed text-white/60">
                {tr("Solo se verifica tu posición en el milisegundo de registrar la entrada o salida en la obra.")}
              </div>
            </div>
          </div>

          {/* 2. Micrófono */}
          <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-400">
              <Mic size={15} />
            </div>
            <div>
              <div className="text-xs font-bold text-white">
                {tr("Acceso al micrófono")}
              </div>
              <div className="text-[11.5px] leading-relaxed text-white/60">
                {tr("Para dictar notas de voz y partes diarios que se transcriben con inteligencia artificial.")}
              </div>
            </div>
          </div>

          {/* 3. AS IS / Exclusión legal */}
          <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-red-500/15 text-red-400">
              <ShieldAlert size={15} />
            </div>
            <div>
              <div className="text-xs font-bold text-white">
                {tr("Descargo de responsabilidad")} (AS IS)
              </div>
              <div className="text-[11.5px] leading-relaxed text-white/60">
                {tr("El software es una herramienta auxiliar. No asumimos responsabilidad por fallos de cobertura, inexactitudes de IA ni disputas laborales entre empresa y empleados.")}
              </div>
            </div>
          </div>
        </div>

        {/* Enlaces a textos legales completos */}
        <div className="mt-4 flex items-center justify-center gap-3 text-[11.5px] text-white/60 border-t border-white/10 pt-3">
          <Link
            href="/privacidad"
            target="_blank"
            className="text-[#D7DC9A] hover:underline"
          >
            {tr("Política de privacidad")}
          </Link>
          <span>·</span>
          <Link
            href="/terminos"
            target="_blank"
            className="text-[#D7DC9A] hover:underline"
          >
            {tr("Términos del servicio")}
          </Link>
        </div>

        {/* Checkbox de confirmación y Botón de aceptación */}
        <div className="mt-4 space-y-3">
          <label className="flex items-center gap-2 cursor-pointer select-none text-[12px] text-white/80">
            <input
              type="checkbox"
              checked={aceptadoCheck}
              onChange={(e) => setAceptadoCheck(e.target.checked)}
              className="h-4 w-4 rounded border-white/20 bg-black/40 text-[#D7DC9A] focus:ring-0"
            />
            <span>{tr("He leído y acepto los términos de servicio y permisos.")}</span>
          </label>

          <button
            type="button"
            onClick={handleAceptar}
            disabled={!aceptadoCheck}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#D7DC9A] py-3 text-xs font-bold uppercase tracking-wider text-[#1E2520] shadow-lg transition hover:bg-[#c8cd8b] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Check size={16} />
            <span>{tr("Acepto y continuar")}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
