"use client";

import { useEffect, useState } from "react";
import { Check, Copy, QrCode, X } from "lucide-react";
import QRCode from "qrcode";
import { tr } from "@/lib/i18n";

interface ModalQrInvitacionProps {
  codigoEmpresa: string;
  enlaceInvitacion: string;
  onClose: () => void;
}

export function ModalQrInvitacion({
  codigoEmpresa,
  enlaceInvitacion,
  onClose,
}: ModalQrInvitacionProps) {
  const [svgQr, setSvgQr] = useState<string>("");
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    QRCode.toString(enlaceInvitacion, {
      type: "svg",
      margin: 1,
      color: {
        dark: "#141916",
        light: "#ffffff",
      },
    })
      .then(setSvgQr)
      .catch(() => {});
  }, [enlaceInvitacion]);

  const copiar = async () => {
    await navigator.clipboard.writeText(enlaceInvitacion);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-sm overflow-hidden rounded-[28px] border border-white/20 bg-[#1a221c] p-6 text-center shadow-[0_24px_60px_rgba(0,0,0,0.65)]">
        {/* Botón cerrar */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
        >
          <X size={16} />
        </button>

        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#d7dc9a]/40 bg-[#d7dc9a]/15 text-[#d7dc9a]">
          <QrCode size={24} />
        </div>

        <h3 className="text-lg font-bold text-white">
          {tr("Unirse a la cuadrilla")}
        </h3>

        <p className="mt-1 text-xs text-white/70 leading-relaxed">
          {tr("Muestra este código al operario: apunta con la cámara de su móvil y se unirá al instante.")}
        </p>

        {/* Tarjeta del QR Code en fondo blanco puro para lectura perfecta */}
        <div className="my-4 mx-auto flex h-60 w-60 items-center justify-center rounded-2xl bg-white p-3 shadow-inner">
          {svgQr ? (
            <div
              className="h-full w-full [&>svg]:h-full [&>svg]:w-full"
              dangerouslySetInnerHTML={{ __html: svgQr }}
            />
          ) : (
            <div className="text-xs text-black/50">{tr("Generando QR…")}</div>
          )}
        </div>

        {/* Código de texto */}
        <div className="mb-4 inline-flex items-center gap-1.5 rounded-xl border border-white/12 bg-white/5 px-3 py-1.5 text-xs text-white/80">
          <span>{tr("Código de empresa")}:</span>
          <strong className="font-mono text-[#d7dc9a] tracking-wider">{codigoEmpresa}</strong>
        </div>

        {/* Botón copiar enlace */}
        <button
          type="button"
          onClick={copiar}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 py-3 text-sm font-semibold text-white transition hover:bg-white/15 active:scale-[0.98]"
        >
          {copiado ? (
            <>
              <Check size={16} className="text-[#d7dc9a]" />
              <span className="text-[#d7dc9a]">{tr("¡Enlace copiado!")}</span>
            </>
          ) : (
            <>
              <Copy size={16} />
              <span>{tr("Copiar enlace directo")}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
