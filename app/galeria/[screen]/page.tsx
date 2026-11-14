"use client";

import { use, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Calendar, Clock, Laptop, Receipt, Smartphone, Tablet, Truck, Wallet } from "lucide-react";
import clsx from "clsx";
import { LandingMock } from "@/components/landing/LandingMock";
import { Gantt } from "@/components/planificacion/Gantt";
import { StampButton } from "@/components/ui/StampButton";
import { BarrasProgreso } from "@/components/ui/BarrasProgreso";
import { Card } from "@/components/ui/Card";
import { PrimaryButton, GhostButton } from "@/components/ui/Button";
import { SelectorIdioma } from "@/components/ui/SelectorIdioma";
import { Logo } from "@/components/ui/Logo";
import {
  OBRA_FIXTURE,
  TRABAJADORES_FIXTURE,
  TAREAS_FIXTURE,
  GASTOS_FIXTURE,
  VEHICULOS_FIXTURE,
  NOTAS_FIXTURE,
} from "@/lib/galeria-fixtures";
import { tr } from "@/lib/i18n";
import { useIdioma } from "@/lib/i18n/provider";
import { fmtEUR, fmtDate } from "@/lib/format";
import { LogIn, LogOut } from "lucide-react";

type ViewportWidth = 320 | 375 | 430 | 768 | 1280;

export default function GaleriaScreenPage({
  params,
}: {
  params: Promise<{ screen: string }>;
}) {
  const { screen } = use(params);
  const [viewport, setViewport] = useState<ViewportWidth>(375);
  const [rol, setRol] = useState<"dueno" | "manager" | "jefe_obra" | "trabajador">("dueno");
  const [estado, setEstado] = useState<"populated" | "empty">("populated");
  const { idioma, cambiarIdioma } = useIdioma();

  const viewports: { tag: string; width: ViewportWidth; icon: React.ReactNode }[] = [
    { tag: "320px (SE)", width: 320, icon: <Smartphone size={14} /> },
    { tag: "375px (Móvil)", width: 375, icon: <Smartphone size={15} /> },
    { tag: "430px (Max)", width: 430, icon: <Smartphone size={16} /> },
    { tag: "768px (Tablet)", width: 768, icon: <Tablet size={16} /> },
    { tag: "1280px (Escritorio)", width: 1280, icon: <Laptop size={16} /> },
  ];

  return (
    <div className="min-h-screen bg-[#101411] text-[#F7F9F5]">
      {/* Barra de control superior */}
      <header className="sticky top-0 z-50 flex flex-wrap items-center justify-between gap-3 border-b border-[#2E3831] bg-[#141915]/95 px-4 py-2.5 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Link
            href="/galeria"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#2E3831] bg-[#1E2520] text-[#A3B1A7] hover:text-white"
            title="Volver"
          >
            <ArrowLeft size={16} />
          </Link>
          <span className="font-display text-base font-bold uppercase tracking-wider text-white">
            {screen}
          </span>
        </div>

        {/* Selector de Viewports */}
        <div className="flex items-center gap-1 rounded-full border border-[#2E3831] bg-[#181E1A] p-1">
          {viewports.map((v) => (
            <button
              key={v.width}
              type="button"
              onClick={() => setViewport(v.width)}
              className={clsx(
                "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-mono transition-all",
                viewport === v.width
                  ? "bg-obra-yellow text-obra-yellow-ink font-bold shadow-xs"
                  : "text-[#A3B1A7] hover:text-white"
              )}
            >
              {v.icon}
              <span className="hidden sm:inline">{v.tag}</span>
              <span className="sm:hidden">{v.width}</span>
            </button>
          ))}
        </div>

        {/* Selectores de Idioma, Rol y Estado */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Idioma */}
          <div className="flex rounded-full border border-[#2E3831] bg-[#181E1A] p-0.5">
            {(["es", "uk", "en"] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => cambiarIdioma(l)}
                className={clsx(
                  "rounded-full px-2.5 py-1 text-xs font-bold uppercase font-mono transition-colors",
                  idioma === l ? "bg-obra-yellow text-obra-yellow-ink" : "text-[#A3B1A7]"
                )}
              >
                {l}
              </button>
            ))}
          </div>

          {/* Rol */}
          <select
            value={rol}
            onChange={(e) => setRol(e.target.value as "dueno" | "manager" | "jefe_obra" | "trabajador")}
            className="rounded-lg border border-[#2E3831] bg-[#181E1A] px-2.5 py-1 font-mono text-xs text-white"
          >
            <option value="dueno">Dueño</option>
            <option value="manager">Manager</option>
            <option value="jefe_obra">Jefe Obra</option>
            <option value="trabajador">Trabajador</option>
          </select>

          {/* Estado */}
          <button
            type="button"
            onClick={() => setEstado(estado === "populated" ? "empty" : "populated")}
            className="rounded-lg border border-[#2E3831] bg-[#181E1A] px-2.5 py-1 font-mono text-xs text-[#A3B1A7] hover:text-white"
          >
            {estado === "populated" ? "● Con datos" : "○ Vacío"}
          </button>
        </div>
      </header>

      {/* Contenedor del marco de pantalla simulado */}
      <main className="flex justify-center p-4 sm:p-8 overflow-x-auto">
        <div
          style={{ width: `${viewport}px` }}
          className={clsx(
            "min-h-[660px] overflow-hidden rounded-[28px] border-[5px] border-[#28312B] bg-obra-bg text-obra-text shadow-[0_25px_60px_rgba(0,0,0,0.5)] transition-all",
            viewport >= 768 ? "rounded-[18px]" : "rounded-[32px]"
          )}
        >
          {renderScreenContent(screen, { rol, estado, idioma })}
        </div>
      </main>
    </div>
  );
}

function renderScreenContent(
  screen: string,
  ctx: { rol: string; estado: string; idioma: string }
) {
  switch (screen) {
    case "landing":
      return <LandingMock />;

    case "login":
      return <GaleriaLoginMock />;

    case "alta":
      return <GaleriaAltaMock />;

    case "home-dueno":
      return <GaleriaHomeDuenoMock estado={ctx.estado} />;

    case "home-trabajador":
      return <GaleriaHomeTrabajadorMock estado={ctx.estado} />;

    case "fichajes":
      return <GaleriaFichajesMock rol={ctx.rol} estado={ctx.estado} />;

    case "gastos":
      return <GaleriaGastosMock estado={ctx.estado} />;

    case "dinero":
      return <GaleriaDineroMock rol={ctx.rol} estado={ctx.estado} />;

    case "planificacion":
      return <GaleriaPlanificacionMock estado={ctx.estado} />;

    case "vehiculos":
      return <GaleriaVehiculosMock estado={ctx.estado} />;

    case "notas":
      return <GaleriaNotasMock estado={ctx.estado} />;

    case "resumen":
      return <GaleriaResumenMock estado={ctx.estado} />;

    case "ajustes":
      return <GaleriaAjustesMock rol={ctx.rol} />;

    case "admin":
      return <GaleriaAdminMock />;

    default:
      return (
        <div className="p-8 text-center text-obra-text-dim">
          <p>Pantalla no encontrada en la galería.</p>
        </div>
      );
  }
}

function GaleriaLoginMock() {
  return (
    <div className="p-5 flex min-h-[600px] flex-col justify-between">
      <div className="-mx-5 flex items-center justify-center overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/hero-villa.png"
          alt="Villa Render"
          className="max-h-[190px] w-full object-contain object-bottom"
        />
      </div>
      <div className="rounded-[32px] border border-white/18 bg-[#60675d]/92 p-5 backdrop-blur-xl shadow-[0_18px_40px_rgba(0,0,0,0.3)]">
        <div className="text-center mb-4">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-obra-yellow font-bold">
            <Logo size={24} />
          </div>
          <h1 className="text-2xl font-bold text-white">Welcome</h1>
          <p className="text-xs text-white/75 mt-1">{tr("Inicia sesión para fichar, apuntar gastos y subir facturas")}</p>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-bold text-obra-text-dim">{tr("Correo")}</label>
            <input
              type="email"
              defaultValue="demo@obrasl.com"
              className="mt-1 w-full rounded-xl border border-white/16 bg-[#4b544d]/85 p-3 text-sm text-white"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-obra-text-dim">{tr("Contraseña")}</label>
            <input
              type="password"
              defaultValue="••••••••"
              className="mt-1 w-full rounded-xl border border-white/16 bg-[#4b544d]/85 p-3 text-sm text-white"
            />
          </div>
          <PrimaryButton>{tr("Entrar")}</PrimaryButton>
          <GhostButton>{tr("Crear cuenta")}</GhostButton>
        </div>
      </div>
    </div>
  );
}

function GaleriaAltaMock() {
  return (
    <div className="p-6 flex flex-col justify-center min-h-[600px]">
      <div className="text-center mb-5">
        <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-obra-yellow text-obra-yellow-ink font-bold">
          <Logo size={26} />
        </div>
        <h1 className="font-display text-2xl font-bold uppercase text-white">{tr("Crear mi empresa")}</h1>
        <p className="text-xs text-obra-text-faint mt-0.5">{tr("Cada código sirve una sola vez y crea una empresa nueva con 14 días de prueba. Se copia solo al crearlo.")}</p>
      </div>
      <div className="rounded-2xl border border-white/16 bg-[#5a655d]/90 p-5 shadow-md mb-4">
        <div className="text-xs font-bold uppercase text-obra-text-dim tracking-wider">{tr("La empresa")}</div>
        <div className="font-mono-obra text-3xl font-bold mt-1 text-white">49,00 € <span className="text-xs text-obra-text-faint font-normal">{tr("+1 mes")}</span></div>
        <ul className="mt-3 space-y-1.5 text-xs text-obra-text-dim">
          <li>✓ {tr("Todas las obras")}</li>
          <li>✓ {tr("Fichajes")}</li>
          <li>✓ {tr("Fichajes, gastos y facturas se organizan por obra.")}</li>
        </ul>
      </div>
      <PrimaryButton>{tr("Pagar con tarjeta")}</PrimaryButton>
    </div>
  );
}

function GaleriaHomeDuenoMock({ estado }: { estado: string }) {
  return (
    <div className="p-4 space-y-3.5">
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/avatar-alex.png" alt="Alex" className="h-9 w-9 rounded-xl border border-white/20 object-cover" />
          <div>
            <div className="font-bold text-sm text-white leading-tight">Morning Alex</div>
            <div className="text-[11px] text-white/75 truncate max-w-[180px]">{OBRA_FIXTURE.nombre}</div>
          </div>
        </div>
        <span className="font-mono text-xs bg-[#68746a]/85 border border-white/18 px-2.5 py-1.5 rounded-xl">🔔</span>
      </div>

      <div className="relative -mx-2 overflow-hidden">
        <div className="absolute right-2 top-2 z-10 rounded-xl border border-white/18 bg-[#556058]/90 px-2.5 py-1 text-[11px] font-semibold text-white">
          ● On Track
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/hero-construction.png" alt="Obra" className="mx-auto h-[170px] w-full object-contain object-bottom" />
      </div>

      <div className="relative z-10 -mt-5 rounded-[26px] border border-white/18 bg-[#68746a]/92 p-4 backdrop-blur-xl shadow-lg">
        <div className="flex justify-between items-start">
          <div>
            <div className="font-bold text-base text-white">{OBRA_FIXTURE.nombre}</div>
            <div className="text-xs text-white/75">{estado === "empty" ? tr("Todavía no hay tareas") : "85.706,00 €"}</div>
          </div>
          <span className="font-mono-obra font-bold text-lg text-[#d7dc9a]">
            {estado === "empty" ? "0%" : "64%"}
          </span>
        </div>
        <BarrasProgreso
          valores={estado === "empty" ? [0, 0] : [6, 9, 8, 7, 10, 9, 8, 10, 6, 3, 3, 3, 8, 9, 7]}
          porcentaje={estado === "empty" ? 0 : 64}
          className="mt-2 h-[78px]"
        />
      </div>

      <Card className="p-4">
        <div className="text-xs font-bold uppercase text-obra-text-dim tracking-wider mb-2">
          {tr("Dinero de la obra")}
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-[#4e5750] p-2 rounded-xl border border-white/12">
            <div className="text-[10.5px] uppercase font-bold text-obra-text-dim">{tr("Cobrado")}</div>
            <div className="font-mono-obra font-bold text-sm text-obra-green">{estado === "empty" ? "0 €" : "54.000 €"}</div>
          </div>
          <div className="bg-[#4e5750] p-2 rounded-xl border border-white/12">
            <div className="text-[10.5px] uppercase font-bold text-obra-text-dim">{tr("Gastado")}</div>
            <div className="font-mono-obra font-bold text-sm text-white">{estado === "empty" ? "0 €" : "31.420 €"}</div>
          </div>
          <div className="bg-[#4e5750] p-2 rounded-xl border border-white/12">
            <div className="text-[10.5px] uppercase font-bold text-obra-text-dim">{tr("Balance")}</div>
            <div className="font-mono-obra font-bold text-sm text-[#d7dc9a]">{estado === "empty" ? "0 €" : "+22.580 €"}</div>
          </div>
        </div>
      </Card>

      {/* Cápsula de navegación móvil inferior (Dribbble Ref) */}
      <div className="pt-2 flex justify-center pb-1">
        <div className="relative flex w-full max-w-[320px] items-center justify-around overflow-hidden rounded-[22px] border border-white/18 bg-[#68736b]/88 px-2 py-1.5 backdrop-blur-xl shadow-lg">
          <div
            className="pointer-events-none absolute inset-y-0 right-0 w-20 opacity-60"
            style={{
              background:
                "radial-gradient(circle at 85% 90%, rgba(224,130,109,0.55) 0%, transparent 72%)",
            }}
          />
          <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#49524b] text-white">
            <Clock size={18} />
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-[12px] text-white/80">
            <Receipt size={18} />
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-[12px] text-white/80">
            <Calendar size={18} />
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-[12px] text-white/80">
            <Truck size={18} />
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-[12px] text-white/80">
            <Wallet size={18} />
          </div>
        </div>
      </div>
    </div>
  );
}

function GaleriaHomeTrabajadorMock({ estado }: { estado: string }) {
  return (
    <div className="p-4 space-y-4">
      <div className="pb-2 border-b border-obra-line">
        <div className="text-xs text-obra-text-faint uppercase font-bold">{tr("Obra")}</div>
        <div className="font-bold text-base">{OBRA_FIXTURE.nombre}</div>
      </div>

      <Card className="p-4">
        <div className="text-xs font-bold uppercase text-obra-green tracking-wider mb-2">
          ● {tr("Ficha de trabajador")}
        </div>
        <div className="font-bold text-lg">Dmytro Kovalenko</div>
        <div className="text-xs text-obra-text-dim mb-4">{tr("Trabajador")}</div>

        <div className="grid grid-cols-2 gap-2.5">
          <StampButton
            label={tr("Entrada")}
            hora={estado === "empty" ? null : "08:02"}
            color="green"
            icon={LogIn}
            onClick={() => {}}
          />
          <StampButton
            label={tr("Salida")}
            hora={null}
            color="orange"
            icon={LogOut}
            onClick={() => {}}
            disabled={estado === "empty"}
          />
        </div>
      </Card>
    </div>
  );
}

function GaleriaFichajesMock({ rol }: { rol: string; estado: string }) {
  const puedeAnadir = rol === "dueno" || rol === "manager";
  return (
    <div className="p-4 space-y-3">
      <div className="flex justify-between items-center pb-2 border-b border-obra-line">
        <span className="font-bold text-base">{tr("Fichajes")}</span>
        <span className="font-mono text-xs bg-obra-yellow/20 text-obra-yellow-ink font-bold px-2 py-0.5 rounded-full">
          {TRABAJADORES_FIXTURE.length}
        </span>
      </div>

      <div className="space-y-2">
        {TRABAJADORES_FIXTURE.map((t) => (
          <Card key={t.id} className="p-3">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-bold text-sm">{t.nombre}</div>
                <div className="text-xs text-obra-text-faint">{t.activo ? "Activo" : ""}</div>
              </div>
              <span className="font-mono text-xs font-bold text-obra-green">08:00 → 17:00</span>
            </div>
          </Card>
        ))}
      </div>

      {puedeAnadir && (
        <GhostButton className="mt-3">+ {tr("Añadir trabajador")}</GhostButton>
      )}
    </div>
  );
}

function GaleriaGastosMock({ estado }: { estado: string }) {
  return (
    <div className="p-4 space-y-3">
      <div className="flex justify-between items-center pb-2 border-b border-obra-line">
        <span className="font-bold text-base">{tr("Gastos")}</span>
        <span className="font-mono font-bold text-sm">{estado === "empty" ? "0 €" : "1.648,05 €"}</span>
      </div>
      <div className="space-y-2">
        {GASTOS_FIXTURE.map((g) => (
          <Card key={g.id} className="p-3 flex justify-between items-center">
            <div>
              <div className="font-semibold text-sm">{g.concepto}</div>
              <div className="text-xs text-obra-text-faint">{g.proveedor} · {fmtDate(g.fecha)}</div>
            </div>
            <div className="font-mono font-bold text-sm">{fmtEUR(g.importe)}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function GaleriaDineroMock({ rol }: { rol: string; estado: string }) {
  const esDueno = rol === "dueno";
  return (
    <div className="p-4 space-y-3">
      <div className="font-bold text-base pb-2 border-b border-obra-line">{tr("Dinero de la obra")}</div>
      {esDueno ? (
        <Card className="p-4">
          <div className="text-xs font-bold uppercase text-obra-text-dim mb-1">{tr("Balance")}</div>
          <div className="font-mono text-2xl font-bold">+22.580,00 €</div>
        </Card>
      ) : (
        <Card className="p-4">
          <div className="text-xs font-bold uppercase text-obra-text-dim mb-1">{tr("Dinero para gastos")}</div>
          <div className="font-mono text-2xl font-bold text-obra-green">+1.180,40 €</div>
        </Card>
      )}
    </div>
  );
}

function GaleriaPlanificacionMock({ estado }: { estado: string }) {
  return (
    <div className="p-4 space-y-3">
      <div className="flex justify-between items-center pb-2 border-b border-obra-line">
        <div>
          <div className="font-bold text-base">{tr("Plan de la obra")}</div>
          <div className="text-xs text-obra-text-faint">{estado === "empty" ? "0% · 0 €" : "64% · 85.706,00 €"}</div>
        </div>
        <span className="font-mono text-xs bg-obra-slate text-obra-yellow px-2 py-1 rounded-md">Excel</span>
      </div>
      <Card className="p-3">
        {estado === "empty" ? (
          <div className="py-8 text-center text-xs text-obra-text-faint">{tr("Todavía no hay tareas")}</div>
        ) : (
          <Gantt tareas={TAREAS_FIXTURE.slice(0, 5)} hoy="2026-05-12" onTocar={() => {}} />
        )}
      </Card>
    </div>
  );
}

function GaleriaVehiculosMock({ estado }: { estado: string }) {
  const lista = estado === "empty" ? [] : VEHICULOS_FIXTURE;
  return (
    <div className="p-4 space-y-3">
      <div className="font-bold text-base pb-2 border-b border-obra-line">{tr("Vehículos")}</div>
      {lista.length === 0 ? (
        <div className="py-8 text-center text-xs text-obra-text-faint">{tr("Sin usar este día")}</div>
      ) : (
        <div className="space-y-2">
          {lista.map((v) => (
            <Card key={v.id} className="p-3 flex justify-between items-center">
              <div>
                <div className="font-bold text-sm">{v.nombre}</div>
                <div className="font-mono text-xs text-obra-text-faint">{v.activo ? "En servicio" : ""}</div>
              </div>
              <span className="bg-obra-green/10 text-obra-green text-xs font-bold px-2.5 py-1 rounded-full border border-obra-green/30">
                {tr("Sin usar este día")}
              </span>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function GaleriaNotasMock({ estado }: { estado: string }) {
  const lista = estado === "empty" ? [] : NOTAS_FIXTURE;
  return (
    <div className="p-4 space-y-3">
      <div className="font-bold text-base pb-2 border-b border-obra-line">{tr("Notas")}</div>
      {lista.length === 0 ? (
        <div className="py-8 text-center text-xs text-obra-text-faint">{tr("Notas")}</div>
      ) : (
        <div className="space-y-2">
          {lista.map((n) => (
            <Card key={n.id} className="p-3 flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-obra-yellow/20 text-obra-yellow-ink font-bold text-xs">
                  🎙️
                </span>
                <div>
                  <div className="font-bold text-sm">{fmtDate(n.fecha)}</div>
                  <div className="text-[11px] text-obra-text-faint">{n.duracion_seg ?? 0}s de audio</div>
                </div>
              </div>
              <span className="font-mono text-xs text-obra-accent-ink font-bold">▶ Reproducir</span>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function GaleriaResumenMock({ estado }: { estado: string }) {
  return (
    <div className="p-4 space-y-3">
      <div className="flex justify-between items-center pb-2 border-b border-obra-line">
        <span className="font-bold text-base">{tr("Resumen")}</span>
        <GhostButton className="w-auto px-3 py-1 text-xs">📥 {tr("Exportar a Excel")}</GhostButton>
      </div>
      <Card className="p-4">
        <div className="text-xs font-bold uppercase text-obra-text-dim mb-1">{tr("Total del mes")}</div>
        <div className="font-mono text-2xl font-bold">{estado === "empty" ? "0 €" : "14.280,50 €"}</div>
      </Card>
    </div>
  );
}

function GaleriaAjustesMock({ rol }: { rol: string }) {
  return (
    <div className="p-4 space-y-3">
      <div className="font-bold text-base pb-2 border-b border-obra-line">{tr("Ajustes")}</div>
      <Card className="p-3 space-y-2">
        <div className="text-xs font-bold uppercase text-obra-text-dim">{tr("Idioma")}</div>
        <SelectorIdioma />
      </Card>
      {rol === "dueno" && (
        <Card className="p-3">
          <div className="text-xs font-bold uppercase text-obra-text-dim">{tr("Soporte")}</div>
        </Card>
      )}
    </div>
  );
}

function GaleriaAdminMock() {
  return (
    <div className="p-4 space-y-3">
      <div className="font-bold text-base pb-2 border-b border-obra-line">{tr("Errores de la app")}</div>
      <div className="grid grid-cols-2 gap-2 text-center">
        <Card className="p-3">
          <div className="text-xs text-obra-text-faint">{tr("Todas las empresas")}</div>
          <div className="font-mono text-xl font-bold">12</div>
        </Card>
        <Card className="p-3">
          <div className="text-xs text-obra-text-faint">{tr("Códigos para empresas nuevas")}</div>
          <div className="font-mono text-xl font-bold">5</div>
        </Card>
      </div>
    </div>
  );
}
