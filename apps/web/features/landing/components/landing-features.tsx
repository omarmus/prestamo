'use client';

import { Card, CardContent } from '@/components/atoms/ui/card';
import { Smartphone, Zap, ShieldCheck } from 'lucide-react';

const features = [
  {
    icon: Smartphone,
    title: 'Solicitud Online',
    description: 'Completá tu solicitud en minutos desde cualquier dispositivo. Sin papeles ni filas.',
  },
  {
    icon: Zap,
    title: 'Aprobación Rápida',
    description: 'Recibí una respuesta en menos de 24 horas. Te depositamos directo a tu cuenta.',
  },
  {
    icon: ShieldCheck,
    title: 'Sin Garante',
    description: 'Accedé a tu préstamo sin necesidad de garante ni codeudor. 100% a tu nombre.',
  },
];

export function LandingFeatures() {
  return (
    <section className="py-16 md:py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">¿Cómo funciona?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title}>
                <CardContent className="pt-6">
                  <Icon className="h-10 w-10 text-primary mb-4" />
                  <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
