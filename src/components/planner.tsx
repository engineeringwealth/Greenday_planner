
"use client";

import { useState, useEffect, useMemo } from "react";
import { LogOut, CalendarIcon, ChevronDown, Home, LineChart, Camera, Zap, Flame, Droplets } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { MealLog } from "@/lib/types";
import { useAuth } from "@/contexts/auth-context";
import * as mealLogService from "@/services/task-service";
import { useToast } from "@/hooks/use-toast";
import { MealCaptureDialog } from "@/components/task-dialog";
import { DailyLog } from "@/components/task-list";
import { format, eachDayOfInterval, startOfWeek, endOfWeek, isToday } from 'date-fns';
import { cn } from "@/lib/utils";

function CalorieGauge({ current, goal }: { current: number; goal: number }) {
  const percentage = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;
  const circumference = 2 * Math.PI * 90;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative h-64 w-64">
      <svg className="h-full w-full" viewBox="0 0 200 200">
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: "hsl(var(--primary))", stopOpacity: 0.8 }} />
            <stop offset="100%" style={{ stopColor: "hsl(var(--accent))", stopOpacity: 1 }} />
          </linearGradient>
        </defs>
        <circle
          className="text-card"
          strokeWidth="16"
          stroke="currentColor"
          fill="transparent"
          r="90"
          cx="100"
          cy="100"
        />
        <circle
          stroke="url(#gaugeGradient)"
          strokeWidth="16"
          fill="transparent"
          r="90"
          cx="100"
          cy="100"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
          transform="rotate(-90 100 100)"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-6xl font-bold text-foreground tracking-tighter">{Math.round(current)}</span>
        <span className="text-lg text-muted-foreground font-medium">Calories left</span>
      </div>
    </div>
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

function MacroCard({ title, value, icon: Icon, colorClass }: { title: string, value: number, icon: React.ElementType, colorClass: string }) {
  return (
    <Card className={cn("p-4 flex-1 rounded-3xl border-0", colorClass)}>
      <div className="flex justify-between items-center">
        <Icon className="w-5 h-5 text-foreground/80" />
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold tracking-tight text-foreground">{value}<span className="text-base font-medium text-foreground/80">g</span></p>
        <p className="text-sm font-medium text-foreground/80">{title}</p>
      </div>
    </Card>
  )
}

export function CalorieTracker() {
  const { user, signOut, userProfile } = useAuth();
  const { toast } = useToast();
  const [mealLogs, setMealLogs] = useState<MealLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const dailyGoal = userProfile?.dailyCalorieGoal ?? 2000;

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

  const caloriesLeft = dailyGoal - totals.calories;

  return (
    <div className="relative bg-background flex flex-col h-full max-h-screen sm:max-h-[90vh]">
      {/* Header */}
      <header className="flex items-center justify-between p-4 flex-shrink-0">
        <button className="flex items-center gap-2 font-semibold">
          <CalendarIcon className="w-5 h-5 text-muted-foreground" />
          <span>{format(new Date(), 'MMMM')}</span>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </button>
        <Avatar className="h-10 w-10 cursor-pointer" onClick={signOut}>
          <AvatarImage src={user?.photoURL ?? ''} alt={user?.displayName ?? 'User'} />
          <AvatarFallback>{(user?.displayName?.[0] || user?.email?.[0] || 'U').toUpperCase()}</AvatarFallback>
        </Avatar>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 space-y-6">
        <WeekCalendar />

        <Card className="rounded-3xl border-0 bg-primary/20 flex justify-center items-center py-4">
          <CalorieGauge current={caloriesLeft} goal={dailyGoal} />
        </Card>

        <div className="grid grid-cols-3 gap-3">
           <MacroCard title="Protein" value={Math.round(totals.protein)} icon={Flame} colorClass="bg-chart-4/20" />
           <MacroCard title="Carbs" value={Math.round(totals.carbs)} icon={Zap} colorClass="bg-chart-1/20" />
           <MacroCard title="Fat" value={Math.round(totals.fat)} icon={Droplets} colorClass="bg-chart-2/20" />
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
              <Button variant="ghost" className="flex flex-col h-auto items-center text-muted-foreground hover:text-foreground">
                  <Home className="w-6 h-6" />
                  <span className="text-xs mt-1">Home</span>
              </Button>
              <Button onClick={() => setIsDialogOpen(true)} size="lg" className="h-16 w-16 rounded-full bg-primary text-primary-foreground shadow-lg -translate-y-6">
                  <Camera className="w-8 h-8" />
              </Button>
              <Button variant="ghost" className="flex flex-col h-auto items-center text-muted-foreground hover:text-foreground">
                  <LineChart className="w-6 h-6" />
                  <span className="text-xs mt-1">Analysis</span>
              </Button>
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
