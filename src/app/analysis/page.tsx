
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { AuthGuard } from '@/components/auth-guard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Flame, BarChart, Home, Camera, AreaChart, Pencil } from 'lucide-react';
import { format } from 'date-fns';
import { Bar, BarChart as RechartsBarChart, XAxis, YAxis, Tooltip, ReferenceLine } from 'recharts';
import { ChartContainer, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import type { UserProfile, WeightHistoryEntry } from '@/lib/types';
import { getWeightHistory, updateUserProfile, addWeightHistory } from '@/services/user-service';
import { Skeleton } from '@/components/ui/skeleton';
import { MealCaptureDialog } from '@/components/task-dialog';
import { addMealLog } from '@/services/task-service';
import { useToast } from '@/hooks/use-toast';
import type { MealLog } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function convertWeight(weight: number, units: UserProfile['units']) {
    if (units === 'metric') {
        return Math.round(weight * 0.453592 * 10) / 10;
    }
    return Math.round(weight * 10) / 10;
}

function ProgressChart({ history, units, goalWeight }: { history: WeightHistoryEntry[], units: UserProfile['units'], goalWeight: number }) {
    const chartData = useMemo(() => {
        return history.map(entry => ({
            date: format(entry.date, 'MMM d'),
            weight: convertWeight(entry.weight, units),
        }));
    }, [history, units]);

    const allWeights = chartData.map(d => d.weight);
    if(goalWeight) allWeights.push(goalWeight);
    
    const domainMin = allWeights.length > 0 ? Math.min(...allWeights) - 2 : 50;
    const domainMax = allWeights.length > 0 ? Math.max(...allWeights) + 2 : 100;

    const chartConfig = {
      weight: {
        label: `Weight (${units === 'metric' ? 'kg' : 'lbs'})`,
        color: "hsl(var(--primary))",
      },
    } satisfies ChartConfig;

    return (
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <RechartsBarChart data={chartData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
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
                <ReferenceLine 
                    y={goalWeight} 
                    stroke="hsl(var(--destructive))" 
                    strokeDasharray="3 3"
                >
                    <ReferenceLine.Label value="Goal" position="top" fill="hsl(var(--destructive))" fontSize={12} />
                </ReferenceLine>
                <Bar dataKey="weight" fill="var(--color-weight)" radius={[4, 4, 0, 0]} />
            </RechartsBarChart>
        </ChartContainer>
    );
}

function AnalysisContent() {
    const { user, userProfile, refetchUserProfile } = useAuth();
    const { toast } = useToast();
    const [weightHistory, setWeightHistory] = useState<WeightHistoryEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    
    const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false);
    const [newGoalWeight, setNewGoalWeight] = useState<string>("");

    const [isCurrentWeightDialogOpen, setIsCurrentWeightDialogOpen] = useState(false);
    const [newCurrentWeight, setNewCurrentWeight] = useState<string>("");

    const units = userProfile?.units || 'imperial';
    const currentWeight = userProfile ? convertWeight(userProfile.currentWeight, units) : 0;
    const desiredWeight = userProfile ? convertWeight(userProfile.desiredWeight, units) : 0;

    useEffect(() => {
        if (isGoalDialogOpen) {
            setNewGoalWeight(String(desiredWeight));
        }
    }, [isGoalDialogOpen, desiredWeight]);

    useEffect(() => {
        if (isCurrentWeightDialogOpen) {
            setNewCurrentWeight(String(currentWeight));
        }
    }, [isCurrentWeightDialogOpen, currentWeight]);

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

    const progressPercentage = useMemo(() => {
        if (!userProfile || weightHistory.length === 0) return 0;

        const startWeight = convertWeight(weightHistory[0].weight, userProfile.units);
        const current = convertWeight(userProfile.currentWeight, userProfile.units);
        const goal = convertWeight(userProfile.desiredWeight, userProfile.units);

        if (startWeight === goal) {
            return current === goal ? 100 : 0;
        }

        const totalToChange = startWeight - goal;
        const changedSoFar = startWeight - current;

        if (totalToChange === 0) return 100;

        const percentage = (changedSoFar / totalToChange) * 100;

        return Math.max(0, Math.min(100, percentage));
    }, [userProfile, weightHistory]);

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
    
    const handleUpdateGoal = async () => {
        if (!user || !userProfile) return;
        const newWeight = parseFloat(newGoalWeight);
        if (isNaN(newWeight) || newWeight <= 0) {
            toast({ title: "Invalid Input", description: "Please enter a valid weight.", variant: "destructive" });
            return;
        }

        let imperialWeight = newWeight;
        if (units === 'metric') {
            imperialWeight = newWeight / 0.453592;
        }

        try {
            await updateUserProfile(user.uid, { desiredWeight: imperialWeight });
            await refetchUserProfile();
            toast({ title: "Success", description: "Your weight goal has been updated." });
            setIsGoalDialogOpen(false);
        } catch (error) {
            console.error("Failed to update weight goal:", error);
            toast({ title: "Error", description: "Could not update your weight goal.", variant: "destructive" });
        }
    };

    const handleUpdateCurrentWeight = async () => {
        if (!user || !userProfile) return;
        const newWeight = parseFloat(newCurrentWeight);
        if (isNaN(newWeight) || newWeight <= 0) {
            toast({ title: "Invalid Input", description: "Please enter a valid weight.", variant: "destructive" });
            return;
        }

        let imperialWeight = newWeight;
        if (units === 'metric') {
            imperialWeight = newWeight / 0.453592;
        }

        try {
            await updateUserProfile(user.uid, { currentWeight: imperialWeight });
            await addWeightHistory(user.uid, imperialWeight);
            await refetchUserProfile();
            toast({ title: "Success", description: "Your current weight has been updated." });
            setIsCurrentWeightDialogOpen(false);
        } catch (error) {
            console.error("Failed to update current weight:", error);
            toast({ title: "Error", description: "Could not update your current weight.", variant: "destructive" });
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
                        {Math.round(progressPercentage) >= 100 ? "Goal Achieved!" : "Goal Progress"}
                    </CardTitle>
                    <div className="grid grid-cols-2 gap-4 mt-4 text-foreground">
                        <div>
                            <Dialog open={isGoalDialogOpen} onOpenChange={setIsGoalDialogOpen}>
                                <DialogTrigger asChild>
                                    <button className="flex flex-col items-center justify-center text-center p-2 rounded-lg hover:bg-white/5 transition-colors w-full">
                                        <p className="text-3xl font-bold">{desiredWeight}<span className="text-base font-normal text-muted-foreground">{units === 'metric' ? 'kg' : 'lbs'}</span></p>
                                        <div className="flex items-center gap-1.5 mt-1">
                                            <p className="text-sm text-muted-foreground">Weight goal</p>
                                            <Pencil className="h-3 w-3 text-muted-foreground" />
                                        </div>
                                    </button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Update Your Weight Goal</DialogTitle>
                                        <DialogDescription>
                                            Enter your new desired weight. This will update the goal across the app.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="newGoalWeight" className="text-right">
                                                Weight ({units === 'metric' ? 'kg' : 'lbs'})
                                            </Label>
                                            <Input
                                                id="newGoalWeight"
                                                type="number"
                                                step="0.1"
                                                value={newGoalWeight}
                                                onChange={(e) => setNewGoalWeight(e.target.value)}
                                                className="col-span-3"
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setIsGoalDialogOpen(false)}>Cancel</Button>
                                        <Button onClick={handleUpdateGoal}>Save Changes</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                        <div>
                            <Dialog open={isCurrentWeightDialogOpen} onOpenChange={setIsCurrentWeightDialogOpen}>
                                <DialogTrigger asChild>
                                    <button className="flex flex-col items-center justify-center text-center p-2 rounded-lg hover:bg-white/5 transition-colors w-full">
                                        <p className="text-3xl font-bold">{currentWeight}<span className="text-base font-normal text-muted-foreground">{units === 'metric' ? 'kg' : 'lbs'}</span></p>
                                        <div className="flex items-center gap-1.5 mt-1">
                                            <p className="text-sm text-muted-foreground">Current weight</p>
                                            <Pencil className="h-3 w-3 text-muted-foreground" />
                                        </div>
                                    </button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Update Your Current Weight</DialogTitle>
                                        <DialogDescription>
                                            Enter your new weight. This will be added to your progress history.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="newCurrentWeight" className="text-right">
                                                Weight ({units === 'metric' ? 'kg' : 'lbs'})
                                            </Label>
                                            <Input
                                                id="newCurrentWeight"
                                                type="number"
                                                step="0.1"
                                                value={newCurrentWeight}
                                                onChange={(e) => setNewCurrentWeight(e.target.value)}
                                                className="col-span-3"
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setIsCurrentWeightDialogOpen(false)}>Cancel</Button>
                                        <Button onClick={handleUpdateCurrentWeight}>Save Changes</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>
                </Card>

                <Card className="bg-card/80 rounded-2xl">
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle>Goal progress</CardTitle>
                            <span className="text-sm font-medium text-primary">{Math.round(progressPercentage)}% achieved</span>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <Skeleton className="h-[250px] w-full" />
                        ) : weightHistory.length > 0 ? (
                            <ProgressChart history={weightHistory} units={units} goalWeight={desiredWeight} />
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
