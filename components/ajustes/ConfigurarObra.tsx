"use client";

import { useState } from "react";
import { Loader2, MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { obtenerPosicion } from "@/lib/geo";
import type { Obra } from "@/lib/types";
import { Field, Input } from "@/components/ui/Field";
import { GhostButton, PrimaryButton } from "@/components/ui/Button";
import { tr } from "@/lib/i18n";

/**
 * Ubicación y horario de la obra: de aquí salen el radio (dentro/fuera al
 * fichar) y la hora mínima para fichar la entrada. Se piensa pensada para
 * rellenarse estando en la propia obra, tocando "Usar mi ubicación actual".
 */
export function ConfigurarObra({
  obra,
  onGuardado,
}: {
  obra: Obra;
  onGuardado: (o: Obra) => void;
}) {
  const [lat, setLat] = useState<number | null>(obra.lat);
  const [lng, setLng] = useState<number | null>(obra.lng);
  const [radio, setRadio] = useState(String(obra.radio_metros));
  const [horaInicio, setHoraInicio] = useState(obra.hora_inicio_turno ?? "");
  const [minutosAntes, setMinutosAntes] = useState(String(obra.minutos_antes_permitidos));
  const [buscandoGps, setBuscandoGps] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const usarMiUbicacion = async () => {
    setBuscandoGps(true);
    setError("");
    const pos = await obtenerPosicion();
    setBuscandoGps(false);
    if (!pos) {
      setError(tr("No se pudo obtener la ubicación. Revisa el permiso de ubicación del navegador."));
      return;
    }
    setLat(pos.coords.latitude);
    setLng(pos.coords.longitude);
  };

  const guardar = async () => {
    setGuardando(true);
    setError("");
    const supabase = createClient();
    const { data, error: err } = await supabase
      .from("obras")
      .update({
        lat,
        lng,
        radio_metros: Number(radio) || 150,
        hora_inicio_turno: horaInicio || null,
        minutos_antes_permitidos: Number(minutosAntes) || 0,
      })
      .eq("id", obra.id)
      .select()
      .single();
    setGuardando(false);
    if (err || !data) {
      setError(err?.message ?? tr("No se pudo guardar."));
      return;
    }
    onGuardado(data as Obra);
  };

  return (
    <div>
      <div className="mb-3.5 text-[13px] leading-relaxed text-obra-text-faint">
        {tr("Esto es opcional: sin ubicación puesta, fichar funciona igual, solo que sin el aviso de «dentro/fuera de la obra». Sin hora de inicio, tampoco hay límite de cuándo se puede fichar la entrada.")}
      </div>

      <Field label={tr("Ubicación de la obra")}>
        {lat != null && lng != null ? (
          <div className="mb-2 text-[13px] text-obra-text-dim">
            {tr("Puesta ({lat}, {lng})", { lat: lat.toFixed(5), lng: lng.toFixed(5) })}
          </div>
        ) : (
          <div className="mb-2 text-[13px] text-obra-text-faint">{tr("Todavía sin poner.")}</div>
        )}
        <GhostButton onClick={usarMiUbicacion} disabled={buscandoGps} className="flex items-center justify-center gap-1.5">
          {buscandoGps ? <Loader2 size={15} className="animate-spin" /> : <MapPin size={15} />}
          {tr("Usar mi ubicación actual")}
        </GhostButton>
      </Field>

      <Field label={tr("Radio que cuenta como «dentro de la obra» (metros)")}>
        <Input type="number" inputMode="numeric" min={20} step="10" value={radio} onChange={(e) => setRadio(e.target.value)} />
      </Field>

      <Field label={tr("Hora de inicio del turno (opcional)")}>
        <Input type="time" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} />
      </Field>

      {horaInicio && (
        <Field label={tr("Minutos antes que se puede fichar la entrada")}>
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            step="5"
            value={minutosAntes}
            onChange={(e) => setMinutosAntes(e.target.value)}
          />
        </Field>
      )}

      {error && <div className="mb-3.5 text-[13px] text-obra-red-text">{error}</div>}

      <PrimaryButton disabled={guardando} onClick={guardar}>
        {guardando && <Loader2 size={16} className="animate-spin" />} {tr("Guardar")}
      </PrimaryButton>
    </div>
  );
}
