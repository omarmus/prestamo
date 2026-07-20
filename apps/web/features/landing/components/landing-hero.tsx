'use client';

import Link from 'next/link';
import { MessageCircle, UserPlus } from 'lucide-react';
import { buttonVariants } from '@/components/atoms/ui/button';
import { cn } from '@/lib/utils';

const whatsappPhone = process.env.NEXT_PUBLIC_WHATSAPP_PHONE;
const whatsappUrl = whatsappPhone
  ? `https://wa.me/${whatsappPhone}?text=Hola%2C%20quiero%20solicitar%20un%20pr%C3%A9stamo`
  : null;

export function LandingHero() {
  return (
    <section className="min-h-[80vh] flex items-center justify-center bg-gradient-to-b from-primary/10 via-background to-background">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
          Préstamos rápidos, seguros y sin papeleo
        </h1>
        <p className="mt-4 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          Accedé a tu préstamo en minutos desde tu celular. Sin garante, sin filas, 100% online.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ variant: 'default', size: 'lg' }))}
            >
              <MessageCircle className="mr-2 h-5 w-5" />
              Solicitar por WhatsApp
            </a>
          )}
          <Link
            href="/register"
            className={cn(buttonVariants({ variant: 'outline', size: 'lg' }))}
          >
            <UserPlus className="mr-2 h-5 w-5" />
            Crear Cuenta
          </Link>
        </div>
      </div>
    </section>
  );
}
