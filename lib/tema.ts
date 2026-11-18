/**
 * Візуальна тема застосунку:
 * - "salvia": фірмова шавлієво-графітова тема за замовчуванням
 * - "claro": висококонтрастна світла тема («Режим Сонце») для роботи під відкритим небом
 */
export type Tema = "salvia" | "claro";

export const COOKIE_TEMA = "tema";

export const esTema = (v: unknown): v is Tema => v === "salvia" || v === "claro";

export const COLOR_BARRA: Record<Tema, string> = {
  salvia: "#737f73",
  claro: "#eef1ea",
};
