'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { Button } from '@/components/atoms/ui/button';
import { PortalSidebar } from '@/features/portal/components/portal-sidebar';
import { Loader2, LogOut } from 'lucide-react';
import { Toaster } from '@/components/atoms/ui/sonner';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </main>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="flex min-h-screen">
      <PortalSidebar user={{ name: user?.name, email: user?.email }} pathname={pathname} onLogout={logout} />

      <div className="flex flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="flex items-center justify-between border-b px-4 py-3 md:hidden">
          <p className="text-sm font-medium">{user?.name}</p>
          <Button variant="ghost" size="icon" onClick={logout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </header>

        {/* Main content */}
        <main className="flex-1 p-4 pb-20 md:pb-4">
          {children}
        </main>
      </div>

      <Toaster />
    </div>
  );
}
