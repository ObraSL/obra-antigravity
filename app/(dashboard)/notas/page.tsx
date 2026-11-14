"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Mic, Trash2 } from "lucide-react";
import { useObra } from "@/lib/obra-context";
import { createClient } from "@/lib/supabase/client";
import type { NotaAudio } from "@/lib/types";
import { fmtDate, todayStr } from "@/lib/format";
import { DayNav } from "@/components/ui/DayNav";
import { Card } from "@/components/ui/Card";
import { Empty } from "@/components/ui/Empty";
import { GhostButton } from "@/components/ui/Button";
import { GrabadorAudio, fmtDuracion } from "@/components/ui/GrabadorAudio";
import { tr } from "@/lib/i18n";

const BUCKET = "notas";

export default function NotasPage() {
  const { obraActual } = useObra();
  const supabase = useMemo(() => createClient(), []);

  const [fecha, setFecha] = useState(todayStr());
  const [nota, setNota] = useState<NotaAudio | null>(null);
  const [cargando, setCargando] = useState(true);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState("");
  const [urlAudio, setUrlAudio] = useState<string | null>(null);
  const [confirmarBorrado, setConfirmarBorrado] = useState(false);
  const [ultimas, setUltimas] = useState<NotaAudio[]>([]);

  const cargar = useCallback(async () => {
    if (!obraActual) return;
    setCargando(true);
    setUrlAudio(null);
    setConfirmarBorrado(false);

    const [delDia, recientes] = await Promise.all([
      supabase
        .from("notas_audio")
        .select("*")
        .eq("obra_id", obraActual.id)
        .eq("fecha", fecha)
        .maybeSingle(),
      supabase
        .from("notas_audio")
        .select("*")
        .eq("obra_id", obraActual.id)
        .order("fecha", { ascending: false })
        .limit(12),
    ]);

    setNota(delDia.data ?? null);
    setUltimas(recientes.data ?? []);
    setCargando(false);

    if (delDia.data) {
      const { data } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(delDia.data.audio_path, 3600);
      setUrlAudio(data?.signedUrl ?? null);
    }
  }, [obraActual, fecha, supabase]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const guardarGrabacion = async (blob: Blob, extension: string, segundos: number) => {
    if (!obraActual) return;
    setSubiendo(true);
    setError("");

    const path = `${obraActual.id}/${crypto.randomUUID()}.${extension}`;
    const { error: errorSubida } = await supabase.storage
      .from(BUCKET)
      .upload(path, blob, { contentType: blob.type || undefined });

    if (errorSubida) {
      setError(tr("No se pudo guardar el audio ({detalle}).", { detalle: errorSubida.message }));
      setSubiendo(false);
      return;
    }

    // Si ya había nota ese día, la sustituimos (y borramos el audio viejo).
    const anterior = nota?.audio_path;
    const { error: errorGuardar } = await supabase.from("notas_audio").upsert(
      {
        obra_id: obraActual.id,
        fecha,
        audio_path: path,
        duracion_seg: segundos,
      },
      { onConflict: "obra_id,fecha" }
    );

    if (errorGuardar) {
      await supabase.storage.from(BUCKET).remove([path]);
      setError(tr("No se pudo guardar la nota. Inténtalo de nuevo."));
      setSubiendo(false);
      return;
    }

    if (anterior) await supabase.storage.from(BUCKET).remove([anterior]);
    setSubiendo(false);
    await cargar();
  };

  const borrar = async () => {
    if (!nota) return;
    await supabase.storage.from(BUCKET).remove([nota.audio_path]);
    await supabase.from("notas_audio").delete().eq("id", nota.id);
    await cargar();
  };

  if (!obraActual) return null;

  return (
    <div>
      <DayNav fecha={fecha} onChange={setFecha} />

      <Card className="mb-4 p-4">
        {cargando ? (
          <div className="flex justify-center py-6">
            <Loader2 className="animate-spin text-obra-yellow" size={22} />
          </div>
        ) : nota ? (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <div className="text-xs font-semibold uppercase tracking-wide text-obra-text-dim">
                {tr("Nota de este día")}
              </div>
              {nota.duracion_seg != null && (
                <div className="font-mono-obra text-xs text-obra-text-dim">
                  {fmtDuracion(nota.duracion_seg)}
                </div>
              )}
            </div>

            {urlAudio ? (
              <audio controls src={urlAudio} className="w-full" />
            ) : (
              <div className="py-2 text-sm text-obra-text-faint">{tr("Cargando audio…")}</div>
            )}

            <div className="mt-4 space-y-2">
              <GrabadorAudio onGrabado={guardarGrabacion} disabled={subiendo} />
              {!confirmarBorrado ? (
                <GhostButton
                  onClick={() => setConfirmarBorrado(true)}
                  className="flex items-center justify-center gap-1.5 border-obra-red/40 text-obra-red-text"
                >
                  <Trash2 size={15} /> {tr("Eliminar nota")}
                </GhostButton>
              ) : (
                <div className="flex gap-2">
                  <GhostButton onClick={() => setConfirmarBorrado(false)}>{tr("Cancelar")}</GhostButton>
                  <GhostButton
                    onClick={borrar}
                    className="border-obra-red/40 font-bold text-obra-red-text"
                  >
                    {tr("Confirmar borrado")}
                  </GhostButton>
                </div>
              )}
              <div className="text-center text-[11.5px] text-obra-text-faint">
                {tr("Si grabas otra vez, sustituye a esta nota")}
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-3 text-center text-[13.5px] text-obra-text-dim">
              {tr("Sin nota de voz el {fecha}. Cuenta qué se ha hecho hoy en la obra.", { fecha: fmtDate(fecha) })}
            </div>
            <GrabadorAudio onGrabado={guardarGrabacion} disabled={subiendo} />
          </div>
        )}

        {subiendo && (
          <div className="mt-3 flex items-center justify-center gap-2 text-[13px] text-obra-text-dim">
            <Loader2 size={15} className="animate-spin" /> {tr("Guardando…")}
          </div>
        )}
        {error && <div className="mt-3 text-xs text-obra-red-text">{error}</div>}
      </Card>

      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-obra-text-dim">
        {tr("Últimas notas")}
      </div>
      {ultimas.length === 0 ? (
        <Empty icon={Mic} title={tr("Todavía no hay notas de voz")} sub={tr("Las que grabes aparecerán aquí.")} />
      ) : (
        <div className="flex flex-col gap-2">
          {ultimas.map((n) => (
            <button
              key={n.id}
              onClick={() => setFecha(n.fecha)}
              className={`flex items-center gap-3 rounded-xl border p-3 text-left ${
                n.fecha === fecha
                  ? "border-obra-yellow bg-obra-yellow/10"
                  : "border-obra-card-border bg-obra-card"
              }`}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-obra-bg text-obra-yellow">
                <Mic size={16} />
              </div>
              <div className="min-w-0 flex-1 text-[14px] font-semibold text-obra-text">
                {fmtDate(n.fecha)}
              </div>
              {n.duracion_seg != null && (
                <div className="font-mono-obra text-xs text-obra-text-dim">
                  {fmtDuracion(n.duracion_seg)}
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
