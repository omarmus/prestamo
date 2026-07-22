'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { AdminSidebar } from '@/features/admin/components/admin-sidebar';
import { Loader2 } from 'lucide-react';
import { Toaster } from '@/components/atoms/ui/sonner';

export function AdminLayoutContent({ children }: { children: React.ReactNode }) {
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
      <AdminSidebar user={{ name: user?.name, email: user?.email }} pathname={pathname} onLogout={logout} />

      <div className="flex flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="flex items-center justify-end border-b px-4 py-3 md:hidden">
          <p className="text-sm font-medium">{user?.name}</p>
        </header>

        {/* Main content wrapper */}
        <main className="flex-1 p-4 md:p-8">
          {children}
        </main>
      </div>

      <Toaster />
    </div>
  );
}
