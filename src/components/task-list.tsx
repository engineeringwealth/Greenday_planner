
"use client";

import { Skeleton } from "@/components/ui/skeleton";
import type { MealLog } from "@/lib/types";
import { MealCard } from "@/components/task-card";
import { Camera } from "lucide-react";

interface DailyLogProps {
  mealLogs: MealLog[];
  isLoading: boolean;
  onDelete: (id: string) => void;
}

export function DailyLog({ mealLogs, isLoading, onDelete }: DailyLogProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-[120px] w-full rounded-lg" />
        <Skeleton className="h-[120px] w-full rounded-lg" />
      </div>
    );
  }

  if (mealLogs.length === 0) {
    return (
      <div className="text-center py-10 px-4 border-2 border-dashed rounded-lg">
        <Camera className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-2 text-lg font-medium text-muted-foreground">No meals logged today.</h3>
        <p className="text-sm text-muted-foreground/80 mt-1">Click "Log Meal" to get started!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {mealLogs.map((log) => (
        <MealCard
          key={log.id}
          mealLog={log}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
