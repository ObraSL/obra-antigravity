"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Bug, Building2, Check, Copy, KeyRound, Loader2, Users, Wrench } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { CodigoAlta, EmpresaAdmin, ErrorApp } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Empty } from "@/components/ui/Empty";
import { GhostButton, PrimaryButton } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { localeActual, tr, trN } from "@/lib/i18n";

const fecha = (iso: string) => new Date(iso).toLocaleDateString(localeActual());

/** Estado de la suscripción de una empresa, en una palabra + color. */
function estadoSuscripcion(e: EmpresaAdmin): { texto: string; clase: string } {
  if (e.bloqueada) return { texto: tr("Bloqueada"), clase: "text-obra-red-text" };
  if (!e.activa_hasta) return { texto: tr("Sin caducidad"), clase: "text-obra-green" };
  const dias = Math.ceil((new Date(e.activa_hasta).getTime() - Date.now()) / 86_400_000);
  if (dias <= 0) return { texto: tr("Caducada el {fecha}", { fecha: fecha(e.activa_hasta) }), clase: "text-obra-red-text" };
  return { texto: tr("Activa hasta {fecha} ({dias} d)", { fecha: fecha(e.activa_hasta), dias }), clase: "text-obra-yellow" };
}

export default function AdminEmpresasPage() {
  const supabase = useMemo(() => createClient(), []);
  const [empresas, setEmpresas] = useState<EmpresaAdmin[]>([]);
  const [codigos, setCodigos] = useState<CodigoAlta[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errores, setErrores] = useState<ErrorApp[]>([]);
  const [abierto, setAbierto] = useState<number | null>(null);
  const [nota, setNota] = useState("");
  const [creando, setCreando] = useState(false);
  const [copiado, setCopiado] = useState<string | null>(null);
  const [error, setError] = useState("");

  const cargar = useCallback(async () => {
    const [a, b, c] = await Promise.all([
      supabase.rpc("listar_empresas_admin"),
      supabase.rpc("listar_codigos_alta"),
      supabase.rpc("listar_errores_admin", { p_limite: 100 }),
    ]);
    setEmpresas((a.data as EmpresaAdmin[]) ?? []);
    setCodigos((b.data as CodigoAlta[]) ?? []);
    setErrores((c.data as ErrorApp[]) ?? []);
    setCargando(false);
  }, [supabase]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const copiar = async (texto: string) => {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(texto);
      setTimeout(() => setCopiado((c) => (c === texto ? null : c)), 2000);
    } catch {
      /* sin portapapeles: el código se ve en pantalla y se puede copiar a mano */
    }
  };

  const crearCodigo = async () => {
    setCreando(true);
    setError("");
    const { data, error } = await supabase.rpc("crear_codigo_alta", { p_nota: nota });
    if (error || !data) {
      setError(tr("No se pudo crear el código. Inténtalo otra vez."));
    } else {
      setNota("");
      await copiar(data as string);
      await cargar();
    }
    setCreando(false);
  };

  const cancelar = async (id: string) => {
    await supabase.rpc("cancelar_codigo_alta", { p_id: id });
    await cargar();
  };

  const ponerSuscripcion = async (e: EmpresaAdmin, hasta: string | null, bloqueada: boolean) => {
    await supabase.rpc("establecer_suscripcion", {
      p_empresa: e.id,
      p_activa_hasta: hasta,
      p_bloqueada: bloqueada,
    });
    await cargar();
  };

  /** Suma 1 mes a la fecha de caducidad (o a hoy si ya caducó o no tenía). */
  const renovarMes = (e: EmpresaAdmin) => {
    const hoy = new Date();
    const base = e.activa_hasta && new Date(e.activa_hasta) > hoy ? new Date(e.activa_hasta) : hoy;
    base.setMonth(base.getMonth() + 1);
    return ponerSuscripcion(e, base.toISOString(), false);
  };

  if (cargando) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="animate-spin text-obra-yellow" size={24} />
      </div>
    );
  }

  const libres = codigos.filter((c) => c.estado === "libre");
  const otros = codigos.filter((c) => c.estado !== "libre");

  return (
    <div>
      <div className="mb-5">
        <div className="font-display text-2xl font-bold uppercase text-obra-text">
          {tr("Todas las empresas")}
        </div>
        <div className="text-sm text-obra-text-faint">
          {trN(empresas.length, "{n} empresa registrada", "{n} empresas registradas")}
        </div>
      </div>

      {empresas.length === 0 ? (
        <Empty icon={Building2} title={tr("Todavía no hay ninguna")} sub={tr("Aparecerán aquí en cuanto alguien se registre.")} />
      ) : (
        <div className="flex flex-col gap-2.5">
          {empresas.map((e) => {
            const est = estadoSuscripcion(e);
            return (
              <Card key={e.id} className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-[15px] font-bold text-obra-text">{e.nombre}</div>
                  <div className="shrink-0 text-[11.5px] text-obra-text-faint">{fecha(e.created_at)}</div>
                </div>
                <div className="mt-2 flex items-center gap-4 text-[12.5px] text-obra-text-faint">
                  <span className="flex items-center gap-1">
                    <Users size={13} /> {e.miembros_count}
                  </span>
                  <span className="flex items-center gap-1">
                    <Wrench size={13} /> {e.obras_count}
                  </span>
                  <span className="ml-auto font-mono-obra text-[11.5px]">{e.codigo}</span>
                </div>
                <div className="mt-2 text-[12.5px]">
                  <span className={`font-semibold ${est.clase}`}>{est.texto}</span>
                  <span className="ml-2 text-obra-text-faint">
                    {e.codigo_alta ? tr("Alta: {codigo}", { codigo: e.codigo_alta }) : tr("Sin código de alta")}
                  </span>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => renovarMes(e)}
                    className="rounded-lg border border-obra-line px-3 py-1.5 text-[12.5px] font-semibold text-obra-text-dim"
                  >
                    {tr("+1 mes")}
                  </button>
                  {e.bloqueada ? (
                    <button
                      onClick={() => ponerSuscripcion(e, e.activa_hasta, false)}
                      className="rounded-lg border border-obra-line px-3 py-1.5 text-[12.5px] font-semibold text-obra-text-dim"
                    >
                      {tr("Desbloquear")}
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        if (confirm(tr("¿Bloquear el acceso de «{empresa}»? No se borra nada.", { empresa: e.nombre })))
                          ponerSuscripcion(e, e.activa_hasta, true);
                      }}
                      className="rounded-lg border border-obra-line px-3 py-1.5 text-[12.5px] font-semibold text-obra-red-text"
                    >
                      {tr("Bloquear")}
                    </button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <div className="mb-3 mt-9 flex items-center gap-2">
        <KeyRound size={16} className="text-obra-yellow" />
        <div className="font-display text-xl font-bold uppercase text-obra-text">
          {tr("Códigos para empresas nuevas")}
        </div>
      </div>
      <p className="mb-3 text-[13px] text-obra-text-faint">
        {tr("Cada código sirve una sola vez y crea una empresa nueva con 14 días de prueba. Se copia solo al crearlo.")}
      </p>

      <Card className="mb-3 p-4">
        <Input
          value={nota}
          onChange={(e) => setNota(e.target.value)}
          placeholder={tr("Nota (ej. para quién es) — opcional")}
        />
        <PrimaryButton className="mt-3" onClick={crearCodigo} disabled={creando}>
          {creando && <Loader2 size={16} className="animate-spin" />}
          {tr("Crear código nuevo")}
        </PrimaryButton>
        {error && <div className="mt-2 text-sm text-obra-red-text">{error}</div>}
      </Card>

      <div className="flex flex-col gap-2">
        {libres.map((c) => (
          <Card key={c.id} className="flex items-center gap-3 p-3.5">
            <div className="min-w-0 flex-1">
              <div className="font-mono-obra text-[15px] font-bold tracking-wide text-obra-text">{c.codigo}</div>
              <div className="truncate text-[12px] text-obra-text-faint">
                {c.pagado ? `${tr("Tarjeta")} · ${c.email ?? ""} · ` : c.nota ? `${c.nota} · ` : ""}
                {tr("creado {fecha}", { fecha: fecha(c.creado_en) })}
              </div>
            </div>
            <button
              onClick={() => copiar(c.codigo)}
              className="flex items-center gap-1 rounded-lg border border-obra-line px-2.5 py-1.5 text-[12.5px] font-semibold text-obra-text-dim"
            >
              {copiado === c.codigo ? <Check size={14} /> : <Copy size={14} />}
              {copiado === c.codigo ? tr("Copiado") : tr("Copiar")}
            </button>
            <button
              onClick={() => {
                if (confirm(tr("¿Cancelar este código? Ya no se podrá usar."))) cancelar(c.id);
              }}
              className="text-[12.5px] font-semibold text-obra-red-text"
            >
              {tr("Cancelar")}
            </button>
          </Card>
        ))}
        {libres.length === 0 && (
          <div className="text-[13px] text-obra-text-faint">{tr("No hay códigos sin usar.")}</div>
        )}
      </div>

      {otros.length > 0 && (
        <>
          <div className="mb-2 mt-6 text-[12px] font-semibold uppercase tracking-wide text-obra-text-faint">
            {tr("Usados y cancelados")}
          </div>
          <div className="flex flex-col gap-1.5">
            {otros.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-2 text-[12.5px] text-obra-text-faint">
                <span className="font-mono-obra">
                  {c.codigo}
                  {c.pagado ? tr(" · tarjeta") : ""}
                </span>
                <span className="truncate text-right">
                  {c.estado === "usado"
                    ? `→ ${c.empresa_nombre ?? tr("(empresa borrada)")} · ${c.usado_en ? fecha(c.usado_en) : ""}`
                    : tr("cancelado")}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
      <div className="mb-3 mt-9 flex items-center gap-2">
        <Bug size={16} className="text-obra-yellow" />
        <div className="font-display text-xl font-bold uppercase text-obra-text">{tr("Errores de la app")}</div>
      </div>
      <p className="mb-3 text-[13px] text-obra-text-faint">
        {tr("Los fallos que les salen a los usuarios, del móvil y del servidor. Se borran solos a los 90 días.")}
      </p>
      {errores.length === 0 ? (
        <div className="text-[13px] text-obra-text-faint">{tr("Ningún error registrado.")}</div>
      ) : (
        <>
          <div className="flex flex-col gap-1.5">
            {errores.map((e) => (
              <button
                key={e.id}
                onClick={() => setAbierto(abierto === e.id ? null : e.id)}
                className="rounded-xl border border-obra-card-border bg-obra-card px-3 py-2.5 text-left"
              >
                <div className="flex items-center justify-between gap-2 text-[11.5px] text-obra-text-faint">
                  <span>
                    {new Date(e.creado_en).toLocaleString(localeActual())} ·{" "}
                    {e.origen === "servidor" ? tr("servidor") : tr("móvil / navegador")}
                  </span>
                  <span className="truncate">{e.empresa ?? e.email ?? ""}</span>
                </div>
                <div className="mt-0.5 line-clamp-2 text-[13px] font-semibold text-obra-text">{e.mensaje}</div>
                {e.ruta && <div className="truncate font-mono-obra text-[11px] text-obra-text-faint">{e.ruta}</div>}
                {abierto === e.id && (
                  <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap break-all rounded-lg bg-obra-bg p-2 text-[10.5px] text-obra-text-dim">
                    {[e.email, e.navegador, e.detalle].filter(Boolean).join("\n\n")}
                  </pre>
                )}
              </button>
            ))}
          </div>
          <button
            onClick={async () => {
              if (!confirm(tr("¿Borrar todos los errores de la lista?"))) return;
              await supabase.rpc("borrar_errores_admin");
              await cargar();
            }}
            className="mt-3 text-[12.5px] font-semibold text-obra-red-text"
          >
            {tr("Vaciar la lista")}
          </button>
        </>
      )}

      <GhostButton className="mt-8" onClick={cargar}>
        {tr("Actualizar")}
      </GhostButton>
    </div>
  );
}
