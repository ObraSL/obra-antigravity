"use client";

import { useRef, useState } from "react";
import { Camera, FileText, Loader2, X } from "lucide-react";
import { compressImageToBlob } from "@/lib/image";
import type { createClient } from "@/lib/supabase/client";
import { tr } from "@/lib/i18n";

/** Todo va al mismo sitio que ya usaban los recibos y las facturas. */
export const BUCKET_DOCUMENTOS = "facturas";

export type ArchivoElegido = { blob: Blob; type: string; name: string; preview?: string };

/**
 * Hacer foto o elegir PDF. Las fotos se comprimen antes de subirlas: una
 * foto del móvil pesa varios megas y con cobertura de obra no se subía.
 */
export function SelectorArchivo({
  archivo,
  onChange,
}: {
  archivo: ArchivoElegido | null;
  onChange: (a: ArchivoElegido | null) => void;
}) {
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const elegir = async (file: File | undefined) => {
    if (!file) return;
    setError("");
    setProcesando(true);
    try {
      if (file.type === "application/pdf") {
        if (file.size > 10 * 1024 * 1024) {
          setError(tr("El PDF pesa demasiado (máx. 10 MB)."));
        } else {
          onChange({ blob: file, type: "application/pdf", name: file.name });
        }
      } else {
        const blob = await compressImageToBlob(file);
        onChange({ blob, type: "image/jpeg", name: file.name, preview: URL.createObjectURL(blob) });
      }
    } catch {
      setError(tr("No se pudo procesar el archivo. Inténtalo de nuevo."));
    }
    setProcesando(false);
  };

  return (
    <div>
      {!archivo ? (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={procesando}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-[1.5px] border-dashed border-obra-line py-4 text-obra-text-dim"
        >
          {procesando ? <Loader2 className="animate-spin text-obra-yellow" size={20} /> : <Camera size={20} />}
          <span className="text-[13px] font-semibold">
            {procesando ? tr("Procesando…") : tr("Hacer foto o subir PDF")}
          </span>
        </button>
      ) : (
        <div className="flex items-center gap-2.5 rounded-[10px] border border-obra-line bg-obra-bg-elevated p-2.5">
          {archivo.type === "application/pdf" ? (
            <FileText size={20} className="text-obra-green" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={archivo.preview} alt="" className="h-10 w-10 rounded-md object-cover" />
          )}
          <span className="flex-1 truncate text-[13px] text-obra-text">{archivo.name}</span>
          <button type="button" onClick={() => onChange(null)} className="text-obra-text-faint">
            <X size={16} />
          </button>
        </div>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/*,application/pdf"
        capture="environment"
        className="hidden"
        onChange={(e) => elegir(e.target.files?.[0])}
      />
      {error && <div className="mt-1.5 text-xs text-obra-red-text">{error}</div>}
    </div>
  );
}

/**
 * Sube el archivo a la carpeta de la obra. La ruta empieza SIEMPRE por el id
 * de la obra: la regla de permisos del almacén solo mira ese primer tramo.
 */
export async function subirArchivo(
  supabase: ReturnType<typeof createClient>,
  obraId: string,
  carpeta: string,
  archivo: ArchivoElegido
): Promise<{ path: string } | { error: string }> {
  const ext = archivo.type === "application/pdf" ? "pdf" : "jpg";
  const path = `${obraId}/${carpeta}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from(BUCKET_DOCUMENTOS)
    .upload(path, archivo.blob, { contentType: archivo.type });
  return error ? { error: error.message } : { path };
}
