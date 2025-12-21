import type { Metadata } from 'next';
import { Montserrat, Playfair_Display } from 'next/font/google';
import "./globals.css";

const montserrat = Montserrat({ subsets: ['latin'], variable: '--font-montserrat' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' });

export const metadata: Metadata = {
  title: "Sociedad Pereira Alarcón | Hub Digital",
  description: "Punto de acceso a los servicios de Ingeniería de Software (Felipe Pereira) y Fotografía Profesional (Manuel Pereira).",
  robots: "index, follow", // Importante para que Google sepa que puede entrar
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={`${montserrat.variable} ${playfair.variable} bg-slate-900 text-slate-100 font-sans`}>
        {children}
      </body>
    </html>
  );
}
