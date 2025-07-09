
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

const signInSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(1, { message: "Password cannot be empty." }),
});

function SignInForm() {
    const { signInWithEmail, loading, profileLoading } = useAuth();
    const form = useForm<z.infer<typeof signInSchema>>({
      resolver: zodResolver(signInSchema),
      defaultValues: { email: "", password: "" },
    });
    
    const onSubmit = (values: z.infer<typeof signInSchema>) => {
      signInWithEmail(values.email, values.password);
    };

    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField control={form.control} name="email" render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl><Input placeholder="m@example.com" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="password" render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl><Input type="password" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <Button type="submit" className="w-full" disabled={loading || profileLoading}>Sign In</Button>
        </form>
      </Form>
    );
};

const GoogleIcon = () => (
    <svg className="mr-2 h-4 w-4" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039L38.397 7.618C34.321 4.045 29.356 2 24 2 11.854 2 2 11.854 2 24s9.854 22 22 22c11.982 0 21.417-9.035 21.99-20.835l.021-.832z" />
      <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.436-5.436C34.321 4.045 29.356 2 24 2 16.318 2 9.656 6.124 6.306 14.691z" />
      <path fill="#4CAF50" d="M24 46c5.356 0 10.321-1.989 14.045-5.386l-6.522-5.33c-2.31 1.455-5.093 2.31-8.523 2.31-5.222 0-9.641-3.108-11.303-8H4.386C7.146 38.645 14.996 46 24 46z" />
      <path fill="#1976D2" d="M43.611 20.083H24v8h11.303a12.016 12.016 0 01-4.832 7.323l6.522 5.33C45.386 36.885 48 30.773 48 24c0-2.115-.183-4.164-.529-6.168L43.611 20.083z" />
    </svg>
);
  
export default function LoginPage() {
  const { 
    user, 
    loading, 
    userProfile,
    profileLoading,
    isFirebaseConfigured,
    signInWithGoogle, 
  } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // This effect handles the crucial redirect AFTER a user has logged in
    // and their profile has been fully loaded.
    if (user && !profileLoading) {
      if (userProfile?.onboarded) {
        router.push('/');
      } else {
        // This covers new signups or users who abandoned onboarding.
        router.push('/onboarding');
      }
    }
  }, [user, userProfile, profileLoading, router]);
  
  // If the initial auth check is happening, OR if a user has logged in and
  // we are waiting for their profile to load, show the loading screen.
  // This is the state that prevents the app from getting stuck.
  if (loading || user) {
      return (
          <main className="flex min-h-screen items-center justify-center bg-background p-4">
              <div className="flex items-center">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <p className="ml-4">Loading your experience...</p>
              </div>
          </main>
      );
  }
  
  // Only when loading is complete AND there is no user, show the login form.
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">Myetician</CardTitle>
          <CardDescription>Welcome back! Sign in to continue.</CardDescription>
        </CardHeader>
        <CardContent>
          {!isFirebaseConfigured ? (
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
          ) : (
            <>
              <SignInForm />
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>

              <Button onClick={() => signInWithGoogle()} className="w-full" variant="outline">
                <GoogleIcon />
                Sign in with Google
              </Button>

              <div className="mt-6 text-center text-sm">
                New to Myetician?{' '}
                <Link href="/onboarding" className="font-semibold text-primary hover:underline">
                  Start the questionnaire
                </Link>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
