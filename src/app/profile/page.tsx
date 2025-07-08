
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
import type { UserProfile } from '@/lib/types';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const profileSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  height: z.coerce.number().min(1, 'Height is required.').optional(),
  currentWeight: z.coerce.number().min(1, 'Current weight is required.'),
  dailyCalorieGoal: z.coerce.number().min(1000, 'Calorie goal must be at least 1000.').max(10000, 'Calorie goal seems too high.'),
});

function ProfilePageContent() {
    const { user, userProfile, profileLoading, refetchUserProfile } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [units, setUnits] = useState<UserProfile['units']>('imperial');

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
            const displayUnits = userProfile.units || 'imperial';
            setUnits(displayUnits);

            const displayValues = {
                name: userProfile.name || user?.displayName || '',
                dailyCalorieGoal: userProfile.dailyCalorieGoal,
                height: userProfile.height,
                currentWeight: userProfile.currentWeight,
            };

            const round = (num: number) => Math.round(num * 10) / 10;

            if (displayUnits === 'metric') {
                if (displayValues.height) displayValues.height = round(displayValues.height * 2.54);
                if (displayValues.currentWeight) displayValues.currentWeight = round(displayValues.currentWeight * 0.453592);
            }
            
            form.reset(displayValues);
        }
    }, [userProfile, user, form]);

    const handleUnitChange = (newUnit: UserProfile['units']) => {
        if (units === newUnit) return;

        const { height, currentWeight } = form.getValues();
        const round = (num: number) => Math.round(num * 10) / 10;
        
        if (newUnit === 'metric') {
            if (height) form.setValue('height', round(height * 2.54), { shouldValidate: true });
            if (currentWeight) form.setValue('currentWeight', round(currentWeight * 0.453592), { shouldValidate: true });
        } else { // newUnit is 'imperial'
            if (height) form.setValue('height', round(height / 2.54), { shouldValidate: true });
            if (currentWeight) form.setValue('currentWeight', round(currentWeight / 0.453592), { shouldValidate: true });
        }

        setUnits(newUnit);
    };

    const onSubmit = async (values: z.infer<typeof profileSchema>) => {
        if (!user) {
            toast({ title: "Error", description: "You must be logged in.", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);
        try {
            const imperialValues = { ...values };
            if (units === 'metric') {
                if(values.height) imperialValues.height = values.height / 2.54;
                imperialValues.currentWeight = values.currentWeight / 0.453592;
            }

            await updateUserProfile(user.uid, {
                name: imperialValues.name,
                height: imperialValues.height,
                currentWeight: imperialValues.currentWeight,
                dailyCalorieGoal: imperialValues.dailyCalorieGoal,
                units,
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
                            <FormField
                                control={form.control}
                                name="units"
                                render={({ field }) => (
                                <FormItem className="space-y-3">
                                    <FormLabel>Units</FormLabel>
                                    <FormControl>
                                    <RadioGroup
                                        onValueChange={handleUnitChange}
                                        value={units}
                                        className="flex space-x-4"
                                    >
                                        <FormItem className="flex items-center space-x-2">
                                        <FormControl><RadioGroupItem value="imperial" id="imperial" /></FormControl>
                                        <FormLabel htmlFor="imperial" className="font-normal">lbs / inches</FormLabel>
                                        </FormItem>
                                        <FormItem className="flex items-center space-x-2">
                                        <FormControl><RadioGroupItem value="metric" id="metric" /></FormControl>
                                        <FormLabel htmlFor="metric" className="font-normal">kg / cm</FormLabel>
                                        </FormItem>
                                    </RadioGroup>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />

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
                                        <FormLabel>Height ({units === 'imperial' ? 'in' : 'cm'})</FormLabel>
                                        <FormControl><Input type="number" step="0.1" placeholder={units === 'imperial' ? "65" : "165"} {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="currentWeight" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Weight ({units === 'imperial' ? 'lbs' : 'kg'})</FormLabel>
                                        <FormControl><Input type="number" step="0.1" placeholder={units === 'imperial' ? "150" : "68"} {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl>
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
