'use client';

import { useRouter } from 'next/navigation';
import { LoginForm } from '../../features/auth/components/login-form';

export default function LoginPage() {
  const router = useRouter();

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <LoginForm onSuccess={() => router.push('/')} />
    </main>
  );
}
