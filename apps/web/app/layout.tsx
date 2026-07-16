import type { Metadata } from 'next';
import './globals.css';

// Boneyard skeleton registry — regenerated via `pnpm bones:build`
import '../bones/registry';
import { Geist } from "next/font/google";
import { cn } from "../lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: 'Prestamos App',
  description: 'Tu plataforma financiera',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={cn("font-sans", geist.variable)}>
      <body>{children}</body>
    </html>
  );
}
