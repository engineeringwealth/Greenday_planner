'use client';

import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';

export default function LoginPage() {
  const { signInWithGoogle, user, loading, isFirebaseConfigured } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/');
    }
  }, [user, loading, router]);

  const GoogleIcon = () => (
    <svg className="mr-2 h-4 w-4" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039L38.397 7.618C34.321 4.045 29.356 2 24 2 11.854 2 2 11.854 2 24s9.854 22 22 22c11.982 0 21.417-9.035 21.99-20.835l.021-.832z" />
      <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.436-5.436C34.321 4.045 29.356 2 24 2 16.318 2 9.656 6.124 6.306 14.691z" />
      <path fill="#4CAF50" d="M24 46c5.356 0 10.321-1.989 14.045-5.386l-6.522-5.33c-2.31 1.455-5.093 2.31-8.523 2.31-5.222 0-9.641-3.108-11.303-8H4.386C7.146 38.645 14.996 46 24 46z" />
      <path fill="#1976D2" d="M43.611 20.083H24v8h11.303a12.016 12.016 0 01-4.832 7.323l6.522 5.33C45.386 36.885 48 30.773 48 24c0-2.115-.183-4.164-.529-6.168L43.611 20.083z" />
    </svg>
  );

  if (loading || user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
          <CardDescription>Sign in to access your GreenDay Planner.</CardDescription>
        </CardHeader>
        <CardContent>
          {isFirebaseConfigured ? (
            <Button
              onClick={signInWithGoogle}
              className="w-full"
              variant="outline"
            >
              <GoogleIcon />
              Sign in with Google
            </Button>
          ) : (
            <Alert variant="destructive">
              <Terminal className="h-4 w-4" />
              <AlertTitle>Firebase Not Configured</AlertTitle>
              <AlertDescription>
                Your Firebase API key is missing. Please add it to your{' '}
                <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">
                  .env.local
                </code>{' '}
                file.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
