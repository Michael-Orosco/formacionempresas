import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Portal Educativo Escolar PWA",
  description: "Plataforma escolar inteligente con horarios, sílabos y notificaciones de WhatsApp",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ColegioPWA",
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
        <meta name="theme-color" content="#0f2c59" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="https://cdn-icons-png.flaticon.com/512/2602/2602414.png" />
      </head>
      <body className="font-sans min-h-full bg-slate-50 text-slate-900 flex flex-col antialiased">
        {children}
        
        {/* Registro del Service Worker */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/service-worker.js').then(
                    function(reg) {
                      console.log('PWA ServiceWorker registrado con éxito: ', reg.scope);
                    },
                    function(err) {
                      console.log('Error al registrar PWA ServiceWorker: ', err);
                    }
                  );
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}

