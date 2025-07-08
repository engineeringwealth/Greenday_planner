
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
        <Skeleton className="h-[100px] w-full rounded-2xl bg-card" />
        <Skeleton className="h-[100px] w-full rounded-2xl bg-card" />
      </div>
    );
  }

  if (mealLogs.length === 0) {
    return (
      <div className="text-center py-10 px-4 border-2 border-dashed border-card rounded-2xl">
        <Camera className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-2 text-base font-medium text-muted-foreground">No meals logged today.</h3>
        <p className="text-sm text-muted-foreground/80 mt-1">Tap the camera to get started!</p>
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
