import Link from "next/link";
import { ArrowLeft, BookOpen, Building2, CheckCircle2, FileText, Scale, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Términos del Servicio | Control de Obra",
  description: "Términos y Condiciones Generales de Uso del software de gestión y control de obra.",
};

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-[#1E2520] text-[#E0E7E1] antialiased selection:bg-[#D7DC9A] selection:text-[#1E2520]">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#161a17]/85 backdrop-blur-md px-4 py-3.5 sm:px-8">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#D7DC9A] hover:underline"
          >
            <ArrowLeft size={16} />
            <span>Volver al inicio</span>
          </Link>
          <div className="flex items-center gap-2 text-xs font-medium text-white/60">
            <Scale size={14} className="text-[#D7DC9A]" />
            <span>Términos y Condiciones Legales</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-8 sm:py-16">
        <div className="mb-10 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#D7DC9A]/30 bg-[#D7DC9A]/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#D7DC9A]">
            <BookOpen size={12} />
            <span>Condiciones de Contratación y Uso</span>
          </div>
          <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Términos del Servicio (B2B SaaS)
          </h1>
          <p className="mt-2 text-sm text-white/60">
            Última actualización: Noviembre 2026 · Legislación aplicable: Reino de España
          </p>
        </div>

        <div className="space-y-8 text-sm leading-relaxed text-white/80">
          <section className="rounded-2xl border border-white/10 bg-[#161a17]/40 p-6">
            <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
              <span className="text-[#D7DC9A]">1.</span> Ámbito y Aceptación
            </h2>
            <p className="mt-3 text-xs text-white/70">
              El presente contrato regula el acceso y uso del software en la nube <strong>Control de Obra</strong>, diseñado como herramienta operativa para constructores, contratistas, directores de proyecto y personal de obra. El uso de la aplicación móvil o la plataforma web implica la plena aceptación de estas cláusulas.
            </p>
          </section>

          <section className="rounded-2xl border border-white/10 bg-[#161a17]/40 p-6">
            <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
              <span className="text-[#D7DC9A]">2.</span> Licencia de Uso y Roles de Acceso
            </h2>
            <p className="mt-3 text-xs text-white/70">
              Se otorga al cliente una licencia intransferible, no exclusiva y temporal para utilizar el software según el plan contratado. El sistema gestiona perfiles diferenciados:
            </p>
            <ul className="mt-2 list-disc pl-5 space-y-1 text-xs text-white/70">
              <li><strong>Director / Dueño:</strong> Gestión integral, contratación, alta de obras, aprobación de costes y configuración.</li>
              <li><strong>Jefe de Obra (Manager):</strong> Planificación Gantt, asignación de cuadrillas, validación de gastos y partes diarios.</li>
              <li><strong>Trabajador:</strong> Fichaje de jornada con verificación GPS, consulta de turnos asignados y grabación de notas de voz.</li>
            </ul>
          </section>

          <section className="rounded-2xl border border-white/10 bg-[#161a17]/40 p-6">
            <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
              <span className="text-[#D7DC9A]">3.</span> Veracidad de Datos y Cumplimiento Laboral
            </h2>
            <p className="mt-3 text-xs text-white/70">
              La empresa usuaria es la única responsable de la veracidad y legalidad de los fichajes registrados, del alta correcta de sus trabajadores en el régimen de la Seguridad Social correspondiente y del cumplimiento del Real Decreto-ley 8/2019 sobre registro diario de jornada.
            </p>
          </section>

          <section className="rounded-2xl border border-white/10 bg-[#161a17]/40 p-6">
            <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
              <span className="text-[#D7DC9A]">4.</span> Propiedad Intelectual de los Datos
            </h2>
            <p className="mt-3 text-xs text-white/70">
              Todos los datos, planos, diagramas Gantt, fotografías de recibos, archivos de audio y anotaciones generadas por la empresa cliente son de su exclusiva propiedad. Control de Obra no comercializa ni cede estos datos a terceros.
            </p>
          </section>

          <section className="rounded-2xl border border-white/10 bg-[#161a17]/40 p-6">
            <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
              <span className="text-[#D7DC9A]">5.</span> Disponibilidad y Copias de Seguridad
            </h2>
            <p className="mt-3 text-xs text-white/70">
              Garantizamos un acuerdo de nivel de servicio (SLA) con disponibilidad superior al 99.5%, con redundancia en la infraestructura en la nube y copias de seguridad continuas. El modo offline de la aplicación permite registrar horas y notas sin conexión, sincronizándose automáticamente al restablecerse la red.
            </p>
          </section>

          <section className="rounded-2xl border border-white/10 bg-[#161a17]/40 p-6">
            <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
              <span className="text-[#D7DC9A]">6.</span> Ley Aplicable y Jurisdicción
            </h2>
            <p className="mt-3 text-xs text-white/70">
              Estos términos se rigen por la legislación española. Para cualquier controversia derivada del presente contrato, las partes se someten a los juzgados y tribunales de la ciudad de Madrid, con renuncia expresa a cualquier otro fuero que pudiera corresponderles.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-12 border-t border-white/10 pt-6 text-center text-xs text-white/40">
          <p>© {new Date().getFullYear()} Control de Obra · Todos los derechos reservados.</p>
          <div className="mt-2 flex items-center justify-center gap-4">
            <Link href="/privacidad" className="hover:text-white transition">Política de Privacidad</Link>
            <span>·</span>
            <Link href="/" className="hover:text-white transition">Acceder a la Plataforma</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
