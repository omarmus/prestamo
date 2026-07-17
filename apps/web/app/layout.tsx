import type { Metadata } from 'next';
import './globals.css';

// Boneyard skeleton registry — regenerated via `pnpm bones:build`
import '../bones/registry';
import { Geist } from "next/font/google";
import { cn } from "../lib/utils";
import { AuthProvider } from '../providers/auth-provider';
import { WhatsAppFloat } from '../components/molecules/whatsapp-float';

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: 'Préstamos App — Solicitud de préstamos online',
  description: 'Solicitá tu préstamo online en minutos. Proceso rápido, seguro y sin papeleo.',
  openGraph: {
    title: 'Préstamos App — Solicitud de préstamos online',
    description: 'Solicitá tu préstamo online en minutos. Proceso rápido, seguro y sin papeleo.',
    url: 'https://prestamos-app.com',
    siteName: 'Préstamos App',
    type: 'website',
    locale: 'es_BO',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Préstamos App — Solicitud de préstamos online',
    description: 'Solicitá tu préstamo online en minutos. Proceso rápido, seguro y sin papeleo.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={cn("font-sans", geist.variable)}>
      <body>
        <AuthProvider>{children}</AuthProvider>
        <WhatsAppFloat />
      </body>
    </html>
  );
}
