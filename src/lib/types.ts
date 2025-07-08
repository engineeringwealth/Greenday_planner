

export interface FoodItem {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface MealLog {
  id: string;
  createdAt: Date;
  foodItems: FoodItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  photoUrl: string; // In a real app, upload this to storage and get a URL
}

export interface UserProfile {
  uid: string;
  onboarded: boolean;
  name?: string;
  units: 'imperial' | 'metric';
  height?: number; // stored in inches
  currentWeight: number; // stored in lbs
  desiredWeight: number; // stored in lbs
  goalTimeline: number; // in weeks
  dailyCalorieGoal: number;
  dailyProteinGoal?: number; // in grams
  dailyCarbsGoal?: number; // in grams
  dailyFatGoal?: number; // in grams
}

export interface WeightHistoryEntry {
    id: string;
    date: Date;
    weight: number; // Stored in lbs
}
