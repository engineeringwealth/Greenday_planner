
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
    if (!isAuthReady) {
      return; // Wait until authentication status is resolved
    }

    const isAuthPage = pathname === '/onboarding' || pathname === '/login';

    // Case 1: User is not logged in.
    if (!user) {
      // If they are not on an auth page, redirect to login.
      if (!isAuthPage) {
        router.push('/login');
      }
      // Otherwise, they are on an auth page, so we do nothing and let them sign in/up.
      return;
    }

    // Case 2: User is logged in.
    const hasOnboarded = userProfile?.onboarded;

    if (!hasOnboarded && pathname !== '/onboarding') {
      // If they haven't onboarded, they must be sent to the onboarding page.
      router.push('/onboarding');
    } else if (hasOnboarded && isAuthPage) {
      // If they HAVE onboarded and are trying to access an auth page, send them to the app home.
      router.push('/');
    }
  }, [user, userProfile, loading, profileLoading, pathname]);

  // Determine if we should show a loading skeleton or the actual content.
  // We show a skeleton if we're waiting for auth data, or if the user is not yet authorized for the current page.
  const showLoadingSkeleton = 
    loading || 
    profileLoading || 
    !user || 
    (!userProfile?.onboarded && pathname !== '/onboarding');


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
