
"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from 'next/navigation';
import { LogOut, CalendarIcon, ChevronDown, Home, Camera, User, AreaChart, Droplet, BrainCircuit, Wheat, Container } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { MealLog } from "@/lib/types";
import { useAuth } from "@/contexts/auth-context";
import * as mealLogService from "@/services/task-service";
import { useToast } from "@/hooks/use-toast";
import { MealCaptureDialog } from "@/components/task-dialog";
import { DailyLog } from "@/components/task-list";
import { format, eachDayOfInterval, startOfWeek, endOfWeek, isToday } from 'date-fns';
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";

function CalorieGauge({ consumed, goal }: { consumed: number; goal: number }) {
  const percentage = goal > 0 ? Math.min((consumed / goal) * 100, 100) : 0;
  const circumference = 2 * Math.PI * 90;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  const caloriesLeft = Math.round(goal - consumed);

  return (
    <Card className="p-6 rounded-3xl border-0 bg-card/80 h-full flex flex-col">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-foreground">Calories</h3>
            <Droplet className="w-5 h-5 text-muted-foreground" />
        </div>
        <div className="flex flex-col items-center justify-center flex-grow">
            <div className="relative h-48 w-48">
              <svg className="h-full w-full" viewBox="0 0 200 200">
                <circle className="text-muted/20" strokeWidth="16" stroke="currentColor" fill="transparent" r="90" cx="100" cy="100" />
                <circle className="text-chart-5" strokeWidth="16" stroke="currentColor" fill="transparent" r="90" cx="100" cy="100" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }} transform="rotate(-90 100 100)" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-6xl font-bold text-foreground tracking-tighter">{Math.round(consumed)}</span>
                <span className="text-lg text-muted-foreground font-medium">Consumed</span>
              </div>
            </div>
            <div className="text-center mt-4">
                <p className="text-sm text-foreground">{caloriesLeft < 0 ? 0 : caloriesLeft} kcal left</p>
                <p className="text-xs text-muted-foreground">Goal: {goal} kcal</p>
            </div>
        </div>
    </Card>
  );
}

function MacroGauge({ title, value, goal, icon: Icon, colorClass, unit = 'g' }: { title: string, value: number, goal: number, icon: React.ElementType, colorClass: string, unit?: string }) {
  const percentage = goal > 0 ? Math.min((value / goal) * 100, 100) : 0;
  const circumference = 2 * Math.PI * 25;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <Card className="p-3 rounded-3xl border-0 bg-card/80 flex flex-col justify-between h-full">
      <div>
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
          <Icon className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="flex flex-col items-center">
          <div className="relative h-20 w-20">
            <svg className="h-full w-full" viewBox="0 0 60 60">
              <circle className="text-muted/20" strokeWidth="5" stroke="currentColor" fill="transparent" r="25" cx="30" cy="30" />
              <circle className={colorClass} strokeWidth="5" stroke="currentColor" fill="transparent" r="25" cx="30" cy="30" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }} transform="rotate(-90 30 30)" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-bold text-foreground">{Math.round(value)}<span className="text-sm">{unit}</span></span>
              <span className="text-xs text-muted-foreground">Consumed</span>
            </div>
          </div>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-2 text-center">Goal: {goal}{unit}</p>
    </Card>
  );
}

function WeekCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const week = eachDayOfInterval({
    start: startOfWeek(currentDate, { weekStartsOn: 1 }), // Monday
    end: endOfWeek(currentDate, { weekStartsOn: 1 }),
  });

  return (
    <div className="flex justify-between items-center px-4">
      {week.map(day => (
        <div key={day.toString()} className="text-center">
          <p className="text-xs text-muted-foreground">{format(day, 'E')}</p>
          <button className={cn(
            "mt-2 w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors",
            isToday(day) ? "bg-accent text-accent-foreground" : "hover:bg-card"
          )}>
            {format(day, 'd')}
          </button>
        </div>
      ))}
    </div>
  )
}

export function CalorieTracker() {
  const { user, signOut, userProfile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [mealLogs, setMealLogs] = useState<MealLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const dailyGoal = userProfile?.dailyCalorieGoal ?? 2000;
  // Use calculated defaults if profile doesn't have them yet (for backward compatibility)
  const proteinGoal = userProfile?.dailyProteinGoal ?? Math.round((dailyGoal * 0.3) / 4);
  const carbsGoal = userProfile?.dailyCarbsGoal ?? Math.round((dailyGoal * 0.4) / 4);
  const fatGoal = userProfile?.dailyFatGoal ?? Math.round((dailyGoal * 0.3) / 9);

  useEffect(() => {
    if (user) {
      setIsLoading(true);
      const unsubscribe = mealLogService.getMealLogs(user.uid, (newLogs) => {
        setMealLogs(newLogs);
        setIsLoading(false);
      }, (error) => {
        console.error("Failed to fetch meal logs:", error);
        toast({ title: "Error", description: "Could not fetch your meal logs.", variant: "destructive" });
        setIsLoading(false);
      });
      return () => unsubscribe();
    } else {
      setMealLogs([]);
      setIsLoading(false);
    }
  }, [user, toast]);

  const handleAddMealLog = async (mealData: Omit<MealLog, "id" | "createdAt">) => {
    if (!user) return;
    try {
      await mealLogService.addMealLog(user.uid, mealData);
      toast({ title: "Success", description: "Meal logged successfully!" });
    } catch (error) {
      console.error("Failed to add meal log:", error);
      toast({ title: "Error", description: "Failed to log new meal.", variant: "destructive" });
    }
  };

  const handleDeleteMealLog = async (logId: string) => {
    if (!user) return;
    try {
      await mealLogService.deleteMealLog(user.uid, logId);
    } catch (error) {
      console.error("Failed to delete meal log:", error);
      toast({ title: "Error", description: "Failed to delete meal log.", variant: "destructive" });
    }
  };

  const totals = useMemo(() => {
    return mealLogs.reduce((acc, log) => {
      acc.calories += log.totalCalories;
      acc.protein += log.totalProtein;
      acc.carbs += log.totalCarbs;
      acc.fat += log.totalFat;
      return acc;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
  }, [mealLogs]);

  return (
    <div className="relative bg-background flex flex-col h-full max-h-screen sm:max-h-[90vh]">
      {/* Header */}
      <header className="flex items-center justify-between p-4 flex-shrink-0">
        <button className="flex items-center gap-2 font-semibold">
          <CalendarIcon className="w-5 h-5 text-muted-foreground" />
          <span>{format(new Date(), 'MMMM')}</span>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Avatar className="h-10 w-10 cursor-pointer">
              <AvatarImage src={user?.photoURL ?? ''} alt={userProfile?.name ?? 'User'} />
              <AvatarFallback>{(userProfile?.name?.[0] || user?.email?.[0] || 'U').toUpperCase()}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
             <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{userProfile?.name ?? user?.displayName ?? 'User'}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                    </p>
                </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/profile')} className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={signOut} className="cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 space-y-6">
        <WeekCalendar />

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2">
            <CalorieGauge consumed={totals.calories} goal={dailyGoal} />
          </div>
          <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <MacroGauge title="Protein" value={totals.protein} goal={proteinGoal} icon={BrainCircuit} colorClass="text-chart-1" />
            <MacroGauge title="Carbs" value={totals.carbs} goal={carbsGoal} icon={Wheat} colorClass="text-chart-4" />
            <MacroGauge title="Fat" value={totals.fat} goal={fatGoal} icon={Container} colorClass="text-chart-2" />
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold mb-4">Today's Log</h2>
          <DailyLog
            mealLogs={mealLogs}
            isLoading={isLoading}
            onDelete={handleDeleteMealLog}
          />
        </div>
      </main>

      {/* Bottom Navigation */}
      <footer className="sticky bottom-0 bg-background/80 backdrop-blur-sm border-t border-border flex-shrink-0">
          <div className="flex justify-around items-center h-20">
              <Link href="/" passHref>
                <Button variant="ghost" className="flex flex-col h-auto items-center text-primary" data-active={true}>
                    <Home className="w-6 h-6" />
                    <span className="text-xs mt-1">Home</span>
                </Button>
              </Link>
              <Button onClick={() => setIsDialogOpen(true)} size="lg" className="h-16 w-16 rounded-full bg-primary text-primary-foreground shadow-lg -translate-y-6">
                  <Camera className="w-8 h-8" />
              </Button>
              <Link href="/analysis" passHref>
                <Button variant="ghost" className="flex flex-col h-auto items-center text-muted-foreground hover:text-primary">
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
