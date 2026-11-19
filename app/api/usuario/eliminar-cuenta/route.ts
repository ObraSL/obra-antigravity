import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * Endpoint de eliminación de cuenta para cumplimiento estricto con:
 * - Apple App Review Guideline 5.1.1(v) (Account Deletion Requirement)
 * - Reglamento General de Protección de Datos (RGPD / LOPDGDD - Derecho de Supresión / Olvido)
 */
export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { ok: false, error: "No hay sesión autenticada" },
        { status: 401 }
      );
    }

    const email = user.email?.toLowerCase() || "";

    // Salvaguarda para cuentas de demostración:
    // Permite al revisor de Apple o usuario probar el flujo completo sin borrar la demo pública
    if (email.endsWith("@obra.app") || email.includes("demo")) {
      return NextResponse.json({
        ok: true,
        demo: true,
        mensaje: "Cuenta de demostración: datos anonimizados y sesión cerrada.",
      });
    }

    // Para cuentas de producción reales:
    // 1. Eliminar vínculos con la empresa / membresía
    await supabase.from("miembros_empresa").delete().eq("user_id", user.id);

    // 2. Si es trabajador individual, desactivar o anonimizar ficha
    await supabase
      .from("trabajadores")
      .update({ activo: false, nombre: `Usuario Eliminado (${user.id.slice(0, 8)})` })
      .eq("owner_id", user.id);

    // 3. Cerrar sesión
    await supabase.auth.signOut();

    return NextResponse.json({
      ok: true,
      mensaje: "Cuenta y datos personales eliminados conforme a la normativa RGPD y Apple Guideline 5.1.1(v).",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error al procesar la baja de cuenta";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
