
'use client';

import { useAuth } from '@/contexts/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export function AuthGuard({ children }: { children: ReactNode }) {
  const { user, loading, userProfile, profileLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const isAuthReady = !loading && !profileLoading;

    if (isAuthReady) {
      if (!user) {
        // If not logged in, redirect to login page.
        router.push('/login');
      } else if ((!userProfile || !userProfile.onboarded) && pathname !== '/onboarding') {
        // If logged in but not onboarded, redirect to onboarding.
        // Avoids a redirect loop if we are already on the onboarding page.
        router.push('/onboarding');
      }
    }
  }, [user, userProfile, loading, profileLoading, router, pathname]);

  // Determine if we should show loading skeleton or content
  const showLoadingSkeleton = loading || profileLoading || !user || (!userProfile?.onboarded && pathname !== '/onboarding');

  if (showLoadingSkeleton) {
    return (
      <div className="w-full max-w-sm bg-background rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden h-full sm:h-auto sm:max-h-[90vh] mx-auto mt-4 sm:mt-8 p-4">
        <header className="flex items-center justify-between flex-shrink-0 mb-6">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </header>
        <main className="flex-1 space-y-6">
          <Skeleton className="h-12 w-full" />
          <div className="flex justify-center items-center py-4">
            <Skeleton className="h-64 w-64 rounded-full" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Skeleton className="h-24 w-full rounded-3xl" />
            <Skeleton className="h-24 w-full rounded-3xl" />
            <Skeleton className="h-24 w-full rounded-3xl" />
          </div>
          <div>
            <Skeleton className="h-8 w-40 mb-4" />
            <div className="space-y-3">
              <Skeleton className="h-[100px] w-full rounded-2xl" />
              <Skeleton className="h-[100px] w-full rounded-2xl" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  return <>{children}</>;
}
