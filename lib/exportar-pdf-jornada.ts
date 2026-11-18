import { fmtHoras, minutosExtra, minutosTrabajados, totalesFichajes } from "@/lib/horas";
import { monthBounds, monthLabel, weekdayShort } from "@/lib/format";
import type { Fichaje, Trabajador } from "@/lib/types";

interface DatosRegistroJornada {
  empresaNombre: string;
  empresaNif?: string;
  obraNombre: string;
  trabajador: Trabajador;
  mes: string; // YYYY-MM
  fichajes: Fichaje[];
  jornadaHoras: number;
}

export function imprimirRegistroJornada({
  empresaNombre,
  empresaNif = "B-XXXXXXXX",
  obraNombre,
  trabajador,
  mes,
  fichajes,
  jornadaHoras,
}: DatosRegistroJornada) {
  const [yearStr, monthStr] = mes.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  const diasEnMes = new Date(year, month, 0).getDate();

  // Mapa de fichajes por día (YYYY-MM-DD)
  const mapaFichajes = new Map<string, Fichaje>();
  fichajes.forEach((f) => mapaFichajes.set(f.fecha, f));

  const filasDias: {
    dia: number;
    fechaIso: string;
    diaSemana: string;
    entrada: string;
    salida: string;
    ordinariasMin: number;
    extraMin: number;
    confirmado: boolean;
  }[] = [];

  let totalOrdinariasMin = 0;
  let totalExtraMin = 0;

  for (let d = 1; d <= diasEnMes; d++) {
    const fechaIso = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const f = mapaFichajes.get(fechaIso);
    const entrada = f?.hora_entrada || "";
    const salida = f?.hora_salida || "";

    const minTrab = minutosTrabajados(entrada || null, salida || null) || 0;
    const extraMin = minutosExtra(minTrab, jornadaHoras);
    const ordinariasMin = Math.max(0, minTrab - extraMin);

    totalOrdinariasMin += ordinariasMin;
    totalExtraMin += extraMin;

    filasDias.push({
      dia: d,
      fechaIso,
      diaSemana: weekdayShort(fechaIso),
      entrada,
      salida,
      ordinariasMin,
      extraMin,
      confirmado: Boolean(f?.confirmado_trabajador),
    });
  }

  const mesTexto = monthLabel(mes);

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Registro_Jornada_${trabajador.nombre.replace(/\s+/g, "_")}_${mes}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 14mm 12mm 14mm 12mm;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 10.5px;
      color: #1a1a1a;
      background: #ffffff;
      line-height: 1.35;
      margin: 0;
      padding: 0;
    }
    .header {
      border-bottom: 2px solid #222;
      padding-bottom: 8px;
      margin-bottom: 12px;
    }
    .titulo {
      font-size: 15px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 0 0 4px 0;
      color: #111;
    }
    .subtitulo {
      font-size: 9px;
      color: #555;
      margin: 0;
    }
    .grid-info {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-bottom: 12px;
      background: #f8f9fa;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 8px 12px;
    }
    .info-item {
      font-size: 10px;
    }
    .info-item strong {
      color: #333;
      text-transform: uppercase;
      font-size: 9px;
      display: inline-block;
      width: 90px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
    }
    th {
      background: #2d3748;
      color: #ffffff;
      font-weight: 700;
      font-size: 9px;
      text-transform: uppercase;
      padding: 4px 6px;
      border: 1px solid #2d3748;
      text-align: center;
    }
    td {
      padding: 3.5px 6px;
      border: 1px solid #cbd5e0;
      text-align: center;
      font-size: 9.5px;
    }
    tr:nth-child(even) td {
      background: #fbfcfd;
    }
    .fin-de-semana td {
      background: #f1f5f9;
      color: #64748b;
    }
    .col-dia {
      font-weight: 700;
      width: 60px;
    }
    .col-hora {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 9px;
      width: 75px;
    }
    .totales-row td {
      background: #edf2f7;
      font-weight: 800;
      border-top: 2px solid #4a5568;
    }
    .legal {
      font-size: 8px;
      color: #666;
      line-height: 1.35;
      border: 1px solid #e2e8f0;
      background: #fafafa;
      padding: 6px 10px;
      border-radius: 4px;
      margin-bottom: 14px;
    }
    .firmas {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      margin-top: 10px;
    }
    .caja-firma {
      border: 1px dashed #a0aec0;
      border-radius: 6px;
      height: 70px;
      padding: 6px 10px;
      position: relative;
    }
    .caja-firma-label {
      font-size: 8.5px;
      font-weight: 700;
      text-transform: uppercase;
      color: #4a5568;
    }
    .caja-firma-estado {
      position: absolute;
      bottom: 8px;
      left: 10px;
      font-size: 9px;
      color: #2b6cb0;
      font-style: italic;
    }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1 class="titulo">Registro Diario de Jornada Laboral</h1>
    <p class="subtitulo">Art. 34.9 del Estatuto de los Trabajadores · Real Decreto-ley 8/2019, de 8 de marzo</p>
  </div>

  <div class="grid-info">
    <div>
      <div class="info-item"><strong>Empresa:</strong> ${empresaNombre}</div>
      <div class="info-item"><strong>CIF / NIF:</strong> ${empresaNif}</div>
      <div class="info-item"><strong>Centro / Obra:</strong> ${obraNombre}</div>
    </div>
    <div>
      <div class="info-item"><strong>Trabajador:</strong> ${trabajador.nombre}</div>
      <div class="info-item"><strong>Mes y Año:</strong> ${mesTexto}</div>
      <div class="info-item"><strong>Jornada:</strong> ${jornadaHoras}h diarias / ordinaria</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th class="col-dia">Día</th>
        <th>Fecha</th>
        <th class="col-hora">Entrada</th>
        <th class="col-hora">Salida</th>
        <th>Horas Ord.</th>
        <th>Horas Ext.</th>
        <th>Conformidad</th>
      </tr>
    </thead>
    <tbody>
      ${filasDias
        .map((f) => {
          const esFinde = f.diaSemana === "Sá" || f.diaSemana === "Do";
          const clase = esFinde ? "class=\"fin-de-semana\"" : "";
          const ordStr = f.ordinariasMin > 0 ? fmtHoras(f.ordinariasMin) : "—";
          const extStr = f.extraMin > 0 ? fmtHoras(f.extraMin) : "—";
          const confStr = f.entrada ? (f.confirmado ? "Conforme (App)" : "Registrado") : "—";

          return `<tr ${clase}>
            <td class="col-dia"><strong>${f.dia}</strong> ${f.diaSemana}</td>
            <td>${f.fechaIso}</td>
            <td class="col-hora">${f.entrada || "—:—"}</td>
            <td class="col-hora">${f.salida || "—:—"}</td>
            <td><strong>${ordStr}</strong></td>
            <td><strong style="color: ${f.extraMin > 0 ? "#c53030" : "inherit"}">${extStr}</strong></td>
            <td style="font-size: 8px; color: ${f.confirmado ? "#276749" : "#4a5568"}">${confStr}</td>
          </tr>`;
        })
        .join("")}
      <tr class="totales-row">
        <td colspan="4" style="text-align: right; padding-right: 12px;">TOTALES DEL MES (${mesTexto}):</td>
        <td>${fmtHoras(totalOrdinariasMin)}</td>
        <td style="color: #c53030;">${fmtHoras(totalExtraMin)}</td>
        <td style="font-size: 8.5px;">Total: ${fmtHoras(totalOrdinariasMin + totalExtraMin)}</td>
      </tr>
    </tbody>
  </table>

  <div class="legal">
    <strong>Obligación Legal de Custodia:</strong> En cumplimiento del Real Decreto-ley 8/2019, la empresa conservará estos registros durante cuatro (4) años y permanecerán a disposición de las personas trabajadoras, de sus representantes legales y de la Inspección de Trabajo y Seguridad Social (ITSS).
  </div>

  <div class="firmas">
    <div class="caja-firma">
      <div class="caja-firma-label">Firma y Sello de la Empresa</div>
      <div class="caja-firma-estado">${empresaNombre} · Válido por registro telemático</div>
    </div>
    <div class="caja-firma">
      <div class="caja-firma-label">Firma del Trabajador</div>
      <div class="caja-firma-estado">${trabajador.nombre} · Verificado en la App</div>
    </div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 350);
    };
  </script>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (!win) {
    // Si el navegador bloqueó el pop-up, creamos un enlace directo para abrir
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.click();
  }
}
