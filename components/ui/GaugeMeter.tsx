"use client";

/**
 * Momento Firma: Medidor semicircular de velocidad/avance (Dribbble Ref Screen 2).
 * Arco de gradación esmeralda-lima con aguja central de alta precisión.
 */
export function GaugeMeter({
  valor = 64,
  className = "",
}: {
  valor?: number;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, valor));
  // Ángulo de la aguja: 180° (0%) a 0° (100%) -> de PI a 0 rad
  const anguloRad = Math.PI * (1 - pct / 100);
  const cx = 56;
  const cy = 52;
  const r = 38;

  const needleLength = 28;
  const nx = cx + needleLength * Math.cos(anguloRad);
  const ny = cy - needleLength * Math.sin(anguloRad);

  // Longitud de la semicircunferencia: PI * R = ~119.38
  const perimetroSemi = Math.PI * r;
  const dashOffset = perimetroSemi * (1 - pct / 100);

  return (
    <div className={`relative flex items-center justify-center ${className}`} aria-hidden>
      <svg
        viewBox="0 0 112 64"
        className="w-full max-w-[125px] overflow-visible"
      >
        <defs>
          <linearGradient id="gauge-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6ee7b7" />
            <stop offset="65%" stopColor="#a7e8a4" />
            <stop offset="100%" stopColor="#d7dc9a" />
          </linearGradient>
          <filter id="gauge-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Pista gris oscura */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke="rgba(255, 255, 255, 0.16)"
          strokeWidth="7"
          strokeLinecap="round"
        />

        {/* Arco activo coloreado */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke="url(#gauge-gradient)"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={perimetroSemi}
          strokeDashoffset={dashOffset}
          filter="url(#gauge-glow)"
          className="transition-all duration-700 ease-out"
        />

        {/* Aguja indicadora */}
        <line
          x1={cx}
          y1={cy}
          x2={nx}
          y2={ny}
          stroke="#ffffff"
          strokeWidth="2.5"
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />

        {/* Pivote central */}
        <circle cx={cx} cy={cy} r="6" fill="#4a534c" stroke="#ffffff" strokeWidth="2" />
        <circle cx={cx} cy={cy} r="2.5" fill="#ffffff" />
      </svg>
    </div>
  );
}
