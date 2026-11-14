/**
 * Momento Firma #2: Telemetría de Barras Ecualizador.
 * Segmentos verticales tácticos con gradación desde Pizarra Salvia (#39463D)
 * hasta Esmeralda (#34D399) y rematando en Signal Lime (#D4E565).
 */

const COLOR_INICIO = [57, 70, 61]; // Slate #39463D
const COLOR_MEDIO = [52, 211, 153]; // Emerald #34D399
const COLOR_LIME = [212, 229, 101]; // Signal Lime #D4E565

const mezcla = (t: number) => {
  if (t < 0.6) {
    const localT = t / 0.6;
    const c = COLOR_INICIO.map((ci, i) => Math.round(ci + (COLOR_MEDIO[i] - ci) * localT));
    return `rgb(${c[0]},${c[1]},${c[2]})`;
  }
  const localT = (t - 0.6) / 0.4;
  const c = COLOR_MEDIO.map((cm, i) => Math.round(cm + (COLOR_LIME[i] - cm) * localT));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
};

export function BarrasProgreso({
  valores,
  className = "",
}: {
  valores: number[];
  className?: string;
}) {
  const max = Math.max(1, ...valores);

  return (
    <div className={`flex items-end gap-[3px] ${className}`} aria-hidden>
      {valores.map((v, i) => {
        const t = valores.length > 1 ? i / (valores.length - 1) : 1;
        const color = mezcla(t);
        const alturaPct = Math.max(8, (v / max) * 100);

        return (
          <div
            key={i}
            className="flex-1 rounded-t-[3px] transition-all"
            style={{
              height: `${alturaPct}%`,
              background: color,
            }}
          />
        );
      })}
    </div>
  );
}
