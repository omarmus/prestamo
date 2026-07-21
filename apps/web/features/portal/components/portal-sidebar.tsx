'use client';

import Link from 'next/link';
import { Button } from '@/components/atoms/ui/button';
import { Avatar, AvatarFallback } from '@/components/atoms/ui/avatar';
import { Separator } from '@/components/atoms/ui/separator';
import {
  LayoutDashboard,
  UserCircle,
  FileText,
  Calculator,
  CreditCard,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/portal/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/portal/profile', label: 'Mi Perfil', icon: UserCircle },
  { href: '/portal/documents', label: 'Documentos', icon: FileText },
  { href: '/portal/loans', label: 'Mis Préstamos', icon: CreditCard },
  { href: '/portal/simulator', label: 'Simulador', icon: Calculator },
];

export interface PortalSidebarProps {
  user: { name?: string; email?: string };
  pathname: string;
  onLogout: () => void;
}

export function PortalSidebar({ user, pathname, onLogout }: PortalSidebarProps) {
  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? 'U';

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-64 flex-col border-r bg-card p-4 md:flex">
        <div className="mb-6 flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{user?.name}</p>
            <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-4">
          <Separator className="mb-4" />
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground"
            onClick={onLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar sesión
          </Button>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 flex border-t bg-card md:hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-1 flex-col items-center gap-1 py-2 text-xs transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
