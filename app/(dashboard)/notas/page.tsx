"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Globe, Loader2, Mic, ShoppingCart, Sparkles, Trash2, Wallet } from "lucide-react";
import { useObra } from "@/lib/obra-context";
import { createClient } from "@/lib/supabase/client";
import type { NotaAudio } from "@/lib/types";
import { fmtDate, todayStr } from "@/lib/format";
import { DayNav } from "@/components/ui/DayNav";
import { Card } from "@/components/ui/Card";
import { Empty } from "@/components/ui/Empty";
import { GhostButton } from "@/components/ui/Button";
import { GrabadorAudio, fmtDuracion } from "@/components/ui/GrabadorAudio";
import { localeActual, tr } from "@/lib/i18n";

const BUCKET = "notas";

interface MetaIA {
  transcripcion: string;
  idioma_origen: string;
  traduccion_uk: string;
  traduccion_es: string;
  resumen_dia: string;
  etiquetas: {
    comprar: string[];
    extra_cliente: string[];
    incidencia: string[];
    progreso: string[];
  };
}

export default function NotasPage() {
  const { obraActual } = useObra();
  const supabase = useMemo(() => createClient(), []);

  const [fecha, setFecha] = useState(todayStr());
  const [nota, setNota] = useState<NotaAudio | null>(null);
  const [metaIA, setMetaIA] = useState<MetaIA | null>(null);
  const [cargando, setCargando] = useState(true);
  const [subiendo, setSubiendo] = useState(false);
  const [procesandoIA, setProcesandoIA] = useState(false);
  const [error, setError] = useState("");
  const [urlAudio, setUrlAudio] = useState<string | null>(null);
  const [confirmarBorrado, setConfirmarBorrado] = useState(false);
  const [ultimas, setUltimas] = useState<NotaAudio[]>([]);

  const cargar = useCallback(async () => {
    if (!obraActual) return;
    setCargando(true);
    setUrlAudio(null);
    setMetaIA(null);
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

      // Intentar descargar metadatos IA asociados (.json)
      try {
        const jsonPath = delDia.data.audio_path.replace(/\.[^.]+$/, ".json");
        const { data: jsonData } = await supabase.storage.from(BUCKET).download(jsonPath);
        if (jsonData) {
          const parsed = JSON.parse(await jsonData.text());
          setMetaIA(parsed);
        }
      } catch {
        // Sin metadatos IA previos
      }
    }
  }, [obraActual, fecha, supabase]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const guardarGrabacion = async (blob: Blob, extension: string, segundos: number) => {
    if (!obraActual) return;
    setSubiendo(true);
    setProcesandoIA(true);
    setError("");

    const path = `${obraActual.id}/${crypto.randomUUID()}.${extension}`;
    const { error: errorSubida } = await supabase.storage
      .from(BUCKET)
      .upload(path, blob, { contentType: blob.type || undefined });

    if (errorSubida) {
      setError(tr("No se pudo guardar el audio ({detalle}).", { detalle: errorSubida.message }));
      setSubiendo(false);
      setProcesandoIA(false);
      return;
    }

    // Procesar con IA (transcripción multilingüe, traducción y extracción de tareas)
    let metaResultado: MetaIA | null = null;
    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => resolve((reader.result as string).split(",")[1]);
        reader.readAsDataURL(blob);
      });
      const base64 = await base64Promise;

      const resIA = await fetch("/api/ia/audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audioBase64: base64, mimeType: blob.type }),
      });
      const dataIA = await resIA.json();
      if (dataIA.ok) {
        metaResultado = dataIA;
        // Guardar metadatos JSON junto al audio
        const jsonBlob = new Blob([JSON.stringify(dataIA)], { type: "application/json" });
        const jsonPath = path.replace(/\.[^.]+$/, ".json");
        await supabase.storage.from(BUCKET).upload(jsonPath, jsonBlob);
      }
    } catch (errIA) {
      console.error("Error al procesar audio con IA:", errIA);
    } finally {
      setProcesandoIA(false);
    }

    // Si ya había nota ese día, la sustituimos
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

    if (anterior) {
      await supabase.storage.from(BUCKET).remove([anterior]);
      await supabase.storage.from(BUCKET).remove([anterior.replace(/\.[^.]+$/, ".json")]);
    }
    setSubiendo(false);
    if (metaResultado) setMetaIA(metaResultado);
    await cargar();
  };

  const borrar = async () => {
    if (!nota) return;
    await supabase.storage.from(BUCKET).remove([nota.audio_path]);
    await supabase.storage.from(BUCKET).remove([nota.audio_path.replace(/\.[^.]+$/, ".json")]);
    await supabase.from("notas_audio").delete().eq("id", nota.id);
    await cargar();
  };

  if (!obraActual) return null;

  const esUcraniano = localeActual() === "uk-UA";
  const traduccionActiva = metaIA
    ? (esUcraniano ? metaIA.traduccion_uk : metaIA.traduccion_es) || metaIA.transcripcion
    : "";

  return (
    <div className="space-y-4">
      <DayNav fecha={fecha} onChange={setFecha} />

      <Card className="p-4 border-white/14 bg-[#141a16]/90 backdrop-blur-xl shadow-xl">
        {cargando ? (
          <div className="flex justify-center py-6">
            <Loader2 className="animate-spin text-[#d7dc9a]" size={22} />
          </div>
        ) : nota ? (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-[#d7dc9a] animate-pulse" />
                <span className="text-[12px] font-bold uppercase tracking-wider text-white/80">
                  {tr("Diario de obra con IA")}
                </span>
              </div>
              {nota.duracion_seg != null && (
                <div className="font-mono-obra text-xs text-[#d7dc9a] bg-[#d7dc9a]/10 border border-[#d7dc9a]/25 px-2 py-0.5 rounded-full">
                  {fmtDuracion(nota.duracion_seg)}
                </div>
              )}
            </div>

            {urlAudio ? (
              <audio controls src={urlAudio} className="w-full mb-3.5" />
            ) : (
              <div className="py-2 text-sm text-white/50">{tr("Cargando audio…")}</div>
            )}

            {/* Bloque de inteligencia artificial */}
            {metaIA && (
              <div className="space-y-3.5 rounded-2xl border border-white/10 bg-white/5 p-4 mb-4">
                {/* Resumen ejecutivo del día */}
                {metaIA.resumen_dia && (
                  <div>
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/50">
                      <Sparkles size={13} className="text-[#d7dc9a]" />
                      {tr("Resumen ejecutivo")}
                    </div>
                    <p className="mt-1 text-[13.5px] font-medium leading-relaxed text-white">
                      {metaIA.resumen_dia}
                    </p>
                  </div>
                )}

                {/* Etiquetas de acción extraídas por la IA */}
                <div className="grid gap-2 border-t border-white/10 pt-3">
                  {/* Para comprar */}
                  {metaIA.etiquetas.comprar.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="flex items-center gap-1 rounded-md bg-[#d7dc9a]/15 border border-[#d7dc9a]/30 px-2 py-0.5 text-[11px] font-bold text-[#d7dc9a]">
                        <ShoppingCart size={11} /> {tr("Para comprar")}:
                      </span>
                      {metaIA.etiquetas.comprar.map((item, idx) => (
                        <span key={idx} className="rounded-md bg-white/10 px-2 py-0.5 text-[12px] text-white">
                          {item}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Extra cliente (Claim) */}
                  {metaIA.etiquetas.extra_cliente.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="flex items-center gap-1 rounded-md bg-[#a7e8a4]/20 border border-[#a7e8a4]/40 px-2 py-0.5 text-[11px] font-bold text-[#a7e8a4]">
                        <Wallet size={11} /> {tr("Extra para cobrar")}:
                      </span>
                      {metaIA.etiquetas.extra_cliente.map((item, idx) => (
                        <span key={idx} className="rounded-md bg-[#a7e8a4]/10 px-2 py-0.5 text-[12px] text-[#ffdad2] font-semibold">
                          {item}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Incidencias / Bloqueos */}
                  {metaIA.etiquetas.incidencia.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="flex items-center gap-1 rounded-md bg-[#e0826d]/20 border border-[#e0826d]/40 px-2 py-0.5 text-[11px] font-bold text-[#e0826d]">
                        <AlertTriangle size={11} /> {tr("Incidencias")}:
                      </span>
                      {metaIA.etiquetas.incidencia.map((item, idx) => (
                        <span key={idx} className="rounded-md bg-[#e0826d]/10 px-2 py-0.5 text-[12px] text-[#ffdad2]">
                          {item}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Trabajos completados */}
                  {metaIA.etiquetas.progreso.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="flex items-center gap-1 rounded-md bg-white/10 px-2 py-0.5 text-[11px] font-bold text-white/70">
                        <CheckCircle2 size={11} /> {tr("Trabajos completados")}:
                      </span>
                      {metaIA.etiquetas.progreso.map((item, idx) => (
                        <span key={idx} className="rounded-md bg-white/5 px-2 py-0.5 text-[12px] text-white/90">
                          {item}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Transcripción y traducción */}
                <div className="border-t border-white/10 pt-3 text-[12.5px] space-y-2">
                  <div>
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-white/50">
                      <Globe size={12} className="text-[#d7dc9a]" />
                      {tr("Traducción automática")}
                    </div>
                    <p className="mt-0.5 text-white/90 italic">
                      «{traduccionActiva}»
                    </p>
                  </div>
                  {metaIA.transcripcion !== traduccionActiva && (
                    <div>
                      <div className="text-[10.5px] text-white/40">
                        {tr("Transcripción original")} ({metaIA.idioma_origen.toUpperCase()}):
                      </div>
                      <p className="text-white/60 text-[12px]">
                        «{metaIA.transcripcion}»
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="mt-4 space-y-2">
              <GrabadorAudio onGrabado={guardarGrabacion} disabled={subiendo} />
              {!confirmarBorrado ? (
                <GhostButton
                  onClick={() => setConfirmarBorrado(true)}
                  className="flex items-center justify-center gap-1.5 border-white/15 text-[#ffdad2] hover:bg-white/5"
                >
                  <Trash2 size={15} /> {tr("Eliminar nota")}
                </GhostButton>
              ) : (
                <div className="flex gap-2">
                  <GhostButton onClick={() => setConfirmarBorrado(false)}>{tr("Cancelar")}</GhostButton>
                  <GhostButton
                    onClick={borrar}
                    className="border-[#e0826d]/40 font-bold text-[#ffdad2] bg-[#e0826d]/20"
                  >
                    {tr("Confirmar borrado")}
                  </GhostButton>
                </div>
              )}
              <div className="text-center text-[11.5px] text-white/40">
                {tr("Si grabas otra vez, sustituye a esta nota")}
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-3 text-center text-[13.5px] text-white/70">
              {tr("Sin nota de voz el {fecha}. Cuenta qué se ha hecho hoy en la obra.", { fecha: fmtDate(fecha) })}
            </div>
            <GrabadorAudio onGrabado={guardarGrabacion} disabled={subiendo} />
          </div>
        )}

        {(subiendo || procesandoIA) && (
          <div className="mt-3 flex items-center justify-center gap-2 text-[13px] text-[#d7dc9a]">
            <Loader2 size={15} className="animate-spin" />
            {procesandoIA ? tr("Procesando audio con IA…") : tr("Guardando…")}
          </div>
        )}
        {error && <div className="mt-3 text-xs text-[#ffdad2]">{error}</div>}
      </Card>

      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/50">
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
              className={`flex items-center gap-3 rounded-2xl border p-3.5 text-left transition ${
                n.fecha === fecha
                  ? "border-[#d7dc9a] bg-[#d7dc9a]/10"
                  : "border-white/10 bg-[#141a16]/80 hover:bg-white/5"
              }`}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/5 text-[#d7dc9a] border border-white/10">
                <Mic size={16} />
              </div>
              <div className="min-w-0 flex-1 text-[14px] font-semibold text-white">
                {fmtDate(n.fecha)}
              </div>
              {n.duracion_seg != null && (
                <div className="font-mono-obra text-xs text-[#d7dc9a]">
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
