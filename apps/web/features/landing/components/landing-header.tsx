'use client';

import { Menu } from 'lucide-react';
import Link from 'next/link';
import { buttonVariants } from '@/components/atoms/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/atoms/ui/sheet';
import { cn } from '@/lib/utils';

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="font-semibold text-lg">
          Préstamos App
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-4">
          <Link
            href="/login"
            className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
          >
            Iniciar sesión
          </Link>
          <Link
            href="/register"
            className={cn(buttonVariants({ variant: 'default', size: 'sm' }))}
          >
            Registrarse
          </Link>
        </div>

        {/* Mobile nav */}
        <Sheet>
          <SheetTrigger className={cn('md:hidden', buttonVariants({ variant: 'ghost', size: 'icon' }))}>
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent side="right">
            <nav className="flex flex-col gap-4 mt-8">
              <Link
                href="/login"
                className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'justify-start')}
              >
                Iniciar sesión
              </Link>
              <Link
                href="/register"
                className={cn(buttonVariants({ variant: 'default', size: 'sm' }), 'justify-start')}
              >
                Registrarse
              </Link>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
