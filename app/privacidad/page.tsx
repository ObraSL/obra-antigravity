import Link from "next/link";
import { ArrowLeft, Clock, FileText, HardHat, Lock, MapPin, Mic, Receipt, Shield, Trash2 } from "lucide-react";

export const metadata = {
  title: "Política de Privacidad | Control de Obra",
  description: "Política de Privacidad y Protección de Datos (RGPD / Apple App Store Guideline 5.1.1) para Control de Obra.",
};

export default function PrivacidadPage() {
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
            <Shield size={14} className="text-[#D7DC9A]" />
            <span>RGPD · LOPDGDD · Apple Guideline 5.1.1</span>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-8 sm:py-16">
        <div className="mb-10 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#D7DC9A]/30 bg-[#D7DC9A]/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#D7DC9A]">
            <Lock size={12} />
            <span>Documento Oficial de Privacidad</span>
          </div>
          <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Política de Privacidad y Protección de Datos
          </h1>
          <p className="mt-2 text-sm text-white/60">
            Última actualización: Noviembre 2026 · Válido para la Unión Europea, España y Apple App Store
          </p>
        </div>

        {/* Resumen ejecutivo en tarjetas */}
        <div className="mb-12 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-[#161a17]/60 p-4">
            <div className="flex items-center gap-2 text-[#D7DC9A]">
              <MapPin size={18} />
              <h3 className="font-bold text-sm text-white">Geolocalización Puntual</h3>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-white/70">
              Solo se registra tu ubicación en el instante exacto en que pulsas el botón de Entrada o Salida para certificar la presencia en la obra. <strong>Nunca se realiza seguimiento continuo ni en segundo plano.</strong>
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#161a17]/60 p-4">
            <div className="flex items-center gap-2 text-[#D7DC9A]">
              <Mic size={18} />
              <h3 className="font-bold text-sm text-white">Notas de Voz y Partes con IA</h3>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-white/70">
              El micrófono solo se activa cuando mantienes pulsado el botón de grabación. Las grabaciones se procesan para transcribir y estructurar el diario de obra de tu equipo.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#161a17]/60 p-4">
            <div className="flex items-center gap-2 text-[#D7DC9A]">
              <Clock size={18} />
              <h3 className="font-bold text-sm text-white">Registro Horario Legal</h3>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-white/70">
              Cumplimiento del Real Decreto-ley 8/2019 de registro de jornada en España. Los datos de fichajes se conservan durante el plazo legal de 4 años a disposición de la Inspección de Trabajo.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#161a17]/60 p-4">
            <div className="flex items-center gap-2 text-[#D7DC9A]">
              <Trash2 size={18} />
              <h3 className="font-bold text-sm text-white">Eliminación de Cuenta (Apple 5.1.1)</h3>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-white/70">
              Puedes eliminar tu cuenta y tus datos personales en cualquier momento directamente desde la pantalla de <strong>Ajustes → Eliminar cuenta</strong> en la aplicación.
            </p>
          </div>
        </div>

        {/* Artículos detallados */}
        <div className="space-y-8 text-sm leading-relaxed text-white/80">
          <section className="rounded-2xl border border-white/10 bg-[#161a17]/40 p-6">
            <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
              <span className="text-[#D7DC9A]">1.</span> Responsable del Tratamiento
            </h2>
            <div className="mt-3 space-y-2 text-xs text-white/70">
              <p>
                <strong>Identidad:</strong> Control de Obra (desarrollado por el equipo de ingeniería para empresas de construcción y reformas).
              </p>
              <p>
                <strong>Contacto de Privacidad y DPO:</strong> <span className="font-mono text-[#D7DC9A]">privacidad@obra.app</span>
              </p>
              <p>
                <strong>Ámbito:</strong> Aplicación móvil (iOS/Android/PWA) y plataforma web accesible para directores, jefes de obra y trabajadores.
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-[#161a17]/40 p-6">
            <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
              <span className="text-[#D7DC9A]">2.</span> Datos que Recopilamos y Finalidad
            </h2>
            <div className="mt-4 space-y-4 text-xs text-white/70">
              <div>
                <h4 className="font-semibold text-white text-sm">A. Registro de Jornada y Fichajes</h4>
                <p className="mt-1">
                  Hora de entrada, hora de salida, pausas y total de horas efectivas diarias. Finalidad: Cumplimiento del art. 34.9 del Estatuto de los Trabajadores y cálculo de horas de obra.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-white text-sm">B. Coordenadas GPS en Fichajes</h4>
                <p className="mt-1">
                  Latitud, longitud y precisión capturadas exclusivamente en el milisegundo de pulsación del botón. Finalidad: Verificar que el registro se produce en el radio autorizado de la obra. <em>No se realiza geolocalización continua ni rastreo de trayectos.</em>
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-white text-sm">C. Grabaciones de Audio y Notas de Voz</h4>
                <p className="mt-1">
                  Archivos de audio transmitidos a la API de transcripción e inteligencia artificial para generar el diario de obra y extraer tareas de aprovisionamiento o incidencias.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-white text-sm">D. Fotografías de Tickets y Albaranes</h4>
                <p className="mt-1">
                  Imágenes tomadas con la cámara o cargadas desde la fototeca para extracción óptica de caracteres (OCR) y justificación de gastos del proyecto.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-[#161a17]/40 p-6">
            <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
              <span className="text-[#D7DC9A]">3.</span> Base Jurídica del Tratamiento
            </h2>
            <p className="mt-3 text-xs text-white/70">
              El tratamiento de los datos se fundamenta en:
            </p>
            <ul className="mt-2 list-disc pl-5 space-y-1.5 text-xs text-white/70">
              <li><strong>Cumplimiento de una obligación legal</strong> (art. 6.1.c del RGPD): Obligación de registro de jornada laboral según Real Decreto-ley 8/2019.</li>
              <li><strong>Ejecución del contrato laboral o mercantil</strong> (art. 6.1.b del RGPD): Asignación a proyectos, cómputo de turnos y liquidación de gastos.</li>
              <li><strong>Consentimiento expreso</strong> (art. 6.1.a del RGPD): Para el acceso al micrófono y a la cámara fotográfica del dispositivo móvil.</li>
            </ul>
          </section>

          <section className="rounded-2xl border border-white/10 bg-[#161a17]/40 p-6">
            <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
              <span className="text-[#D7DC9A]">4.</span> Conservación y Seguridad de los Datos
            </h2>
            <p className="mt-3 text-xs text-white/70">
              Los registros horarios obligatorios se conservarán durante <strong>4 años</strong> según lo estipulado por la legislación laboral española, quedando a disposición de las personas trabajadoras, de sus representantes legales y de la Inspección de Trabajo y Seguridad Social. Los audios y fotografías se conservarán durante la duración de la obra más los plazos de garantía legal.
            </p>
            <p className="mt-2 text-xs text-white/70">
              Todos los datos viajan cifrados mediante <strong>TLS 1.3</strong> y se almacenan en servidores seguros con cifrado AES-256 y políticas de aislamiento de nivel de fila (Row-Level Security).
            </p>
          </section>

          <section className="rounded-2xl border border-white/10 bg-[#161a17]/40 p-6">
            <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
              <span className="text-[#D7DC9A]">5.</span> Tus Derechos y Eliminación de Cuenta
            </h2>
            <p className="mt-3 text-xs text-white/70">
              Tienes derecho a acceder, rectificar, limitar, portar o solicitar la supresión de tus datos personales en virtud de los artículos 15 a 22 del RGPD.
            </p>
            <div className="mt-4 rounded-xl border border-red-500/20 bg-red-950/20 p-4 text-xs text-red-200">
              <strong className="text-white block mb-1">Mecanismo de Eliminación en la App (Apple Guideline 5.1.1(v)):</strong>
              Cualquier usuario puede pulsar en <strong>Ajustes → Mi cuenta → Eliminar cuenta</strong> para revocar credenciales y desvincularse de la organización de forma inmediata. También puedes solicitarlo en cualquier momento escribiendo a <span className="font-mono text-white underline">privacidad@obra.app</span>.
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-12 border-t border-white/10 pt-6 text-center text-xs text-white/40">
          <p>© {new Date().getFullYear()} Control de Obra · Todos los derechos reservados.</p>
          <div className="mt-2 flex items-center justify-center gap-4">
            <Link href="/terminos" className="hover:text-white transition">Términos del Servicio</Link>
            <span>·</span>
            <Link href="/" className="hover:text-white transition">Acceder a la Plataforma</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
