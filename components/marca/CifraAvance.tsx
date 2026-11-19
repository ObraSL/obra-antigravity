import clsx from "clsx";
import { localeActual } from "@/lib/i18n";

/**
 * Cifra de avance arquitectónica de alta precisión:
 * Parte entera estilizada, decimales reales reducidos y símbolo %.
 * Respeta la localización actual (coma o punto decimal).
 */
export function partesAvance(valor: number, decimales = 2) {
  const seguro = Number.isFinite(valor) ? Math.min(100, Math.max(0, valor)) : 0;
  const partes = new Intl.NumberFormat(localeActual(), {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  }).formatToParts(seguro);

  const entero = partes.filter((p) => p.type === "integer" || p.type === "group").map((p) => p.value).join("");
  const separador = partes.find((p) => p.type === "decimal")?.value ?? ",";
  const fraccion = partes.find((p) => p.type === "fraction")?.value ?? "";

  return { entero, separador, fraccion, texto: `${entero}${fraccion ? separador + fraccion : ""} %` };
}

export function CifraAvance({
  valor,
  decimales = 2,
  tamano = "gigante",
  className,
}: {
  valor: number;
  decimales?: number;
  tamano?: "gigante" | "cifra" | "compacto";
  className?: string;
}) {
  const { entero, separador, fraccion, texto } = partesAvance(valor, decimales);

  const tamanoEntero =
    tamano === "gigante"
      ? "text-[3.75rem] sm:text-[4.25rem]"
      : tamano === "cifra"
      ? "text-[2.5rem] sm:text-[3rem]"
      : "text-[1.8rem] sm:text-[2.2rem]";

  const tamanoFraccion =
    tamano === "gigante"
      ? "text-[1.85rem] sm:text-[2.1rem]"
      : tamano === "cifra"
      ? "text-[1.35rem] sm:text-[1.5rem]"
      : "text-[1.1rem] sm:text-[1.25rem]";

  const tamanoSufijo =
    tamano === "gigante"
      ? "text-[1.5rem] sm:text-[1.75rem]"
      : tamano === "cifra"
      ? "text-[1.15rem] sm:text-[1.3rem]"
      : "text-[0.95rem] sm:text-[1.05rem]";

  return (
    <p
      className={clsx(
        "font-mono-obra flex items-baseline font-light leading-none tracking-[-0.04em] text-white",
        className
      )}
      aria-label={texto}
    >
      <span aria-hidden className={clsx("font-light", tamanoEntero)}>
        {entero}
      </span>
      {fraccion && (
        <span aria-hidden className={clsx("font-normal text-white/75", tamanoFraccion)}>
          {separador}
          {fraccion}
        </span>
      )}
      <span aria-hidden className={clsx("ml-1.5 font-normal text-white/60", tamanoSufijo)}>
        %
      </span>
    </p>
  );
}
