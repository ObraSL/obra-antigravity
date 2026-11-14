/**
 * Momento Firma #2: Telemetría de Barras Ecualizador (Dribbble Ref Screen 2).
 * 15 cápsulas verticales redondeadas:
 * - Tramo completado: alternancia táctica Blanco Puro (#FFFFFF) y Pistachio-Lime (#D7DC9A)
 * - Aguja central con nodo circular superior y puntero triangular inferior
 * - Cápsulas de transición en Coral (#E0826D)
 * - Tramo pendiente en Carbón Oliva (#181C19)
 */

export function BarrasProgreso({
  valores,
  porcentaje,
  className = "",
}: {
  valores: number[];
  porcentaje?: number;
  className?: string;
}) {
  // Aseguramos 15 barras tácticas como en la referencia Dribbble
  const totalBarras = 15;
  const serie =
    valores.length >= totalBarras
      ? valores.slice(0, totalBarras)
      : [
          ...valores,
          ...Array(totalBarras - valores.length).fill(0),
        ];

  const max = Math.max(1, ...serie);
  const tieneDatos = serie.some((v) => v > 0);
  const pct = porcentaje != null ? Math.max(0, Math.min(100, Math.round(porcentaje))) : 64;
  const indiceAguja = Math.min(
    totalBarras - 2,
    Math.max(1, Math.round((pct / 100) * (totalBarras - 1)))
  );

  // Alturas orgánicas de respaldo cuando la obra aún tiene pocas horas registradas
  const alturasRef = [78, 92, 84, 72, 96, 88, 76, 94, 58, 26, 26, 26, 82, 92, 68];

  return (
    <div className={`relative flex flex-col ${className}`} aria-hidden>
      <div className="relative flex flex-1 items-center justify-between gap-[6px] px-1 pt-2 pb-5">
        {serie.map((v, i) => {
          const alturaBase = tieneDatos
            ? Math.max(24, Math.round((v / max) * 95))
            : alturasRef[i % alturasRef.length];

          const esAguja = i === indiceAguja;
          const esCompletado = i < indiceAguja;
          const esCoral = i > indiceAguja && i <= indiceAguja + 3;

          let bg = "#181c19";
          let alturaPct = alturaBase;

          if (esAguja) {
            bg = "#d7dc9a";
            alturaPct = 96;
          } else if (esCompletado) {
            bg = i % 2 === 1 ? "#ffffff" : "#d7dc9a";
            alturaPct = Math.max(66, alturaBase);
          } else if (esCoral) {
            bg = "#e0826d";
            alturaPct = 24;
          } else {
            bg = "#181c19";
            alturaPct = Math.max(68, alturaBase);
          }

          return (
            <div
              key={i}
              className="relative flex h-full flex-1 items-center justify-center"
            >
              {esAguja && (
                <>
                  {/* Nodo circular superior de la aguja */}
                  <span className="absolute -top-1.5 z-10 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#68746a]" />
                  {/* Línea vertical de la aguja */}
                  <span className="absolute inset-y-0 z-0 w-[2px] bg-white/90" />
                  {/* Triángulo inferior e indicador de porcentaje */}
                  <div className="absolute -bottom-5 z-10 flex flex-col items-center">
                    <span className="h-0 w-0 border-x-[4px] border-b-[5px] border-x-transparent border-b-white" />
                    <span className="mt-0.5 font-mono-obra text-[11.5px] font-bold leading-none text-white">
                      {pct}%
                    </span>
                  </div>
                </>
              )}
              <div
                className="w-full max-w-[10px] rounded-full transition-all duration-300"
                style={{
                  height: `${alturaPct}%`,
                  background: bg,
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
