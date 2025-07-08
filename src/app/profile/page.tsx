
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
import { updateUserProfile, addWeightHistory } from '@/services/user-service';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AuthGuard } from '@/components/auth-guard';
import Link from 'next/link';
import type { UserProfile } from '@/lib/types';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const profileSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  height: z.coerce.number().min(1, 'Height is required.').optional(),
  currentWeight: z.coerce.number().min(1, 'Current weight is required.'),
  desiredWeight: z.coerce.number().min(1, 'Desired weight is required.'),
  goalTimeline: z.coerce.number().min(1, 'Please select a timeline.'),
  dailyCalorieGoal: z.coerce.number().min(1000, 'Calorie goal must be at least 1000.').max(10000, 'Calorie goal seems too high.'),
});


// Helper functions for calculations
const calculateDailyCalorieGoal = (currentWeight: number, desiredWeight: number, timelineInWeeks: number) => {
    const weightDifferenceLbs = currentWeight - desiredWeight;
    const totalCalorieDifference = weightDifferenceLbs * 3500;
    const days = timelineInWeeks * 7;
    
    if (days <= 0) return 2000;
  
    const dailyCalorieDelta = totalCalorieDifference / days;
    const estimatedTDEE = currentWeight * 14;
    const goal = Math.round(estimatedTDEE - dailyCalorieDelta);
  
    return Math.max(1200, Math.min(4000, goal));
};

const calculateBmi = (weightLbs: number, heightInches: number) => {
    if (!weightLbs || !heightInches || heightInches <= 0) return null;
    const weightKg = weightLbs * 0.453592;
    const heightM = heightInches * 0.0254;
    const bmi = weightKg / (heightM * heightM);
    return Math.round(bmi * 10) / 10;
};


function ProfilePageContent() {
    const { user, userProfile, profileLoading, refetchUserProfile } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [units, setUnits] = useState<UserProfile['units']>('imperial');
    const [calculatedBmi, setCalculatedBmi] = useState<number | null>(null);

    const form = useForm<z.infer<typeof profileSchema>>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: '',
            height: undefined,
            currentWeight: undefined,
            desiredWeight: undefined,
            goalTimeline: undefined,
            dailyCalorieGoal: undefined,
        },
    });

    const { watch, setValue } = form;
    const formValues = watch();

    useEffect(() => {
        if (userProfile) {
            const displayUnits = userProfile.units || 'imperial';
            setUnits(displayUnits);

            const round = (num: number) => Math.round(num * 10) / 10;

            const displayValues = {
                name: userProfile.name || user?.displayName || '',
                dailyCalorieGoal: userProfile.dailyCalorieGoal,
                height: userProfile.height,
                currentWeight: userProfile.currentWeight,
                desiredWeight: userProfile.desiredWeight,
                goalTimeline: userProfile.goalTimeline,
            };

            if (displayUnits === 'metric') {
                if (displayValues.height) displayValues.height = round(displayValues.height * 2.54);
                if (displayValues.currentWeight) displayValues.currentWeight = round(displayValues.currentWeight * 0.453592);
                if (displayValues.desiredWeight) displayValues.desiredWeight = round(displayValues.desiredWeight * 0.453592);
            }
            
            form.reset(displayValues);
        }
    }, [userProfile, user, form]);

    useEffect(() => {
        const { currentWeight, desiredWeight, goalTimeline, height } = formValues;
        
        // Calculate BMI
        if (currentWeight && height && units) {
            let imperialWeight = currentWeight;
            let imperialHeight = height;
            if (units === 'metric') {
                imperialWeight = currentWeight / 0.453592;
                imperialHeight = height / 2.54;
            }
            const bmi = calculateBmi(imperialWeight, imperialHeight);
            setCalculatedBmi(bmi);
        }

        // Calculate recommended calorie goal
        if (currentWeight && desiredWeight && goalTimeline && units) {
            let imperialCurrentWeight = currentWeight;
            let imperialDesiredWeight = desiredWeight;

            if (units === 'metric') {
                imperialCurrentWeight = currentWeight / 0.453592;
                imperialDesiredWeight = desiredWeight / 0.453592;
            }
            
            const calorieGoal = calculateDailyCalorieGoal(imperialCurrentWeight, imperialDesiredWeight, goalTimeline);
            setValue('dailyCalorieGoal', calorieGoal, { shouldValidate: true });
        }

    }, [formValues, units, setValue]);

    const handleUnitChange = (newUnit: UserProfile['units']) => {
        if (units === newUnit) return;

        const { height, currentWeight, desiredWeight } = form.getValues();
        const round = (num: number) => Math.round(num * 10) / 10;
        
        if (newUnit === 'metric') {
            if (height) form.setValue('height', round(height * 2.54), { shouldValidate: true });
            if (currentWeight) form.setValue('currentWeight', round(currentWeight * 0.453592), { shouldValidate: true });
            if (desiredWeight) form.setValue('desiredWeight', round(desiredWeight * 0.453592), { shouldValidate: true });
        } else { // newUnit is 'imperial'
            if (height) form.setValue('height', round(height / 2.54), { shouldValidate: true });
            if (currentWeight) form.setValue('currentWeight', round(currentWeight / 0.453592), { shouldValidate: true });
            if (desiredWeight) form.setValue('desiredWeight', round(desiredWeight / 0.453592), { shouldValidate: true });
        }

        setUnits(newUnit);
    };

    const onSubmit = async (values: z.infer<typeof profileSchema>) => {
        if (!user || !userProfile) {
            toast({ title: "Error", description: "You must be logged in.", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);
        try {
            const imperialValues = { ...values };
            if (units === 'metric') {
                if(values.height) imperialValues.height = values.height / 2.54;
                imperialValues.currentWeight = values.currentWeight / 0.453592;
                imperialValues.desiredWeight = values.desiredWeight / 0.453592;
            }

            // Only add a weight history entry if the weight has changed
            if (Math.abs(imperialValues.currentWeight - userProfile.currentWeight) > 0.1) {
                await addWeightHistory(user.uid, imperialValues.currentWeight);
            }

            await updateUserProfile(user.uid, {
                name: imperialValues.name,
                height: imperialValues.height,
                currentWeight: imperialValues.currentWeight,
                desiredWeight: imperialValues.desiredWeight,
                goalTimeline: imperialValues.goalTimeline,
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
                             <FormField control={form.control} name="height" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Height ({units === 'imperial' ? 'in' : 'cm'})</FormLabel>
                                    <FormControl><Input type="number" step="0.1" placeholder={units === 'imperial' ? "65" : "165"} {...field} value={field.value ?? ''} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <div className="grid grid-cols-2 gap-4">
                               <FormField control={form.control} name="currentWeight" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Weight ({units === 'imperial' ? 'lbs' : 'kg'})</FormLabel>
                                        <FormControl><Input type="number" step="0.1" placeholder={units === 'imperial' ? "150" : "68"} {...field} value={field.value ?? ''} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                               <FormField control={form.control} name="desiredWeight" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Desired Weight ({units === 'imperial' ? 'lbs' : 'kg'})</FormLabel>
                                        <FormControl><Input type="number" step="0.1" placeholder={units === 'imperial' ? "140" : "64"} {...field} value={field.value ?? ''} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>
                            <FormField control={form.control} name="goalTimeline" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Goal Timeline</FormLabel>
                                    <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                                    <FormControl>
                                        <SelectTrigger><SelectValue placeholder="Select a timeframe" /></SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="4">4 Weeks</SelectItem>
                                        <SelectItem value="8">8 Weeks</SelectItem>
                                        <SelectItem value="12">12 Weeks</SelectItem>
                                        <SelectItem value="16">16 Weeks</SelectItem>
                                    </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}/>

                            {calculatedBmi && (
                                <div className="text-sm p-3 bg-muted/50 rounded-lg">
                                    Your calculated BMI is <span className="font-bold text-foreground">{calculatedBmi.toFixed(1)}</span>.
                                </div>
                            )}

                            <FormField control={form.control} name="dailyCalorieGoal" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Daily Calorie Goal (kcal)</FormLabel>
                                    <FormControl><Input type="number" placeholder="2000" {...field} value={field.value ?? ''} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl>
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
