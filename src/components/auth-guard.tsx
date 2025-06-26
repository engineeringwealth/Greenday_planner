'use client';

import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export function AuthGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <header className="flex items-center justify-between mb-8">
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-10 w-40" />
            </header>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <aside className="lg:col-span-1">
                    <Skeleton className="h-[300px] w-full rounded-md" />
                </aside>
                <main className="lg:col-span-2">
                    <Skeleton className="h-[400px] w-full rounded-md" />
                </main>
            </div>
        </div>
    );
  }

  return <>{children}</>;
}
