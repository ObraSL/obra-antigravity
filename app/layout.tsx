import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { cookies, headers } from "next/headers";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { COOKIE_IDIOMA, esIdioma, idiomaDesde } from "@/lib/i18n";
import { IdiomaProvider } from "@/lib/i18n/provider";
import { COOKIE_TEMA, esTema, type Tema } from "@/lib/tema";
import { TemaProvider } from "@/lib/tema-provider";
import type { ReactNode } from "react";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin", "latin-ext", "cyrillic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Control de Obra",
  description: "Fichajes, vehículos, gastos y facturas de tus obras, en un solo sitio.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Control de Obra",
  },
};

export const viewport: Viewport = {
  themeColor: "#737f73",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const guardadoIdioma = cookieStore.get(COOKIE_IDIOMA)?.value;
  const idioma = esIdioma(guardadoIdioma)
    ? guardadoIdioma
    : idiomaDesde(((await headers()).get("accept-language") ?? "").split(","));

  const guardadoTema = cookieStore.get(COOKIE_TEMA)?.value;
  const tema: Tema = esTema(guardadoTema) ? guardadoTema : "salvia";

  return (
    <html
      lang={idioma}
      data-tema={tema === "claro" ? "claro" : undefined}
      className={`${geist.variable} font-sans h-full antialiased`}
    >
      <body className="min-h-full bg-obra-bg text-obra-text">
        <ServiceWorkerRegister />
        <TemaProvider inicial={tema}>
          <IdiomaProvider inicial={idioma}>{children}</IdiomaProvider>
        </TemaProvider>
      </body>
    </html>
  );
}
