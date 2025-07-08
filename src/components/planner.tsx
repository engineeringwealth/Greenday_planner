
"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, LogOut, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { MealLog } from "@/lib/types";
import { useAuth } from "@/contexts/auth-context";
import * as mealLogService from "@/services/task-service";
import { useToast } from "@/hooks/use-toast";
import { MealCaptureDialog } from "@/components/task-dialog";
import { DailyLog } from "@/components/task-list";

function CalorieProgress({ current, goal }: { current: number; goal: number }) {
  const percentage = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;
  const circumference = 2 * Math.PI * 52; 
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative h-40 w-40">
      <svg className="h-full w-full" viewBox="0 0 120 120">
        <circle
          className="text-muted/20"
          strokeWidth="8"
          stroke="currentColor"
          fill="transparent"
          r="52"
          cx="60"
          cy="60"
        />
        <circle
          className="text-primary"
          strokeWidth="8"
          stroke="currentColor"
          fill="transparent"
          r="52"
          cx="60"
          cy="60"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
          transform="rotate(-90 60 60)"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-foreground">{Math.round(current)}</span>
        <span className="text-sm text-muted-foreground">/ {goal} kcal</span>
      </div>
    </div>
  );
}

export function CalorieTracker() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [mealLogs, setMealLogs] = useState<MealLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Hardcoded daily calorie goal for now
  const dailyGoal = 2000;

  useEffect(() => {
    if (user) {
      setIsLoading(true);
      const unsubscribe = mealLogService.getMealLogs(user.uid, (newLogs) => {
        setMealLogs(newLogs);
        setIsLoading(false);
      }, (error) => {
        console.error("Failed to fetch meal logs:", error);
        toast({
            title: "Error",
            description: "Could not fetch your meal logs.",
            variant: "destructive"
        });
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

  const totalCaloriesToday = useMemo(() => {
    return mealLogs.reduce((sum, log) => sum + log.totalCalories, 0);
  }, [mealLogs]);


  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground font-headline">
            SnapCalTracker
          </h1>
          <p className="text-muted-foreground mt-1">Your AI-powered daily calorie tracker.</p>
        </div>
        <div className="flex items-center gap-4">
          <Button onClick={() => setIsDialogOpen(true)} style={{ backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))' }}>
            <Camera className="mr-2 h-4 w-4" />
            Log Meal
          </Button>
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar>
                    <AvatarImage src={user.photoURL ?? ''} alt={user.displayName ?? 'User'} />
                    <AvatarFallback>{(user.displayName?.[0] || user.email?.[0] || 'U').toUpperCase()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.displayName || user.email}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </header>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <aside className="lg:col-span-1">
          <Card className="shadow-lg text-center">
            <CardHeader><CardTitle>Today's Intake</CardTitle></CardHeader>
            <CardContent className="flex justify-center">
                <CalorieProgress current={totalCaloriesToday} goal={dailyGoal} />
            </CardContent>
          </Card>
        </aside>

        <main className="lg:col-span-2">
           <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl font-headline">
                Today's Log
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DailyLog
                mealLogs={mealLogs}
                isLoading={isLoading}
                onDelete={handleDeleteMealLog}
              />
            </CardContent>
          </Card>
        </main>
      </div>

      <MealCaptureDialog
        isOpen={isDialogOpen}
        setIsOpen={setIsDialogOpen}
        onSubmit={handleAddMealLog}
      />
    </div>
  );
}
