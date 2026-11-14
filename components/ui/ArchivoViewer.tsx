"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { tr } from "@/lib/i18n";

/** Muestra una imagen o PDF guardado en Storage a partir de su ruta, pidiendo una URL firmada temporal. */
export function ArchivoViewer({
  path,
  tipo,
  bucket = "facturas",
}: {
  path: string;
  tipo?: string | null;
  bucket?: string;
}) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    setUrl(null);
    supabase.storage
      .from(bucket)
      .createSignedUrl(path, 600)
      .then(({ data }) => setUrl(data?.signedUrl ?? null));
  }, [path, bucket]);

  return (
    <div className="flex min-h-[160px] items-center justify-center overflow-hidden rounded-xl border border-obra-line bg-obra-bg-elevated">
      {!url ? (
        <Loader2 className="animate-spin text-obra-yellow" size={22} />
      ) : tipo === "application/pdf" ? (
        <embed src={url} type="application/pdf" className="h-[420px] w-full" />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={tr("Recibo")} className="block w-full" />
      )}
    </div>
  );
}
