import clsx from "clsx";

/**
 * MEDIDOR ARQUITECTÓNICO DE DOBLE TELEMETRÍA:
 * - Arco en verde lima (#d7dc9a): Avance real completado de la obra (0–100%).
 * - Aguja de acero satinado (blanco): Tiempo transcurrido del plan según el calendario (0–100%).
 *
 * Permite a la dirección de obra ver en 1 segundo si la obra va adelantada,
 * al día o con retraso frente al calendario oficial.
 */
const CENTRO = { x: 60, y: 62 };
const ARCO = "M 12 62 A 48 48 0 0 1 108 62";

const acotar = (v: number) => (Number.isFinite(v) ? Math.max(0, Math.min(100, v)) : 0);

export function Medidor({
  avance,
  tiempo,
  titulo,
  className,
}: {
  /** 0–100: Avance de obra ejecutado (arco lima). */
  avance: number;
  /** 0–100: Tiempo calendario transcurrido (aguja blanca). */
  tiempo: number;
  titulo: string;
  className?: string;
}) {
  const a = acotar(avance);
  const t = acotar(tiempo);
  // 0% = aguja horizontal a la izquierda (-90deg), 100% = horizontal a la derecha (90deg)
  const angulo = -90 + (t / 100) * 180;

  return (
    <svg
      viewBox="0 0 120 70"
      role="img"
      aria-label={titulo}
      className={clsx("block w-full overflow-visible", className)}
    >
      {/* Carril de base en gris arquitectónico tenue */}
      <path
        d={ARCO}
        pathLength={100}
        fill="none"
        stroke="rgba(255, 255, 255, 0.16)"
        strokeWidth={7}
        strokeLinecap="round"
      />

      {/* Arco de avance ejecutado en Pistachio-Lime (#d7dc9a) */}
      {a > 0.5 && (
        <path
          d={ARCO}
          pathLength={100}
          fill="none"
          stroke="#d7dc9a"
          strokeWidth={7}
          strokeLinecap="round"
          strokeDasharray={`${a} 100`}
        />
      )}

      {/* Aguja de tiempo calendario transcurrido */}
      <g
        style={{
          transform: `rotate(${angulo}deg)`,
          transformOrigin: `${CENTRO.x}px ${CENTRO.y}px`,
          transition: "transform 400ms cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <line
          x1={CENTRO.x}
          y1={CENTRO.y}
          x2={CENTRO.x}
          y2={24}
          stroke="#ffffff"
          strokeWidth={2.5}
          strokeLinecap="round"
        />
      </g>

      {/* Pivote central con rodamiento mecánico */}
      <circle cx={CENTRO.x} cy={CENTRO.y} r={6} fill="#ffffff" />
      <circle cx={CENTRO.x} cy={CENTRO.y} r={2.5} fill="#141a16" />
    </svg>
  );
}
