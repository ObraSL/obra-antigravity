/**
 * Emblema de la marca Control de Obra v2:
 * Estructura de vigas en A con viga de cimentación y travesaño de nivel,
 * vectorial, escalable y con color heredado (currentColor).
 */
export function Logo({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      stroke="currentColor"
      strokeWidth={13}
      strokeLinejoin="miter"
      strokeLinecap="butt"
      className={className}
      aria-hidden
    >
      <path d="M14 72 L50 16 L86 72" />
      <path d="M34 88 L94 88" />
      <path d="M31 52 L69 52" strokeWidth={10} strokeOpacity={0.8} />
    </svg>
  );
}
