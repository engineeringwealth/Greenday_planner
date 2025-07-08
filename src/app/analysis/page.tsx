
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { AuthGuard } from '@/components/auth-guard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Flame, TrendingUp, BarChart, Settings, Home, Camera, AreaChart } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { Bar, BarChart as RechartsBarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import type { UserProfile, WeightHistoryEntry } from '@/lib/types';
import { getWeightHistory } from '@/services/user-service';
import { Skeleton } from '@/components/ui/skeleton';
import { MealCaptureDialog } from '@/components/task-dialog';
import { addMealLog } from '@/services/task-service';
import { useToast } from '@/hooks/use-toast';
import type { MealLog } from '@/lib/types';

function convertWeight(weight: number, units: UserProfile['units']) {
    if (units === 'metric') {
        return Math.round(weight * 0.453592 * 10) / 10;
    }
    return Math.round(weight * 10) / 10;
}

function ProgressChart({ history, units }: { history: WeightHistoryEntry[], units: UserProfile['units'] }) {
    const chartData = useMemo(() => {
        return history.map(entry => ({
            date: format(entry.date, 'MMM d'),
            weight: convertWeight(entry.weight, units),
        }));
    }, [history, units]);

    const domainMin = Math.min(...chartData.map(d => d.weight)) - 2;
    const domainMax = Math.max(...chartData.map(d => d.weight)) + 2;

    return (
        <ResponsiveContainer width="100%" height={250}>
            <RechartsBarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} domain={[domainMin, domainMax]} />
                <Tooltip
                    cursor={false}
                    content={({ active, payload }) => (
                         <ChartTooltipContent
                            active={active}
                            payload={payload}
                            labelFormatter={(label) => label}
                            formatter={(value) => `${value} ${units === 'metric' ? 'kg' : 'lbs'}`}
                            indicator="dot"
                        />
                    )}
                />
                <Bar dataKey="weight" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </RechartsBarChart>
        </ResponsiveContainer>
    );
}

function AnalysisContent() {
    const { user, userProfile } = useAuth();
    const { toast } = useToast();
    const [weightHistory, setWeightHistory] = useState<WeightHistoryEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const units = userProfile?.units || 'imperial';
    const currentWeight = userProfile ? convertWeight(userProfile.currentWeight, units) : 0;
    const desiredWeight = userProfile ? convertWeight(userProfile.desiredWeight, units) : 0;

    const weightDifference = Math.abs(currentWeight - desiredWeight);
    const progressPercentage = desiredWeight > 0 ? Math.max(0, 100 - (weightDifference / (userProfile ? convertWeight(userProfile.currentWeight, units) : 1)) * 100) : 0;

    useEffect(() => {
        if (user) {
            setIsLoading(true);
            const unsubscribe = getWeightHistory(user.uid, (history) => {
                setWeightHistory(history);
                setIsLoading(false);
            }, (error) => {
                console.error("Failed to fetch weight history:", error);
                toast({ title: "Error", description: "Could not fetch your progress.", variant: "destructive" });
                setIsLoading(false);
            });
            return () => unsubscribe();
        }
    }, [user, toast]);

    const handleAddMealLog = async (mealData: Omit<MealLog, "id" | "createdAt">) => {
        if (!user) return;
        try {
          await addMealLog(user.uid, mealData);
          toast({ title: "Success", description: "Meal logged successfully!" });
        } catch (error) {
          console.error("Failed to add meal log:", error);
          toast({ title: "Error", description: "Failed to log new meal.", variant: "destructive" });
        }
    };
    
    return (
        <div className="relative bg-background flex flex-col h-full max-h-screen sm:max-h-[90vh]">
            <header className="flex items-center justify-between p-4 flex-shrink-0">
                <Link href="/" passHref>
                    <Button variant="outline" size="icon" aria-label="Go back">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <h1 className="text-xl font-bold">Overview</h1>
                <div className="w-10" />
            </header>
            
            <main className="flex-1 overflow-y-auto p-4 space-y-6">
                <Card className="bg-card/80 rounded-2xl p-6 text-center">
                    <CardTitle className="flex items-center justify-center gap-2 font-semibold">
                        <Flame className="text-primary" />
                        Goal Progress
                    </CardTitle>
                    <div className="grid grid-cols-2 gap-4 mt-4 text-foreground">
                        <div>
                            <p className="text-3xl font-bold">{desiredWeight}<span className="text-base font-normal text-muted-foreground">{units === 'metric' ? 'kg' : 'lbs'}</span></p>
                            <p className="text-sm text-muted-foreground">Weight goal</p>
                        </div>
                        <div>
                            <p className="text-3xl font-bold">{currentWeight}<span className="text-base font-normal text-muted-foreground">{units === 'metric' ? 'kg' : 'lbs'}</span></p>
                            <p className="text-sm text-muted-foreground">Current weight</p>
                        </div>
                    </div>
                </Card>

                <Card className="bg-card/80 rounded-2xl">
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle>Progress Chart</CardTitle>
                            <span className="text-sm font-medium text-primary">{Math.round(progressPercentage)}% achieved</span>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <Skeleton className="h-[250px] w-full" />
                        ) : weightHistory.length > 0 ? (
                            <ProgressChart history={weightHistory} units={units} />
                        ) : (
                            <div className="h-[250px] flex flex-col items-center justify-center text-center text-muted-foreground">
                                <BarChart className="h-12 w-12 mb-4" />
                                <p className="font-semibold">Not enough data yet</p>
                                <p className="text-sm">Update your weight in your profile to see progress.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>

            <footer className="sticky bottom-0 bg-background/80 backdrop-blur-sm border-t border-border flex-shrink-0">
                <div className="flex justify-around items-center h-20">
                    <Link href="/" passHref>
                        <Button variant="ghost" className="flex flex-col h-auto items-center text-muted-foreground hover:text-foreground">
                            <Home className="w-6 h-6" />
                            <span className="text-xs mt-1">Home</span>
                        </Button>
                    </Link>
                    <Button onClick={() => setIsDialogOpen(true)} size="lg" className="h-16 w-16 rounded-full bg-primary text-primary-foreground shadow-lg -translate-y-6">
                        <Camera className="w-8 h-8" />
                    </Button>
                    <Link href="/analysis" passHref>
                        <Button variant="ghost" className="flex flex-col h-auto items-center text-primary" data-active={true}>
                            <AreaChart className="w-6 h-6" />
                            <span className="text-xs mt-1">Analysis</span>
                        </Button>
                    </Link>
                </div>
            </footer>
             <MealCaptureDialog
                isOpen={isDialogOpen}
                setIsOpen={setIsDialogOpen}
                onSubmit={handleAddMealLog}
            />
        </div>
    );
}


export default function AnalysisPage() {
    return (
        <AuthGuard>
            <main className="min-h-screen bg-zinc-900 flex justify-center items-start pt-4 sm:pt-8">
                <div className="w-full max-w-sm bg-background rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden h-full sm:h-auto sm:max-h-[90vh]">
                    <AnalysisContent />
                </div>
            </main>
        </AuthGuard>
    );
}
