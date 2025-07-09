
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
    // Wait until both auth and profile state are fully resolved.
    if (loading || profileLoading) {
      return; 
    }

    const isAuthPage = pathname === '/login' || pathname === '/onboarding';

    // Rule 1: User is not logged in.
    if (!user) {
      // If they are on a protected page, they must be sent to the login page.
      if (!isAuthPage) {
        router.push('/login');
      }
      // Otherwise, they are on an auth page, so let them stay.
      return;
    }

    // From here, we know `user` exists.

    // Rule 2: User is logged in, but has not completed onboarding.
    if (!userProfile?.onboarded) {
      // If they are not on the onboarding page, they must be sent there.
      if (pathname !== '/onboarding') {
        router.push('/onboarding');
      }
      // If they are already on the onboarding page, let them stay.
      return;
    }

    // Rule 3: User is logged in AND has completed onboarding.
    if (userProfile.onboarded) {
      // If they are on an auth page (e.g., /login), they should not be.
      // Send them to the main app.
      if (isAuthPage) {
        router.push('/');
      }
      // If they are on any other (protected) page, let them stay.
    }
    
  }, [user, userProfile, loading, profileLoading, pathname, router]);

  // Determine if a loading skeleton should be shown. This is for when the guard
  // is actively about to redirect the user, preventing a flash of incorrect content.
  const isAuthPage = pathname === '/login' || pathname === '/onboarding';
  let showLoadingSkeleton = false;

  // Show skeleton if we are still fetching auth/profile data.
  if (loading || profileLoading) {
    showLoadingSkeleton = true;
  }
  // Or if the final state is incongruous with the current page.
  else if (!user && !isAuthPage) {
    showLoadingSkeleton = true; // Logged out, but on a protected page.
  } else if (user && !userProfile?.onboarded && pathname !== '/onboarding') {
    showLoadingSkeleton = true; // Logged in, not onboarded, but on wrong page.
  } else if (user && userProfile?.onboarded && isAuthPage) {
    showLoadingSkeleton = true; // Logged in, onboarded, but on an auth page.
  }


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

  // If we are not in a loading or redirecting state, render the actual page content.
  return <>{children}</>;
}
