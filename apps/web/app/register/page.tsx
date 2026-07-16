'use client';

import { useRouter } from 'next/navigation';
import { RegisterForm } from '../../features/auth/components/register-form';

export default function RegisterPage() {
  const router = useRouter();

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <RegisterForm onSuccess={() => router.push('/')} />
    </main>
  );
}
