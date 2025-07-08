

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

// This is the data collected during the new onboarding flow
export interface OnboardingData {
  goal: 'lose' | 'maintain' | 'gain';
  name: string;
  activityLevel: 'sedentary' | 'lightly' | 'moderately' | 'very' | 'extremely';
  gender: 'male' | 'female';
  dob: string; // ISO string e.g., '1990-01-15'
  units: 'imperial' | 'metric';
  height: number; // Stored in units selected by user
  currentWeight: number; // Stored in units selected by user
  goalWeight: number; // Stored in units selected by user
  intensity: number; // percentage 10-30
}

export interface UserProfile extends OnboardingData {
  uid: string;
  onboarded: boolean;
  
  // Stored in imperial units
  height: number; // inches
  currentWeight: number; // lbs
  goalWeight: number; // lbs

  // Calculated daily goals
  dailyCalorieGoal: number;
  dailyProteinGoal: number; 
  dailyCarbsGoal: number;
  dailyFatGoal: number;
}

export interface WeightHistoryEntry {
    id: string;
    date: Date;
    weight: number; // Stored in lbs
}
