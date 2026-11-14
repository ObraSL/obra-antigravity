"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { ArrowLeft, ExternalLink, RefreshCw, Smartphone } from "lucide-react";
import clsx from "clsx";

/**
 * Інтерактивний телефон на комп'ютері:
 * Повноцінна робоча копія додатку всередині рамки реального смартфона (iframe).
 * Усі кнопки перемикаються наживо, переходи між екранами працюють,
 * нижнє меню активне, дані завантажуються в реальному часі.
 */
const MODELOS = [
  { id: "15", nombre: "iPhone 15 / 16", w: 393, h: 852 },
  { id: "max", nombre: "iPhone Pro Max", w: 430, h: 932 },
  { id: "se", nombre: "iPhone SE", w: 375, h: 667 },
  { id: "android", nombre: "Google Pixel / Android", w: 412, h: 915 },
] as const;

const PANTALLAS = [
  { id: "home", nombre: "Головна", ruta: "/login?demo=1" },
  { id: "plan", nombre: "План (Gantt)", ruta: "/planificacion" },
  { id: "gastos", nombre: "Витрати", ruta: "/gastos" },
  { id: "fichajes", nombre: "Фіксація (Fichajes)", ruta: "/fichajes" },
  { id: "login", nombre: "Екран входу", ruta: "/login" },
] as const;

const BISEL = 14;
const TOPE = 36;

const suscribir = (cb: () => void) => {
  window.addEventListener("resize", cb);
  return () => window.removeEventListener("resize", cb);
};
const medidas = () => `${window.innerWidth}x${window.innerHeight}`;

export default function GaleriaMovilPage() {
  const [modelo, setModelo] = useState<(typeof MODELOS)[number]>(MODELOS[1]); // За замовчуванням iPhone Pro Max
  const [pantallaActual, setPantallaActual] = useState<string>(PANTALLAS[0].ruta);
  const [recarga, setRecarga] = useState(0);

  const ventana = useSyncExternalStore(suscribir, medidas, () => "1280x800");
  const [ancho, alto] = ventana.split("x").map(Number);

  const totalW = modelo.w + BISEL * 2;
  const totalH = modelo.h + BISEL + TOPE;
  const escala = Math.max(0.4, Math.min(1, (alto - 190) / totalH, (ancho - 32) / totalW));

  const cambiarRuta = (ruta: string) => {
    setPantallaActual(ruta);
    setRecarga((v) => v + 1);
  };

  return (
    <main className="flex min-h-[100dvh] flex-col items-center bg-[#121613] px-3 pb-8 pt-4 text-white">
      {/* Шапка панелі керування */}
      <div className="flex w-full max-w-5xl items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex items-center gap-3">
          <Link
            href="/galeria"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/14 bg-white/10 text-white/80 transition hover:bg-white/15 hover:text-white"
            title="Назад до галереї"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-base font-bold text-white flex items-center gap-2">
              <Smartphone size={17} className="text-[#d7dc9a]" />
              <span>Інтерактивний телефон (Живий клікабельний симулятор)</span>
            </h1>
            <p className="text-xs text-white/60">
              Повний функціонал: тицяй мишкою по кнопках, перемикай екрани, відкривай форми.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setRecarga((v) => v + 1)}
            className="flex h-9 items-center gap-1.5 rounded-xl border border-white/14 bg-white/10 px-3 text-xs font-semibold text-white/90 hover:bg-white/15 active:scale-95"
          >
            <RefreshCw size={13} />
            <span>Оновити</span>
          </button>
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="flex h-9 items-center gap-1.5 rounded-xl bg-[#d7dc9a] px-3 text-xs font-bold text-[#141814] shadow-xs hover:brightness-105 active:scale-95"
          >
            <span>В новій вкладці</span>
            <ExternalLink size={13} />
          </a>
        </div>
      </div>

      {/* Панель вибору смартфона та швидких переходів */}
      <div className="mt-3 flex w-full max-w-5xl flex-wrap items-center justify-between gap-2">
        {/* Вибір моделі пристрою */}
        <div className="flex items-center gap-1 rounded-2xl border border-white/12 bg-[#1c221e]/90 p-1">
          {MODELOS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setModelo(m)}
              className={clsx(
                "rounded-xl px-3 py-1.5 text-xs font-semibold transition-all",
                modelo.id === m.id
                  ? "bg-[#d7dc9a] text-[#141814] font-bold shadow-xs"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              )}
            >
              {m.nombre} <span className="font-mono text-[10px] opacity-75">{m.w}×{m.h}</span>
            </button>
          ))}
        </div>

        {/* Швидкі переходи по розділах */}
        <div className="flex items-center gap-1 rounded-2xl border border-white/12 bg-[#1c221e]/90 p-1">
          {PANTALLAS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => cambiarRuta(p.ruta)}
              className={clsx(
                "rounded-xl px-3 py-1.5 text-xs font-medium transition-all",
                pantallaActual === p.ruta
                  ? "bg-white/20 text-white font-bold"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              )}
            >
              {p.nombre}
            </button>
          ))}
        </div>
      </div>

      {/* Корпус смартфона з екраном (iframe) */}
      <div
        className="mt-4 flex items-center justify-center"
        style={{ width: totalW * escala, height: totalH * escala }}
      >
        <div
          style={{
            width: totalW,
            height: totalH,
            transform: `scale(${escala})`,
            transformOrigin: "top left",
            padding: `${TOPE}px ${BISEL}px ${BISEL}px`,
            background: "#0d100e",
            borderRadius: 54,
            boxShadow:
              "0 0 0 3px #2d352f, 0 0 0 5px #181d1a, 0 35px 80px -15px rgba(0,0,0,0.85), inset 0 2px 4px rgba(255,255,255,0.15)",
            position: "relative",
          }}
        >
          {/* Dynamic Island / Острівець камери */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              top: 14,
              left: "50%",
              width: 90,
              height: 18,
              marginLeft: -45,
              borderRadius: 20,
              background: "#050605",
              boxShadow: "inset 0 1px 1px rgba(255,255,255,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              paddingRight: 10,
              zIndex: 30,
            }}
          >
            {/* Лінза селфі-камери */}
            <span
              style={{
                width: 9,
                height: 9,
                borderRadius: "50%",
                background: "#0c1815",
                border: "1px solid rgba(255,255,255,0.15)",
                display: "block",
              }}
            />
          </div>

          {/* Живий iframe додатку з повною підтримкою кліків та переходів */}
          <iframe
            key={`${modelo.id}-${recarga}-${pantallaActual}`}
            src={pantallaActual}
            title="Control de Obra Mobile Interactive Frame"
            style={{
              width: modelo.w,
              height: modelo.h,
              border: 0,
              borderRadius: 40,
              background: "#737f73",
              display: "block",
              overflow: "hidden",
            }}
          />
        </div>
      </div>
    </main>
  );
}
