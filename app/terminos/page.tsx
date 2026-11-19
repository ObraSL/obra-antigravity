import Link from "next/link";
import { AlertTriangle, ArrowLeft, BookOpen, Building2, CheckCircle2, FileText, Scale, ShieldAlert, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Términos del Servicio y Descargo Legal | Control de Obra",
  description: "Términos y Condiciones Generales de Uso, exclusión de garantías («AS IS») y limitación de responsabilidad.",
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
            <span>Términos, Permisos y Exclusión de Garantías</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-8 sm:py-16">
        <div className="mb-10 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#D7DC9A]/30 bg-[#D7DC9A]/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#D7DC9A]">
            <BookOpen size={12} />
            <span>Condiciones de Contratación y Descargo Legal</span>
          </div>
          <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Términos del Servicio y Exclusión de Responsabilidad
          </h1>
          <p className="mt-2 text-sm text-white/60">
            Última actualización: Noviembre 2026 · Legislación aplicable: Reino de España
          </p>
        </div>

        {/* Alerta de exención de responsabilidad tipo AS IS */}
        <div className="mb-8 rounded-2xl border border-amber-500/30 bg-amber-950/20 p-5 text-amber-200">
          <div className="flex items-center gap-2.5 font-bold text-amber-400 text-sm">
            <AlertTriangle size={18} />
            <span>AVISO LEGAL IMPORTANTE: PROVISIÓN DEL SOFTWARE «TAL CUAL» («AS IS»)</span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-amber-100/90">
            Control de Obra es una herramienta técnica y organizativa auxiliar. La plataforma se suministra estrictamente «TAL CUAL» («AS IS») y «SEGÚN DISPONIBILIDAD», sin otorgar ninguna garantía legal, explícita o implícita, respecto a infalibilidad técnica, ausencia total de errores o resultados específicos ante inspecciones oficiales. La empresa contratante y el usuario son los únicos responsables legales de la supervisión de los datos y del cumplimiento del marco laboral aplicable.
          </p>
        </div>

        <div className="space-y-8 text-sm leading-relaxed text-white/80">
          <section className="rounded-2xl border border-white/10 bg-[#161a17]/40 p-6">
            <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
              <span className="text-[#D7DC9A]">1.</span> Ámbito y Aceptación
            </h2>
            <p className="mt-3 text-xs text-white/70">
              El presente contrato regula el acceso y uso del software en la nube <strong>Control de Obra</strong>, diseñado como herramienta operativa para constructores, contratistas, directores de proyecto y personal de obra. El uso de la aplicación móvil o la plataforma web implica la plena aceptación sin reservas de estas cláusulas.
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
              <li><strong>Trabajador:</strong> Fichaje de jornada con verificación GPS puntual, consulta de turnos asignados y grabación de notas de voz.</li>
            </ul>
          </section>

          <section className="rounded-2xl border border-white/10 bg-[#161a17]/40 p-6">
            <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
              <span className="text-[#D7DC9A]">3.</span> Consentimiento Expreso de Permisos (Micrófono y Geolocalización)
            </h2>
            <p className="mt-3 text-xs text-white/70">
              Al utilizar las funciones móviles, el usuario autoriza expresamente:
            </p>
            <ul className="mt-2 list-disc pl-5 space-y-1 text-xs text-white/70">
              <li><strong>Acceso puntual a coordenadas GPS:</strong> Exclusivamente en el milisegundo de registro de Entrada o Salida para certificar la presencia física en el radio de la obra. El software no rastrea trayectos ni monitoriza la ubicación en segundo plano.</li>
              <li><strong>Acceso al micrófono:</strong> Para la grabación voluntaria de notas de voz, resúmenes diarios y partes de trabajo que son procesados mediante modelos de transcripción e inteligencia artificial.</li>
              <li><strong>Acceso a la cámara y fototeca:</strong> Para fotografiar y digitalizar tickets de compra, albaranes de materiales y avances de construcción.</li>
            </ul>
          </section>

          <section className="rounded-2xl border border-white/10 bg-[#161a17]/40 p-6">
            <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
              <span className="text-[#D7DC9A]">4.</span> Exclusión Total de Garantías («AS IS»)
            </h2>
            <p className="mt-3 text-xs text-white/70">
              En la mayor medida permitida por la legislación aplicable:
            </p>
            <ul className="mt-2 list-disc pl-5 space-y-1.5 text-xs text-white/70">
              <li>El servicio se proporciona «TAL CUAL» («AS IS») sin garantías de comerciabilidad, adecuación a un fin particular o ausencia de defectos.</li>
              <li>No garantizamos que el funcionamiento sea ininterrumpido o esté exento de errores técnicos provocados por caídas de redes de telecomunicaciones, imprecisiones del hardware GPS del dispositivo, saturación de servidores de terceros o pérdidas transitorias de cobertura en sótanos o zonas rurales.</li>
              <li>Los módulos asistidos por Inteligencia Artificial (reconocimiento OCR de tickets, transcripción y traducción de audios) son herramientas complementarias de apoyo. El usuario es responsable de cotejar y validar los importes y datos antes de su consolidación contable.</li>
            </ul>
          </section>

          <section className="rounded-2xl border border-white/10 bg-[#161a17]/40 p-6">
            <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
              <span className="text-[#D7DC9A]">5.</span> Limitación Estricta de Responsabilidad e Indemnidad (Hold Harmless)
            </h2>
            <p className="mt-3 text-xs text-white/70">
              Bajo ninguna circunstancia los desarrolladores, operadores ni proveedores de infraestructura de Control de Obra serán responsables de:
            </p>
            <ul className="mt-2 list-disc pl-5 space-y-1.5 text-xs text-white/70">
              <li>Sanciones, multas o actas de liquidación impuestas por la Inspección de Trabajo y Seguridad Social (ITSS) o cualquier organismo regulador derivadas de fichajes omitidos, manipulados o erróneos.</li>
              <li>Conflictos laborales, demandas o reclamaciones de cantidad entre la empresa contratante y sus empleados o subcontratas.</li>
              <li>Lucro cesante, pérdidas comerciales, daños directos, indirectos, consecuenciales o fortuitos derivados de la utilización o imposibilidad de utilización del software.</li>
              <li>El cliente acepta defender, indemnizar y mantener indemne a Control de Obra frente a cualquier acción legal promovida por terceros en relación con el uso de la cuenta.</li>
            </ul>
          </section>

          <section className="rounded-2xl border border-white/10 bg-[#161a17]/40 p-6">
            <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
              <span className="text-[#D7DC9A]">6.</span> Veracidad de Datos y Obligaciones Laborales
            </h2>
            <p className="mt-3 text-xs text-white/70">
              La empresa cliente es la única y exclusiva responsable legal de dar de alta en la Seguridad Social a sus trabajadores, de garantizar la veracidad de los partes de trabajo y de custodiar los resúmenes de jornada en cumplimiento estricto del Real Decreto-ley 8/2019 y el art. 34.9 del Estatuto de los Trabajadores.
            </p>
          </section>

          <section className="rounded-2xl border border-white/10 bg-[#161a17]/40 p-6">
            <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
              <span className="text-[#D7DC9A]">7.</span> Propiedad de los Datos y Respaldo Offline
            </h2>
            <p className="mt-3 text-xs text-white/70">
              Todos los datos, planos, diagramas Gantt, fotografías de recibos, archivos de audio y anotaciones generadas por la empresa cliente son de su exclusiva propiedad. El mecanismo de cola offline almacena las marcas en el dispositivo móvil y las sincroniza automáticamente al restablecerse la conexión de red.
            </p>
          </section>

          <section className="rounded-2xl border border-white/10 bg-[#161a17]/40 p-6">
            <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
              <span className="text-[#D7DC9A]">8.</span> Ley Aplicable y Jurisdicción
            </h2>
            <p className="mt-3 text-xs text-white/70">
              Estos términos se rigen íntegramente por la legislación española. Para cualquier litigio o divergencia relacionada con este servicio, las partes renuncian expresamente a su fuero propio y se someten a la competencia de los juzgados y tribunales de la ciudad de Madrid (España).
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
