"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { MealLog } from "@/lib/types";
import Image from 'next/image';

interface MealCardProps {
  mealLog: MealLog;
  onDelete: (id: string) => void;
}

export function MealCard({ mealLog, onDelete }: MealCardProps) {
  const mainFoodItem = mealLog.foodItems[0]?.name || "Meal";
  const otherItemsCount = mealLog.foodItems.length - 1;

  return (
    <Card className="transition-all hover:shadow-md bg-card/80 overflow-hidden">
      <CardContent className="p-0 flex">
        <div className="w-1/3 flex-shrink-0">
          <Image
            src={mealLog.photoUrl}
            alt={mainFoodItem}
            width={150}
            height={150}
            className="w-full h-full object-cover"
            data-ai-hint="meal food"
          />
        </div>
        <div className="flex-grow p-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-lg">
                {mainFoodItem}{otherItemsCount > 0 && ` + ${otherItemsCount} more`}
              </h3>
              <p className="text-primary font-bold text-xl">{mealLog.totalCalories} kcal</p>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/80 hover:text-destructive" onClick={() => onDelete(mealLog.id)}>
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Delete Log</span>
            </Button>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>Protein: {mealLog.totalProtein}g</span>
            <span>Carbs: {mealLog.totalCarbs}g</span>
            <span>Fat: {mealLog.totalFat}g</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
