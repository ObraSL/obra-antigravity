/**
 * Motor gratuito de monitoreo y alertas instantáneas (Gemini Flash + Telegram Bot).
 * Se ejecuta exclusivamente en servidor: nunca expone API keys ni tokens al navegador.
 */

export type AlertaErrorPayload = {
  origen: "navegador" | "servidor";
  mensaje: string;
  detalle?: string | null;
  ruta?: string | null;
  navegador?: string | null;
  empresa?: string | null;
  email?: string | null;
  test?: boolean;
};

type Severidad = "critico" | "aviso" | "ignorar";

type DiagnosticoIA = {
  severidad: Severidad;
  resumen_uk: string;
  accion_uk: string;
  iaUsada: boolean;
};

export type ResultadoAlerta = {
  ok: boolean;
  omitido?: boolean;
  motivo?: string;
  severidad?: Severidad;
  diagnostico?: { resumen_uk: string; accion_uk: string };
  iaUsada?: boolean;
  telegramEnviado: boolean;
  telegramError?: string;
};

const COOLDOWN_MS = 5 * 60_000;
const VENTANA_HORA_MS = 60 * 60_000;
const MAX_ALERTAS_HORA = 30;

const cacheRecientes = new Map<string, number>();
let marcasHora: number[] = [];

export function estadoMonitor() {
  const geminiConfigurado = Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);
  const telegramConfigurado = Boolean(
    process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID
  );
  return { geminiConfigurado, telegramConfigurado };
}

function escaparHtml(texto: string): string {
  return texto.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function permitirAlerta(payload: AlertaErrorPayload): { permitido: boolean; motivo?: string } {
  if (payload.test) return { permitido: true };

  const ahora = Date.now();
  marcasHora = marcasHora.filter((ts) => ahora - ts < VENTANA_HORA_MS);
  if (marcasHora.length >= MAX_ALERTAS_HORA) {
    return { permitido: false, motivo: "rate_limit_horario" };
  }

  const clave = `${payload.origen}|${payload.ruta ?? ""}|${payload.mensaje.slice(0, 120)}`;
  const ultimo = cacheRecientes.get(clave);
  if (ultimo && ahora - ultimo < COOLDOWN_MS) {
    return { permitido: false, motivo: "duplicado_reciente" };
  }

  cacheRecientes.set(clave, ahora);
  if (cacheRecientes.size > 200) {
    const primera = cacheRecientes.keys().next().value;
    if (primera) cacheRecientes.delete(primera);
  }
  marcasHora.push(ahora);
  return { permitido: true };
}

function diagnosticoFallback(payload: AlertaErrorPayload): DiagnosticoIA {
  if (payload.test) {
    return {
      severidad: "aviso",
      resumen_uk: "Перевірка зв'язку з моніторингом Control de Obra пройшла успішно.",
      accion_uk: "Система готова миттєво сповіщати про критичні збої в компаніях.",
      iaUsada: false,
    };
  }
  return {
    severidad: payload.origen === "servidor" ? "critico" : "aviso",
    resumen_uk: `Зафіксовано помилку (${payload.origen === "servidor" ? "сервер" : "клієнт"}) на екрані ${payload.ruta || "/"}.`,
    accion_uk: "Перевірте деталі у вкладці «Помилки» в /admin або стан компанії.",
    iaUsada: false,
  };
}

async function analizarConGemini(payload: AlertaErrorPayload): Promise<DiagnosticoIA> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) return diagnosticoFallback(payload);

  const prompt = `Ти черговий SRE-інженер B2B-платформи Control de Obra (будівництво та облік годин).
Оціни інцидент і поверни суто JSON без markdown:
{
  "severidad": "critico" | "aviso" | "ignorar",
  "resumen_uk": "1-2 коротких речення українською: що саме зламалось і чи заважає це роботі",
  "accion_uk": "1 конкретна дія для адміністратора українською"
}

Правила:
- "ignorar": дрібний шум браузера (тимчасовий обрив мережі при завантаженні, ResizeObserver, скасовані запити).
- "aviso": некритична помилка UI чи відмова дозволу (наприклад, користувач не дав доступ до GPS).
- "critico": збій сервера, БД/RLS, Stripe, неможливість увійти чи відмітити години.

Дані помилки:
- Джерело: ${payload.origen}
- Компанія: ${payload.empresa ?? "не вказано"}
- Користувач: ${payload.email ?? "не вказано"}
- Екран/маршрут: ${payload.ruta ?? "/"}
- Повідомлення: ${payload.mensaje.slice(0, 500)}
- Стек/деталі: ${(payload.detalle ?? "").slice(0, 1200)}
- Пристрій: ${(payload.navegador ?? "").slice(0, 200)}`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json", temperature: 0.1 },
        }),
        signal: AbortSignal.timeout(4500),
      }
    );

    if (!res.ok) return diagnosticoFallback(payload);
    const data = await res.json();
    const texto = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!texto) return diagnosticoFallback(payload);

    const parsed = JSON.parse(texto) as Partial<DiagnosticoIA>;
    const severidad: Severidad =
      parsed.severidad === "critico" || parsed.severidad === "aviso" || parsed.severidad === "ignorar"
        ? parsed.severidad
        : payload.origen === "servidor"
        ? "critico"
        : "aviso";

    return {
      severidad,
      resumen_uk: String(parsed.resumen_uk || "").trim() || diagnosticoFallback(payload).resumen_uk,
      accion_uk: String(parsed.accion_uk || "").trim() || diagnosticoFallback(payload).accion_uk,
      iaUsada: true,
    };
  } catch {
    return diagnosticoFallback(payload);
  }
}

async function enviarTelegram(html: string): Promise<{ enviado: boolean; error?: string }> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    return { enviado: false, error: "telegram_no_configurado" };
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: html,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
      signal: AbortSignal.timeout(4500),
    });
    if (!res.ok) {
      const texto = await res.text().catch(() => "");
      return { enviado: false, error: `HTTP ${res.status} ${texto.slice(0, 120)}`.trim() };
    }
    return { enviado: true };
  } catch (err) {
    return { enviado: false, error: err instanceof Error ? err.message : "error_red_telegram" };
  }
}

export async function procesarAlertaError(payload: AlertaErrorPayload): Promise<ResultadoAlerta> {
  const control = permitirAlerta(payload);
  if (!control.permitido) {
    return { ok: true, omitido: true, motivo: control.motivo, telegramEnviado: false };
  }

  const analisis = await analizarConGemini(payload);
  if (analisis.severidad === "ignorar" && !payload.test) {
    return {
      ok: true,
      omitido: true,
      motivo: "ignorado_por_ia",
      severidad: analisis.severidad,
      diagnostico: { resumen_uk: analisis.resumen_uk, accion_uk: analisis.accion_uk },
      iaUsada: analisis.iaUsada,
      telegramEnviado: false,
    };
  }

  const cabecera = payload.test
    ? "🧪 <b>ТЕСТ МОНІТОРИНГУ · Control de Obra</b>"
    : analisis.severidad === "critico"
    ? "🔴 <b>КРИТИЧНИЙ ЗБІЙ · Control de Obra</b>"
    : "🟡 <b>ПОПЕРЕДЖЕННЯ · Control de Obra</b>";

  const origenTexto = payload.origen === "servidor" ? "Сервер" : "Телефон / Браузер";
  const contexto = [
    payload.empresa ? `🏢 <b>Компанія:</b> ${escaparHtml(payload.empresa)}` : null,
    payload.email ? `👤 <b>Користувач:</b> ${escaparHtml(payload.email)}` : null,
    `📍 <b>Екран:</b> <code>${escaparHtml(payload.ruta || "/")}</code> (${origenTexto})`,
  ]
    .filter(Boolean)
    .join("\n");

  const html = [
    cabecera,
    contexto,
    `❌ <b>Помилка:</b> <code>${escaparHtml(payload.mensaje.slice(0, 280))}</code>`,
    `🤖 <b>Діагноз${analisis.iaUsada ? " (Gemini)" : ""}:</b> ${escaparHtml(analisis.resumen_uk)}`,
    `🛠 <b>Що робити:</b> ${escaparHtml(analisis.accion_uk)}`,
  ].join("\n\n");

  const tg = await enviarTelegram(html);
  return {
    ok: true,
    severidad: analisis.severidad,
    diagnostico: { resumen_uk: analisis.resumen_uk, accion_uk: analisis.accion_uk },
    iaUsada: analisis.iaUsada,
    telegramEnviado: tg.enviado,
    ...(tg.error ? { telegramError: tg.error } : {}),
  };
}
