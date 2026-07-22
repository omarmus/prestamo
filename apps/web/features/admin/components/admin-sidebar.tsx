'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/atoms/ui/button';
import { Avatar, AvatarFallback } from '@/components/atoms/ui/avatar';
import { Separator } from '@/components/atoms/ui/separator';
import {
  LayoutDashboard,
  FileText,
  CreditCard,
  Users,
  UserCog,
  LogOut,
  Menu,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/atoms/ui/sheet';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/loans', label: 'Solicitudes', icon: FileText },
  { href: '/admin/loans/active', label: 'Préstamos Activos', icon: CreditCard },
  { href: '/admin/customers', label: 'Clientes', icon: Users },
  { href: '/admin/users', label: 'Usuarios', icon: UserCog },
];

export interface AdminSidebarProps {
  user: { name?: string; email?: string };
  pathname: string;
  onLogout: () => void;
}

export function AdminSidebar({ user, pathname, onLogout }: AdminSidebarProps) {
  const [open, setOpen] = useState(false);
  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? 'A';

  const sidebarContent = (
    <>
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
          const isActive =
            item.href === '/admin'
              ? pathname === '/admin'
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
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
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-64 flex-col border-r bg-card p-4 md:flex">
        {sidebarContent}
      </aside>

      {/* Mobile sheet drawer */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              className="fixed left-4 top-3 z-40 md:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
          }
        />
        <SheetContent side="left" showCloseButton={false} className="flex w-72 flex-col p-4">
          <SheetHeader className="px-0 pt-0">
            <SheetTitle className="sr-only">Menú de Administración</SheetTitle>
          </SheetHeader>
          {sidebarContent}
        </SheetContent>
      </Sheet>
    </>
  );
}
