import type { Metadata, Viewport } from "next";
import { Barlow_Condensed, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { cookies, headers } from "next/headers";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { COOKIE_IDIOMA, esIdioma, idiomaDesde } from "@/lib/i18n";
import { IdiomaProvider } from "@/lib/i18n/provider";
import type { ReactNode } from "react";

const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow-condensed",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
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
  themeColor: "#f2f4f0",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: { children: ReactNode }) {
  const guardado = (await cookies()).get(COOKIE_IDIOMA)?.value;
  const idioma = esIdioma(guardado)
    ? guardado
    : idiomaDesde(((await headers()).get("accept-language") ?? "").split(","));

  return (
    <html
      lang={idioma}
      className={`${barlowCondensed.variable} ${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-obra-bg text-obra-text">
        <ServiceWorkerRegister />
        <IdiomaProvider inicial={idioma}>{children}</IdiomaProvider>
      </body>
    </html>
  );
}
