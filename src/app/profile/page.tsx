
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { updateUserProfile } from '@/services/user-service';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AuthGuard } from '@/components/auth-guard';
import Link from 'next/link';
import type { UserProfile, OnboardingData } from '@/lib/types';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { calculateHealthMetrics } from '@/lib/health-utils';
import { cn } from '@/lib/utils';


function ProfilePageContent() {
    const { user, userProfile, profileLoading, refetchUserProfile } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState<OnboardingData | null>(null);

    useEffect(() => {
        if (userProfile) {
            // Use default values for any fields that might be missing from the user profile
            // This prevents calculations from resulting in NaN
            const safeUserProfile = {
                goal: userProfile.goal ?? 'lose',
                name: userProfile.name ?? '',
                activityLevel: userProfile.activityLevel ?? 'lightly',
                gender: userProfile.gender ?? 'male',
                dob: userProfile.dob ?? '',
                units: userProfile.units ?? 'metric',
                height: userProfile.height ?? 67, // default inches
                currentWeight: userProfile.currentWeight ?? 154, // default lbs
                goalWeight: userProfile.goalWeight ?? 143, // default lbs
                intensity: userProfile.intensity ?? 20,
            };

            setFormData({
                goal: safeUserProfile.goal as any,
                name: safeUserProfile.name,
                activityLevel: safeUserProfile.activityLevel as any,
                gender: safeUserProfile.gender as any,
                dob: safeUserProfile.dob,
                units: safeUserProfile.units as any,
                // Convert to display units
                height: safeUserProfile.units === 'metric' ? safeUserProfile.height * 2.54 : safeUserProfile.height,
                currentWeight: safeUserProfile.units === 'metric' ? safeUserProfile.currentWeight * 0.453592 : safeUserProfile.currentWeight,
                goalWeight: safeUserProfile.units === 'metric' ? safeUserProfile.goalWeight * 0.453592 : safeUserProfile.goalWeight,
                intensity: safeUserProfile.intensity,
            });
        }
    }, [userProfile]);
    
    const healthMetrics = useMemo(() => {
        if (!formData) return null;
        return calculateHealthMetrics(formData);
    }, [formData]);

    const handleUnitChange = (newUnits: 'metric' | 'imperial') => {
        if (!formData || formData.units === newUnits) return;
        
        const round = (num: number) => Math.round(num * 10) / 10;
        let { height, currentWeight, goalWeight } = formData;

        if (newUnits === 'metric') { // from imperial to metric
            height = round(height * 2.54);
            currentWeight = round(currentWeight * 0.453592);
            goalWeight = round(goalWeight * 0.453592);
        } else { // from metric to imperial
            height = round(height / 2.54);
            currentWeight = round(currentWeight / 0.453592);
            goalWeight = round(goalWeight / 0.453592);
        }
        setFormData(prev => prev ? ({ ...prev, units: newUnits, height, currentWeight, goalWeight }) : null);
    }

    const onSubmit = async () => {
        if (!user || !formData) {
            toast({ title: "Error", description: "You must be logged in.", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);
        try {
            const finalProfileData: Partial<UserProfile> = {
                ...formData,
                ...calculateHealthMetrics(formData)
            };
            
            // Convert back to imperial for storage
            if (formData.units === 'metric') {
                finalProfileData.height = formData.height / 2.54;
                finalProfileData.currentWeight = formData.currentWeight / 0.453592;
                finalProfileData.goalWeight = formData.goalWeight / 0.453592;
            }

            await updateUserProfile(user.uid, finalProfileData);
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
    
    if (profileLoading || !userProfile || !formData) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }
    
    const isMetric = formData.units === 'metric';

    return (
        <main className="flex min-h-screen items-center justify-center bg-background p-4">
            <Card className="w-full max-w-2xl shadow-xl">
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
                <CardContent className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="space-y-6">
                           <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Your Name" />
                           
                            <div>
                               <h3 className="text-base font-medium mb-2">Primary Goal</h3>
                                <RadioGroup
                                    value={formData.goal}
                                    onValueChange={(value) => setFormData({ ...formData, goal: value as any })}
                                    className="grid grid-cols-3 gap-2"
                                >
                                    {['lose', 'maintain', 'gain'].map(g => (
                                        <label key={g} htmlFor={`goal-${g}`} className={cn("flex items-center text-sm justify-center p-2 rounded-md border-2 cursor-pointer transition-colors h-10", formData.goal === g ? "border-primary bg-primary/10" : "border-card hover:border-primary/50")}>
                                            {g.charAt(0).toUpperCase() + g.slice(1)}
                                            <RadioGroupItem value={g} id={`goal-${g}`} className="sr-only" />
                                        </label>
                                    ))}
                                </RadioGroup>
                            </div>

                           <div>
                               <h3 className="text-base font-medium mb-2">Gender</h3>
                                <RadioGroup
                                    value={formData.gender}
                                    onValueChange={(value) => setFormData({ ...formData, gender: value as any })}
                                    className="grid grid-cols-2 gap-4"
                                >
                                     <label htmlFor="male" className={cn("flex items-center justify-center p-2 rounded-md border-2 cursor-pointer transition-colors h-10", formData.gender === 'male' ? "border-primary bg-primary/10" : "border-card hover:border-primary/50")}>
                                        Male
                                        <RadioGroupItem value="male" id="male" className="sr-only" />
                                    </label>
                                    <label htmlFor="female" className={cn("flex items-center justify-center p-2 rounded-md border-2 cursor-pointer transition-colors h-10", formData.gender === 'female' ? "border-primary bg-primary/10" : "border-card hover:border-primary/50")}>
                                        Female
                                        <RadioGroupItem value="female" id="female" className="sr-only" />
                                    </label>
                                </RadioGroup>
                            </div>
                           
                            <div>
                                <h3 className="text-base font-medium mb-2">Activity Level</h3>
                                <Select value={formData.activityLevel} onValueChange={value => setFormData({...formData, activityLevel: value as any})}>
                                    <SelectTrigger><SelectValue/></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="sedentary">Sedentary</SelectItem>
                                        <SelectItem value="lightly">Lightly Active</SelectItem>
                                        <SelectItem value="moderately">Moderately Active</SelectItem>
                                        <SelectItem value="very">Very Active</SelectItem>
                                        <SelectItem value="extremely">Extremely Active</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                       </div>
                       <div className="space-y-6">
                           <div className="flex justify-end">
                                <Select value={formData.units} onValueChange={(val) => handleUnitChange(val as any)}>
                                    <SelectTrigger className="w-auto inline-flex h-8">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="metric">kg / cm</SelectItem>
                                        <SelectItem value="imperial">lbs / in</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                           
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-medium">Height</label>
                                    <span className="font-bold text-primary text-sm">{formData.height.toFixed(isMetric ? 0 : 1)} {isMetric ? 'cm' : 'in'}</span>
                                </div>
                                <Slider value={[formData.height]} onValueChange={([v]) => setFormData({...formData, height: v})} min={isMetric ? 120 : 48} max={isMetric ? 220 : 86} step={isMetric ? 1 : 0.5} />
                            </div>

                             <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-medium">Current Weight</label>
                                    <span className="font-bold text-primary text-sm">{formData.currentWeight.toFixed(1)} {isMetric ? 'kg' : 'lbs'}</span>
                                </div>
                                <Slider value={[formData.currentWeight]} onValueChange={([v]) => setFormData({...formData, currentWeight: v})} min={isMetric ? 30 : 65} max={isMetric ? 180 : 400} step={0.1} />
                            </div>

                             <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-medium">Goal Weight</label>
                                    <span className="font-bold text-primary text-sm">{formData.goalWeight.toFixed(1)} {isMetric ? 'kg' : 'lbs'}</span>
                                </div>
                                <Slider value={[formData.goalWeight]} onValueChange={([v]) => setFormData({...formData, goalWeight: v})} min={isMetric ? 30 : 65} max={isMetric ? 180 : 400} step={0.1} />
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-medium">Intensity</label>
                                    <span className="font-bold text-primary text-sm">{formData.intensity}%</span>
                                </div>
                                <Slider value={[formData.intensity]} onValueChange={([v]) => setFormData({...formData, intensity: v})} min={10} max={30} step={1} />
                            </div>
                       </div>
                    </div>
                    
                     <Card className="bg-card/80 mt-8">
                        <CardHeader>
                            <CardTitle className="text-lg">Estimated Daily Goals</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                            <div>
                                <p className="text-2xl font-bold text-primary">{Math.round(healthMetrics?.dailyCalorieGoal || 0)}</p>
                                <p className="text-sm text-muted-foreground">Calories</p>
                            </div>
                             <div>
                                <p className="text-2xl font-bold">{Math.round(healthMetrics?.dailyProteinGoal || 0)}g</p>
                                <p className="text-sm text-muted-foreground">Protein</p>
                            </div>
                             <div>
                                <p className="text-2xl font-bold">{Math.round(healthMetrics?.dailyCarbsGoal || 0)}g</p>
                                <p className="text-sm text-muted-foreground">Carbs</p>
                            </div>
                             <div>
                                <p className="text-2xl font-bold">{Math.round(healthMetrics?.dailyFatGoal || 0)}g</p>
                                <p className="text-sm text-muted-foreground">Fat</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Button onClick={onSubmit} className="w-full mt-8" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
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
