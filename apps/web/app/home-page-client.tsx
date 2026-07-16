'use client';

import { useState, useEffect } from 'react';
import { Skeleton } from 'boneyard-js/react';

export function HomePageClient() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <Skeleton name="hero-title" loading={loading}>
        <h1 className="text-4xl font-bold tracking-tight">
          Prestamos App
        </h1>
      </Skeleton>

      <Skeleton name="hero-subtitle" loading={loading} className="mt-4">
        <p className="text-lg text-gray-600">
          Tu plataforma financiera
        </p>
      </Skeleton>
    </main>
  );
}
