
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { updateUserProfile } from '@/services/user-service';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AuthGuard } from '@/components/auth-guard';
import Link from 'next/link';

const profileSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  height: z.coerce.number().min(1, 'Height is required (in inches).').optional(),
  currentWeight: z.coerce.number().min(1, 'Current weight is required.'),
  dailyCalorieGoal: z.coerce.number().min(1000, 'Calorie goal must be at least 1000.').max(10000, 'Calorie goal seems too high.'),
});

function ProfilePageContent() {
    const { user, userProfile, profileLoading, refetchUserProfile } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<z.infer<typeof profileSchema>>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: '',
            height: undefined,
            currentWeight: undefined,
            dailyCalorieGoal: undefined,
        },
    });

    useEffect(() => {
        if (userProfile) {
            form.reset({
                name: userProfile.name || user?.displayName || '',
                height: userProfile.height,
                currentWeight: userProfile.currentWeight,
                dailyCalorieGoal: userProfile.dailyCalorieGoal,
            });
        }
    }, [userProfile, user, form]);

    const onSubmit = async (values: z.infer<typeof profileSchema>) => {
        if (!user) {
            toast({ title: "Error", description: "You must be logged in.", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);
        try {
            await updateUserProfile(user.uid, {
                name: values.name,
                height: values.height,
                currentWeight: values.currentWeight,
                dailyCalorieGoal: values.dailyCalorieGoal,
            });

            await refetchUserProfile();
            toast({ title: "Profile Updated!", description: "Your information has been saved." });
            router.push('/');

        } catch (error) {
            console.error("Profile update failed:", error);
            toast({ title: "Update Failed", description: "Could not save your profile. Please try again.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    if (profileLoading || !userProfile) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md shadow-xl">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <Link href="/" passHref>
                      <Button variant="outline" size="icon" aria-label="Go back">
                        <ArrowLeft className="h-4 w-4" />
                      </Button>
                    </Link>
                    <div>
                      <CardTitle className="text-2xl font-bold">Edit Profile</CardTitle>
                      <CardDescription>Update your personal information and goals.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField control={form.control} name="name" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl><Input placeholder="Jane Doe" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <div className="grid grid-cols-2 gap-4">
                                <FormField control={form.control} name="height" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Height (in)</FormLabel>
                                        <FormControl><Input type="number" placeholder="65" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="currentWeight" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Current Weight (lbs)</FormLabel>
                                        <FormControl><Input type="number" placeholder="150" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>
                            <FormField control={form.control} name="dailyCalorieGoal" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Daily Calorie Goal (kcal)</FormLabel>
                                    <FormControl><Input type="number" placeholder="2000" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <Button type="submit" className="w-full" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Changes
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </main>
    );
}

export default function ProfilePage() {
  return (
    <AuthGuard>
      <ProfilePageContent />
    </AuthGuard>
  );
}
