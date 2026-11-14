"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import type { Proveedor } from "@/lib/types";
import { Input, Select } from "@/components/ui/Field";
import { tr } from "@/lib/i18n";

const NUEVO = "__nuevo__";

/** Busca un proveedor de la lista sin mirar mayúsculas ("leroy merlin" = "Leroy Merlin"). */
export const buscarProveedor = (lista: Proveedor[], nombre: string) =>
  lista.find((p) => p.nombre.toLowerCase() === nombre.trim().toLowerCase());

/**
 * Elegir proveedor: los favoritos arriba (Leroy Merlin, Obramat, BigMat…),
 * los demás debajo, y "Otro" para escribir uno nuevo. Es un desplegable
 * normal del móvil a propósito: en el iPhone sale la ruedecita de siempre,
 * con los grupos separados, y no hay que aprender nada.
 */
export function ProveedorSelector({
  valor,
  onChange,
  proveedores,
  onFavorito,
}: {
  valor: string;
  onChange: (nombre: string) => void;
  proveedores: Proveedor[];
  onFavorito: (nombre: string, favorito: boolean) => Promise<void>;
}) {
  const existente = valor.trim() ? buscarProveedor(proveedores, valor) : undefined;
  // Escribiendo uno nuevo: si el valor no está en la lista, o si se eligió "Otro"
  const [escribiendo, setEscribiendo] = useState(Boolean(valor.trim()) && !existente);
  const [cambiando, setCambiando] = useState(false);

  const favoritos = proveedores.filter((p) => p.favorito);
  const otros = proveedores.filter((p) => !p.favorito);

  const alternarFavorito = async () => {
    const nombre = existente?.nombre ?? valor.trim();
    if (!nombre) return;
    setCambiando(true);
    await onFavorito(nombre, !existente?.favorito);
    setCambiando(false);
  };

  return (
    <div>
      {escribiendo ? (
        <div className="flex items-center gap-2">
          <Input
            autoFocus
            value={valor}
            onChange={(e) => onChange(e.target.value)}
            placeholder={tr("Nombre del proveedor")}
            className="min-w-0 flex-1"
          />
          <button
            type="button"
            onClick={() => {
              setEscribiendo(false);
              onChange("");
            }}
            className="shrink-0 px-1 text-[12.5px] font-semibold text-obra-text-faint"
          >
            {tr("Lista")}
          </button>
        </div>
      ) : (
        <Select
          value={existente?.nombre ?? ""}
          onChange={(e) => {
            if (e.target.value === NUEVO) {
              setEscribiendo(true);
              onChange("");
            } else {
              onChange(e.target.value);
            }
          }}
        >
          <option value="">{tr("— Sin proveedor —")}</option>
          {favoritos.length > 0 && (
            <optgroup label={tr("★ Favoritos")}>
              {favoritos.map((p) => (
                <option key={p.id} value={p.nombre}>
                  {p.nombre}
                </option>
              ))}
            </optgroup>
          )}
          {otros.length > 0 && (
            <optgroup label={tr("Otros")}>
              {otros.map((p) => (
                <option key={p.id} value={p.nombre}>
                  {p.nombre}
                </option>
              ))}
            </optgroup>
          )}
          <option value={NUEVO}>{tr("+ Otro proveedor…")}</option>
        </Select>
      )}

      {valor.trim() && (
        <button
          type="button"
          onClick={alternarFavorito}
          disabled={cambiando}
          className="mt-1.5 flex items-center gap-1.5 text-[12.5px] font-semibold text-obra-text-dim"
        >
          <Star
            size={14}
            className={existente?.favorito ? "fill-obra-yellow text-obra-yellow" : "text-obra-text-faint"}
          />
          {existente?.favorito ? tr("En favoritos · quitar") : tr("Añadir a favoritos")}
        </button>
      )}
    </div>
  );
}
