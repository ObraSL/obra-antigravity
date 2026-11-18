"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Building2, LogIn, LogOut, MapPin, PenLine, UserX, WifiOff } from "lucide-react";
import { useObra } from "@/lib/obra-context";
import { useMiembro } from "@/lib/miembro-context";
import { createClient } from "@/lib/supabase/client";
import type { Fichaje, Transporte } from "@/lib/types";
import { esFalloDeRed, useFichajesPendientes } from "@/lib/offline-fichajes";
import { distanciaMetros, obtenerPosicion } from "@/lib/geo";
import { useEnRefresco } from "@/components/layout/PullToRefresh";
import { currentMonth, monthBounds, monthLabel, nowHHMM, todayStr } from "@/lib/format";
import { fmtHoras, minutosExtra, minutosTrabajados, totalesFichajes } from "@/lib/horas";
import { DayNav } from "@/components/ui/DayNav";
import { Card, HeroStatCard } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Field";
import { PrimaryButton } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { StampButton } from "@/components/ui/StampButton";
import { ObraPicker } from "@/components/layout/ObraPicker";
import { TransporteSelector } from "./TransporteSelector";
import { CalendarioMes } from "./CalendarioMes";
import { tr, trJsx } from "@/lib/i18n";

/**
 * Pantalla de fichaje de un trabajador: solo se ve a sí mismo, elige en qué
 * obra está y marca su entrada y su salida. No ve a nadie más.
 */
export function MiFichaje() {
  const { obraActual, jornadaHoras } = useObra();
  const { miembro, modulos } = useMiembro();
  const supabase = useMemo(() => createClient(), []);

  const hoy = todayStr();
  const [fecha, setFecha] = useState(hoy);
  const [mesFiltro, setMesFiltro] = useState(currentMonth());
  const [fichaje, setFichaje] = useState<Fichaje | null>(null);
  const [mes, setMes] = useState({ trabajados: 0, extra: 0 });
  const [fichajesDelMes, setFichajesDelMes] = useState<{ fecha: string; hora_entrada: string | null; hora_salida: string | null }[]>([]);
  const [cambiandoObra, setCambiandoObra] = useState(false);
  const [editandoTarea, setEditandoTarea] = useState(false);
  const [error, setError] = useState("");

  const trabajadorId = miembro?.trabajador_id ?? null;
  const esHoy = fecha === hoy;

  const diasFichados = useMemo(
    () => new Set(fichajesDelMes.filter((f) => f.hora_entrada).map((f) => f.fecha)),
    [fichajesDelMes]
  );
  const diasIncompletos = useMemo(
    () => new Set(fichajesDelMes.filter((f) => f.hora_entrada && !f.hora_salida).map((f) => f.fecha)),
    [fichajesDelMes]
  );

  const { pendientes, encolar } = useFichajesPendientes(supabase, (data) => {
    setFichaje((prev) => (prev && prev.id === data.id ? data : prev ?? data));
  });
  const pendienteEntrada = pendientes.some(
    (p) => p.trabajadorId === trabajadorId && p.fecha === fecha && p.campo === "hora_entrada"
  );
  const pendienteSalida = pendientes.some(
    (p) => p.trabajadorId === trabajadorId && p.fecha === fecha && p.campo === "hora_salida"
  );

  const cargar = useCallback(async () => {
    if (!obraActual || !trabajadorId) return;
    const { desde, hasta } = monthBounds(mesFiltro);

    const [delDia, delMes] = await Promise.all([
      supabase
        .from("fichajes")
        .select("*")
        .eq("obra_id", obraActual.id)
        .eq("trabajador_id", trabajadorId)
        .eq("fecha", fecha)
        .maybeSingle(),
      // Del mes cuentan TODAS las obras: puede haber estado en varias.
      supabase
        .from("fichajes")
        .select("fecha,hora_entrada,hora_salida")
        .eq("trabajador_id", trabajadorId)
        .gte("fecha", desde)
        .lt("fecha", hasta),
    ]);

    setFichaje((delDia.data as Fichaje) ?? null);
    const filasMes = (delMes.data as { fecha: string; hora_entrada: string | null; hora_salida: string | null }[]) ?? [];
    setFichajesDelMes(filasMes);
    const t = totalesFichajes(filasMes, jornadaHoras);
    setMes({ trabajados: t.trabajados, extra: t.extra });
  }, [obraActual, trabajadorId, fecha, mesFiltro, jornadaHoras, supabase]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  useEnRefresco(cargar);

  const guardar = async (campos: Partial<Fichaje>) => {
    if (!obraActual || !trabajadorId) return;
    setError("");
    // La hora que vale es la del servidor, no la del móvil: la base de datos
    // la cambia al guardar, y aquí se enseña lo que devuelve.
    const { data, error: err } = await supabase
      .from("fichajes")
      .upsert(
        { obra_id: obraActual.id, trabajador_id: trabajadorId, fecha, ...campos },
        { onConflict: "obra_id,trabajador_id,fecha" }
      )
      .select()
      .single();
    if (err) setError(err.message);
    if (data) setFichaje(data as Fichaje);
    await cargar();
  };

  /** Entrada/salida son aparte de "guardar": si no hay cobertura, no se
   *  pierde el toque — queda en cola y se envía solo en cuanto vuelva la
   *  señal, sin que el trabajador tenga que acordarse de reintentar. */
  const fichar = async (campo: "hora_entrada" | "hora_salida") => {
    if (!obraActual || !trabajadorId) return;
    setError("");
    const hora = nowHHMM();

    // Dentro/fuera del radio de la obra: no se guarda dónde está el móvil,
    // solo el resultado y la distancia. Si no hay ubicación puesta en la
    // obra, o no hay permiso/GPS, se ficha igual (esto informa, no bloquea).
    let ubicacionOk: boolean | null = null;
    let distancia: number | null = null;
    if (modulos.geolocalizacion && obraActual.lat != null && obraActual.lng != null) {
      const pos = await obtenerPosicion();
      if (pos) {
        distancia = distanciaMetros(obraActual.lat, obraActual.lng, pos.coords.latitude, pos.coords.longitude);
        ubicacionOk = distancia <= obraActual.radio_metros;
      }
    }

    const { data, error: err } = await supabase
      .from("fichajes")
      .upsert(
        {
          obra_id: obraActual.id,
          trabajador_id: trabajadorId,
          fecha,
          [campo]: hora,
          ubicacion_ok: ubicacionOk,
          distancia_metros: distancia,
        },
        { onConflict: "obra_id,trabajador_id,fecha" }
      )
      .select()
      .single();
    if (data) {
      setFichaje(data as Fichaje);
      await cargar();
      return;
    }
    if (esFalloDeRed(err)) {
      encolar({ obraId: obraActual.id, trabajadorId, fecha, campo, hora, ubicacionOk, distanciaMetros: distancia });
      return;
    }
    if (err) setError(err.message);
  };

  // Cuenta creada pero sin vincular todavía con su ficha de trabajador:
  // hasta que el dueño la enlace, no hay dónde apuntar las horas.
  if (!trabajadorId) {
    return (
      <div className="mx-auto max-w-sm px-1 py-14 text-center">
        <UserX size={30} className="mx-auto mb-2.5 text-obra-text-faint" />
        <div className="font-display text-xl font-bold uppercase text-obra-text">
          {tr("Falta un paso")}
        </div>
        <div className="mt-1 text-[13.5px] leading-relaxed text-obra-text-faint">
          {tr("El dueño todavía no ha enlazado tu cuenta con tu ficha de trabajador. En cuanto lo haga, podrás fichar tus horas desde aquí.")}
        </div>
      </div>
    );
  }

  const minutos = minutosTrabajados(fichaje?.hora_entrada, fichaje?.hora_salida);
  const extra = minutosExtra(minutos, jornadaHoras);

  return (
    <div>
      <HeroStatCard
        label={tr("Mis horas · {mes}", { mes: monthLabel(mesFiltro) })}
        value={fmtHoras(mes.trabajados)}
        sub={mes.extra > 0 ? tr("{horas} extra este mes", { horas: fmtHoras(mes.extra) }) : tr("Total del mes")}
      />

      <div className="mt-3.5">
        <CalendarioMes
          mes={mesFiltro}
          onMesChange={setMesFiltro}
          fechaSeleccionada={fecha}
          onSelectFecha={setFecha}
          diasFichados={diasFichados}
          diasIncompletos={diasIncompletos}
          totalHorasMes={fmtHoras(mes.trabajados)}
        />
      </div>

      <div className="mt-1">
        <DayNav fecha={fecha} onChange={setFecha} />
      </div>

      <button
        onClick={() => setCambiandoObra(true)}
        className="mb-3.5 flex w-full items-center gap-2 rounded-xl border border-obra-card-border bg-obra-card px-3.5 py-2.5 text-left"
      >
        <Building2 size={15} className="shrink-0 text-obra-yellow" />
        <span className="min-w-0 flex-1 truncate text-[13.5px] text-obra-text-dim">
          {tr("Estoy en")} <span className="font-bold text-obra-text">{obraActual?.nombre}</span>
        </span>
        <span className="shrink-0 text-xs font-semibold text-obra-yellow">{tr("Cambiar")}</span>
      </button>

      {error && (
        <div className="mb-3.5 rounded-xl bg-obra-red-bg px-3.5 py-3 text-[13px] text-obra-red-text">
          {error}
        </div>
      )}

      {(pendienteEntrada || pendienteSalida) && (
        <div className="mb-3.5 flex items-center gap-2 rounded-xl bg-obra-yellow/12 px-3.5 py-3 text-[13px] text-obra-yellow">
          <WifiOff size={15} className="shrink-0" />
          {tr("Sin conexión: tu fichaje está guardado en el móvil y se enviará solo en cuanto vuelva la señal.")}
        </div>
      )}

      <Card className="p-4">
        {minutos !== null && (
          <div className="mb-3 flex items-center gap-2 text-[13px]">
            <span className="font-mono-obra font-bold text-obra-text">{fmtHoras(minutos)}</span>
            {extra > 0 && (
              <span className="rounded-full bg-obra-yellow/12 px-2 py-0.5 text-[11px] font-bold text-obra-yellow">
                {tr("+{horas} extra", { horas: fmtHoras(extra) })}
              </span>
            )}
          </div>
        )}

        {/* Si el dueño le ha corregido las horas (o movido de obra), que lo
            vea: es lo justo. */}
        {(fichaje?.hora_corregida || fichaje?.confirmado_trabajador === false) && (
          <div className="mb-3">
            {fichaje.hora_corregida && (
              <div className="inline-flex items-center gap-1 rounded-full bg-obra-text-faint/15 px-2 py-0.5 text-[11px] font-semibold text-obra-text-dim">
                <PenLine size={11} /> {tr("Horas corregidas por el dueño")}
              </div>
            )}
            {!fichaje.confirmado_trabajador && (
              <div className="mt-2 rounded-xl bg-obra-yellow/12 px-3 py-2.5">
                <div className="mb-2 text-[12.5px] text-obra-text-dim">
                  {trJsx("Quedó así: {horas}. ¿Está bien?", {
                    horas: (
                      <span className="font-mono-obra font-bold text-obra-text">
                        {fichaje.hora_entrada ?? "—"} → {fichaje.hora_salida ?? "—"}
                      </span>
                    ),
                  })}
                </div>
                <button
                  onClick={() => guardar({ confirmado_trabajador: true })}
                  className="w-full rounded-lg bg-obra-yellow py-2 text-[12.5px] font-bold text-obra-bg"
                >
                  {tr("Confirmo")}
                </button>
              </div>
            )}
          </div>
        )}

        {esHoy ? (
          <div className="flex gap-2">
            <StampButton
              label={tr("Entrada")}
              hora={fichaje?.hora_entrada}
              color="green"
              icon={LogIn}
              onClick={() => fichar("hora_entrada")}
              pendiente={pendienteEntrada}
            />
            <StampButton
              label={tr("Salida")}
              hora={fichaje?.hora_salida}
              color="orange"
              icon={LogOut}
              onClick={() => fichar("hora_salida")}
              disabled={!fichaje?.hora_entrada && !pendienteEntrada}
              pendiente={pendienteSalida}
            />
          </div>
        ) : (
          <div className="flex gap-2 text-center">
            <HoraFija label={tr("Entrada")} hora={fichaje?.hora_entrada} />
            <HoraFija label={tr("Salida")} hora={fichaje?.hora_salida} />
          </div>
        )}

        <button
          onClick={() => esHoy && setEditandoTarea(true)}
          className={`mt-3 flex w-full items-center gap-1.5 text-[12.5px] ${
            fichaje?.ubicacion ? "text-obra-text" : "text-obra-text-faint"
          }`}
        >
          <MapPin size={13} className="shrink-0" />
          <span className="truncate">{fichaje?.ubicacion || tr("Añadir zona / tarea")}</span>
        </button>
      </Card>

      {esHoy && modulos.transporte && (
        <Card className="mt-3 p-4">
          <TransporteSelector
            transporte={fichaje?.transporte ?? null}
            traidoPor={fichaje?.traido_por ?? null}
            onGuardar={(transporte: Transporte, traidoPor) =>
              guardar({ transporte, traido_por: traidoPor })
            }
          />
        </Card>
      )}

      {!esHoy && (
        <div className="mt-3 text-center text-[12.5px] text-obra-text-faint">
          {tr("Solo puedes fichar el día de hoy. Si falta algo de otro día, díselo al jefe.")}
        </div>
      )}

      {cambiandoObra && (
        <Sheet title={tr("¿En qué obra estás?")} onClose={() => setCambiandoObra(false)}>
          <ObraPicker onDone={() => setCambiandoObra(false)} />
        </Sheet>
      )}

      {editandoTarea && (
        <Sheet title={tr("Zona / tarea")} onClose={() => setEditandoTarea(false)}>
          <TareaForm
            valorInicial={fichaje?.ubicacion ?? ""}
            onGuardar={(v) => {
              guardar({ ubicacion: v });
              setEditandoTarea(false);
            }}
          />
        </Sheet>
      )}
    </div>
  );
}

function HoraFija({ label, hora }: { label: string; hora: string | null | undefined }) {
  return (
    <div className="flex-1 rounded-xl border border-obra-card-border bg-obra-bg py-2.5">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-obra-text-faint">
        {label}
      </div>
      <div className="font-mono-obra text-lg font-bold text-obra-text">{hora || "—"}</div>
    </div>
  );
}

function TareaForm({
  valorInicial,
  onGuardar,
}: {
  valorInicial: string;
  onGuardar: (v: string) => void;
}) {
  const [v, setV] = useState(valorInicial);
  return (
    <div>
      <Field label={tr("¿Dónde has trabajado hoy?")}>
        <Input
          autoFocus
          value={v}
          onChange={(e) => setV(e.target.value)}
          placeholder={tr("Ej. Planta 2 — tabiquería")}
        />
      </Field>
      <PrimaryButton onClick={() => onGuardar(v.trim())}>{tr("Guardar")}</PrimaryButton>
    </div>
  );
}
