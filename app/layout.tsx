import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/components/providers/Providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Cognitor — Plataforma Educativa Inteligente",
  description:
    "Gestión escolar integral para colegios privados en Perú: tareas, sílabos, seguimiento parental y alertas académicas con IA.",
  manifest: "/manifest.json",
  openGraph: {
    title: "Cognitor — Plataforma Educativa Inteligente",
    description:
      "SaaS educativo para colegios privados: horarios, sílabos, notificaciones y predicción de desempeño con IA.",
    type: "website",
    locale: "es_PE",
    siteName: "Cognitor",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cognitor",
    description: "Plataforma escolar inteligente para colegios privados en Perú",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Cognitor",
  },
  formatDetection: {
    telephone: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} h-full scroll-smooth`}>
      <head>
        <meta name="theme-color" content="#0F2C59" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="https://cdn-icons-png.flaticon.com/512/2602/2602414.png" />
      </head>
      <body className="font-sans min-h-full bg-background text-text-primary flex flex-col antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
