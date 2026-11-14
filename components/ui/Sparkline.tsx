/** Mini gráfico de barras en SVG puro, sin librería — para tendencias rápidas en tarjetas. */
export function Sparkline({
  values,
  className,
  barColor = "url(#obra-sparkline-gradient)",
}: {
  values: number[];
  className?: string;
  barColor?: string;
}) {
  const max = Math.max(1, ...values);
  const w = 100;
  const h = 32;
  const gap = 1.4;
  const barW = values.length ? w / values.length - gap : 0;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={className} preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id="obra-sparkline-gradient" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#D9963D" />
          <stop offset="100%" stopColor="#F2851B" />
        </linearGradient>
      </defs>
      {values.map((v, i) => {
        const barH = Math.max(2, (v / max) * h);
        return (
          <rect
            key={i}
            x={i * (barW + gap)}
            y={h - barH}
            width={barW}
            height={barH}
            rx={barW / 2.4}
            fill={barColor}
            opacity={i === values.length - 1 ? 1 : 0.55}
          />
        );
      })}
    </svg>
  );
}
