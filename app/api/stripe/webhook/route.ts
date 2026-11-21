import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { adminDb, codigoDePago, getStripe, pagadoHasta } from "@/lib/pagos";

type EstadoStripeEvento = "paid" | "failed" | "canceled" | "trialing";

/** Extrae el ID de suscripción desde una factura compatible con Stripe SDK v22 y versiones previas. */
function subscriptionIdDeInvoice(invoice: Stripe.Invoice): string | null {
  const subActual = invoice.parent?.subscription_details?.subscription;
  if (typeof subActual === "string") return subActual;
  if (subActual && typeof subActual === "object" && "id" in subActual) return subActual.id;

  const subLegacy = (invoice as unknown as { subscription?: string | { id: string } | null }).subscription;
  if (typeof subLegacy === "string") return subLegacy;
  if (subLegacy && typeof subLegacy === "object" && "id" in subLegacy) return subLegacy.id;

  return null;
}

/** Mapea el estado de suscripción de Stripe al estado interno del panel admin. */
function estadoStripeDeSub(status: Stripe.Subscription.Status): EstadoStripeEvento {
  switch (status) {
    case "trialing":
      return "trialing";
    case "active":
      return "paid";
    case "past_due":
    case "unpaid":
    case "incomplete":
    case "incomplete_expired":
      return "failed";
    case "canceled":
    case "paused":
      return "canceled";
    default:
      return "failed";
  }
}

/** Registra un evento de Stripe en empresas y auditoria_admin usando la RPC de servidor. */
async function registrarEvento(params: {
  subscriptionId: string;
  event: EstadoStripeEvento;
  pagadoHastaIso: string | null;
  motivo: string | null;
  detalle: string;
}): Promise<boolean> {
  const { error } = await adminDb().rpc("registrar_evento_stripe", {
    p_subscription: params.subscriptionId,
    p_event: params.event,
    p_pagado_hasta: params.pagadoHastaIso,
    p_motivo: params.motivo,
    p_detalle: params.detalle,
  });
  if (error) {
    console.error("Error registrando evento Stripe en Supabase:", error);
    return false;
  }
  return true;
}

/**
 * Stripe llama aquí cada vez que pasa algo con un pago o una suscripción.
 * La firma se comprueba con STRIPE_WEBHOOK_SECRET: sin ella, cualquiera
 * podría "avisar" de pagos falsos.
 */
export async function POST(request: NextRequest) {
  const stripe = getStripe();
  const secreto = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secreto) return new NextResponse("no configurado", { status: 503 });

  let evento: Stripe.Event;
  try {
    evento = stripe.webhooks.constructEvent(
      await request.text(),
      request.headers.get("stripe-signature") ?? "",
      secreto
    );
  } catch {
    return new NextResponse("firma no válida", { status: 400 });
  }

  switch (evento.type) {
    case "checkout.session.completed":
      await codigoDePago(stripe, evento.data.object.id);
      break;

    case "invoice.payment_succeeded": {
      const invoice = evento.data.object as Stripe.Invoice;
      const subId = subscriptionIdDeInvoice(invoice);
      if (subId) {
        const sub = await stripe.subscriptions.retrieve(subId);
        const importe =
          typeof invoice.amount_paid === "number" ? (invoice.amount_paid / 100).toFixed(2) : null;
        const ok = await registrarEvento({
          subscriptionId: subId,
          event: sub.status === "trialing" ? "trialing" : "paid",
          pagadoHastaIso: pagadoHasta(sub),
          motivo: null,
          detalle: importe
            ? `Cobro ${importe} € (${evento.type})`
            : `Cobro completado (${evento.type})`,
        });
        if (!ok) return new NextResponse("error de base de datos", { status: 500 });
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = evento.data.object as Stripe.Invoice;
      const subId = subscriptionIdDeInvoice(invoice);
      if (subId) {
        const razon =
          invoice.last_finalization_error?.message || "Pago rechazado por el banco / tarjeta";
        const ok = await registrarEvento({
          subscriptionId: subId,
          event: "failed",
          pagadoHastaIso: null,
          motivo: `Fallo Stripe: ${razon}`,
          detalle: `Intento de cobro fallido (${evento.type}): ${razon}`,
        });
        if (!ok) return new NextResponse("error de base de datos", { status: 500 });
      }
      break;
    }

    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const sub = evento.data.object as Stripe.Subscription;
      const ev = estadoStripeDeSub(sub.status);
      const motivo =
        ev === "failed"
          ? "Pago pendiente en Stripe"
          : ev === "canceled"
          ? "Suscripción cancelada en Stripe"
          : null;
      const ok = await registrarEvento({
        subscriptionId: sub.id,
        event: ev,
        pagadoHastaIso: pagadoHasta(sub),
        motivo,
        detalle: `Estado suscripción: ${sub.status} (${evento.type})`,
      });
      if (!ok) return new NextResponse("error de base de datos", { status: 500 });
      break;
    }

    case "customer.subscription.deleted": {
      const sub = evento.data.object as Stripe.Subscription;
      const ok = await registrarEvento({
        subscriptionId: sub.id,
        event: "canceled",
        pagadoHastaIso: pagadoHasta(sub),
        motivo: "Suscripción cancelada en Stripe",
        detalle: `Suscripción finalizada (${evento.type})`,
      });
      if (!ok) return new NextResponse("error de base de datos", { status: 500 });
      break;
    }
  }
  return NextResponse.json({ recibido: true });
}
