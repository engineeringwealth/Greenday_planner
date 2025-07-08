
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { updateUserProfile, addWeightHistory } from '@/services/user-service';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { UserProfile } from '@/lib/types';

const onboardingSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  height: z.coerce.number().min(1, 'Height is required.'),
  currentWeight: z.coerce.number().min(1, 'Current weight is required.'),
  desiredWeight: z.coerce.number().min(1, 'Desired weight is required.'),
  goalTimeline: z.coerce.number().min(1, 'Please select a timeline.'),
});

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

export default function OnboardingPage() {
  const { user, userProfile, profileLoading, refetchUserProfile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [units, setUnits] = useState<UserProfile['units']>('imperial');

  useEffect(() => {
    if (!profileLoading && userProfile?.onboarded) {
      router.push('/');
    }
  }, [userProfile, profileLoading, router]);

  const form = useForm<z.infer<typeof onboardingSchema>>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      name: user?.displayName ?? '',
      height: undefined,
      currentWeight: undefined,
      desiredWeight: undefined,
      goalTimeline: undefined,
    },
  });

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

  const onSubmit = async (values: z.infer<typeof onboardingSchema>) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to continue.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      const imperialValues = { ...values };
      if (units === 'metric') {
        imperialValues.height = values.height / 2.54;
        imperialValues.currentWeight = values.currentWeight / 0.453592;
        imperialValues.desiredWeight = values.desiredWeight / 0.453592;
      }
      
      const dailyCalorieGoal = calculateDailyCalorieGoal(imperialValues.currentWeight, imperialValues.desiredWeight, imperialValues.goalTimeline);
      
      await updateUserProfile(user.uid, {
        name: values.name,
        height: imperialValues.height,
        currentWeight: imperialValues.currentWeight,
        desiredWeight: imperialValues.desiredWeight,
        goalTimeline: values.goalTimeline,
        dailyCalorieGoal,
        onboarded: true,
        units,
      });

      // Add first entry to weight history
      await addWeightHistory(user.uid, imperialValues.currentWeight);

      await refetchUserProfile();
      toast({ title: "Profile Updated!", description: "Your calorie goal has been set." });
      router.push('/');

    } catch (error) {
      console.error("Onboarding failed:", error);
      toast({
        title: "Submission Failed",
        description: "Could not save your profile. Please try again.",
        variant: "destructive",
      });
    } finally {
        setIsSubmitting(false);
    }
  };

  if (profileLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (userProfile?.onboarded) {
    return (
         <div className="flex min-h-screen items-center justify-center">
            <p>Redirecting...</p>
         </div>
    )
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Welcome to SnapCalTracker!</CardTitle>
          <CardDescription>Let's set up your goals to personalize your experience.</CardDescription>
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
                        defaultValue={units}
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
              )}/>
               <FormField control={form.control} name="height" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Height ({units === 'imperial' ? 'in' : 'cm'})</FormLabel>
                    <FormControl><Input type="number" step="0.1" placeholder={units === 'imperial' ? "65" : "165"} {...field} onChange={e => field.onChange(parseFloat(e.target.value))}/></FormControl>
                    <FormMessage />
                  </FormItem>
              )}/>

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="currentWeight" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Weight ({units === 'imperial' ? 'lbs' : 'kg'})</FormLabel>
                      <FormControl><Input type="number" step="0.1" placeholder={units === 'imperial' ? "150" : "68"} {...field} onChange={e => field.onChange(parseFloat(e.target.value))}/></FormControl>
                      <FormMessage />
                    </FormItem>
                )}/>
                <FormField control={form.control} name="desiredWeight" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Desired Weight ({units === 'imperial' ? 'lbs' : 'kg'})</FormLabel>
                      <FormControl><Input type="number" step="0.1" placeholder={units === 'imperial' ? "140" : "63.5"} {...field} onChange={e => field.onChange(parseFloat(e.target.value))}/></FormControl>
                      <FormMessage />
                    </FormItem>
                )}/>
              </div>

              <FormField control={form.control} name="goalTimeline" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Goal Timeline</FormLabel>
                    <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value?.toString()}>
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

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save and Continue
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </main>
  );
}
