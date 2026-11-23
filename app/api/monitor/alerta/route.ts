import { NextRequest, NextResponse } from "next/server";
import { estadoMonitor, procesarAlertaError, type AlertaErrorPayload } from "@/lib/monitor-alerta";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ ok: true, ...estadoMonitor() });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as Partial<AlertaErrorPayload> | null;
    const mensaje = typeof body?.mensaje === "string" ? body.mensaje.trim() : "";
    if (!mensaje) {
      return NextResponse.json({ ok: false, error: "mensaje requerido" }, { status: 400 });
    }

    const resultado = await procesarAlertaError({
      origen: body?.origen === "servidor" ? "servidor" : "navegador",
      mensaje,
      detalle: typeof body?.detalle === "string" ? body.detalle : null,
      ruta: typeof body?.ruta === "string" ? body.ruta : null,
      navegador: typeof body?.navegador === "string" ? body.navegador : null,
      empresa: typeof body?.empresa === "string" ? body.empresa : null,
      email: typeof body?.email === "string" ? body.email : null,
      test: Boolean(body?.test),
    });

    return NextResponse.json(resultado);
  } catch {
    return NextResponse.json({ ok: false, error: "error interno" }, { status: 500 });
  }
}
