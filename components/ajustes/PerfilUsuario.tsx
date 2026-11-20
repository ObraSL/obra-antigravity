"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Check, Loader2, User, UserCheck } from "lucide-react";
import { useMiembro } from "@/lib/miembro-context";
import { ROLES } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Field";
import { PrimaryButton } from "@/components/ui/Button";
import { tr } from "@/lib/i18n";

export function PerfilUsuario() {
  const { miembro, guardarNombre } = useMiembro();
  const [nombre, setNombre] = useState(miembro?.nombre || "");
  const [guardandoNombre, setGuardandoNombre] = useState(false);
  const [nombreGuardado, setNombreGuardado] = useState(false);
  const [errorNombre, setErrorNombre] = useState("");

  const [avatar, setAvatar] = useState<string>("/avatar-alex.png");
  const [cargandoFoto, setCargandoFoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (miembro?.nombre) setNombre(miembro.nombre);
    const guardado = localStorage.getItem("obra_user_avatar");
    if (guardado) setAvatar(guardado);
  }, [miembro?.nombre]);

  const handleGuardarNombre = async () => {
    if (!nombre.trim() || nombre.trim() === miembro?.nombre) return;
    setGuardandoNombre(true);
    setErrorNombre("");
    const err = await guardarNombre(nombre.trim());
    setGuardandoNombre(false);
    if (err) {
      setErrorNombre(err);
    } else {
      setNombreGuardado(true);
      setTimeout(() => setNombreGuardado(false), 2500);
    }
  };

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCargandoFoto(true);
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setAvatar(dataUrl);
      localStorage.setItem("obra_user_avatar", dataUrl);
      window.dispatchEvent(new Event("obra_avatar_changed"));
      setCargandoFoto(false);
    };
    reader.readAsDataURL(file);
  };

  const rolInfo = ROLES.find((r) => r.id === miembro?.rol);

  return (
    <Card className="mb-7 p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
        {/* Avatar con botón de cambio */}
        <div className="relative group shrink-0">
          <div className="relative h-20 w-20 overflow-hidden rounded-2xl border-2 border-white/20 bg-[#141915] shadow-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={avatar}
              alt={nombre || "Usuario"}
              className="h-full w-full object-cover"
            />
            {cargandoFoto && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                <Loader2 size={18} className="animate-spin text-[#d7dc9a]" />
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            aria-label={tr("Cambiar foto")}
            className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border border-white/20 bg-[#d7dc9a] text-[#1e2520] shadow-md transition hover:scale-105 active:scale-95"
          >
            <Camera size={13} strokeWidth={2.5} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFotoChange}
            className="hidden"
          />
        </div>

        {/* Datos y edición de Nombre y Apellidos */}
        <div className="flex-1 w-full space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-xs text-white/50">{miembro?.email}</div>
              <div className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/5 px-2.5 py-0.5 text-[11px] font-bold uppercase text-[#d7dc9a]">
                <UserCheck size={11} />
                <span>{tr(rolInfo?.label ?? "")}</span>
              </div>
            </div>
          </div>

          <div className="space-y-1.5 pt-1">
            <label className="text-[11.5px] font-semibold text-white/70 uppercase tracking-wider">
              {tr("Nombre y apellidos")}
            </label>
            <div className="flex items-center gap-2">
              <Input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder={tr("Tu nombre")}
                className="flex-1 text-sm bg-black/30 border-white/15"
              />
              <button
                type="button"
                onClick={handleGuardarNombre}
                disabled={guardandoNombre || !nombre.trim() || nombre.trim() === miembro?.nombre}
                className="flex h-[38px] shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[#d7dc9a] px-3.5 text-xs font-bold text-[#1e2520] transition hover:bg-[#c8cd8b] disabled:opacity-30 disabled:cursor-not-allowed shadow-md"
              >
                {guardandoNombre ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : nombreGuardado ? (
                  <>
                    <Check size={13} strokeWidth={2.5} />
                    <span>{tr("Guardado")}</span>
                  </>
                ) : (
                  <span>{tr("Guardar")}</span>
                )}
              </button>
            </div>
            {errorNombre && (
              <div className="text-xs text-red-400 mt-1">{errorNombre}</div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
