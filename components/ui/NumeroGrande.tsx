/**
 * El número enorme de la portada, como en la referencia de diseño: la parte
 * entera bien grande y oscura, los decimales más pequeños y apagados
 * (72.34 %). Los decimales son de verdad, no de adorno: con diez capítulos
 * el avance casi nunca cae en un número redondo.
 */
export function NumeroGrande({
  valor,
  sufijo = "%",
  decimales = 2,
}: {
  valor: number;
  sufijo?: string;
  decimales?: number;
}) {
  const entero = Math.floor(valor);
  const resto = Math.round((valor - entero) * 10 ** decimales)
    .toString()
    .padStart(decimales, "0");

  return (
    <div className="flex items-start text-obra-text">
      <span className="text-[68px] font-bold leading-[0.8] tracking-[-0.03em]">{entero}</span>
      <span className="mt-[6px] text-[30px] font-semibold leading-none tracking-[-0.02em] text-obra-text-faint">
        ,{resto}
      </span>
      <span className="ml-1.5 mt-[10px] text-[15px] font-bold text-obra-text-faint">{sufijo}</span>
    </div>
  );
}
