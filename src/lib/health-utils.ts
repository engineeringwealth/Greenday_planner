import type { OnboardingData } from './types';

function calculateAge(dob: string): number {
    if (!dob) return 25; // Default age if not provided
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}

export function calculateHealthMetrics(data: OnboardingData): { 
    dailyCalorieGoal: number, 
    dailyProteinGoal: number, 
    dailyCarbsGoal: number, 
    dailyFatGoal: number 
} {
    const { gender, dob, activityLevel, units, height, currentWeight, goal, intensity } = data;

    const age = calculateAge(dob);

    const heightCm = units === 'metric' ? height : height * 2.54;
    const weightKg = units === 'metric' ? currentWeight : currentWeight * 0.453592;

    // Mifflin-St Jeor Equation for BMR
    let bmr;
    if (gender === 'male') {
        bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
    } else {
        bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
    }

    const activityMultipliers = {
        sedentary: 1.2,
        lightly: 1.375,
        moderately: 1.55,
        very: 1.725,
        extremely: 1.9,
    };

    const tdee = bmr * activityMultipliers[activityLevel];

    let calorieAdjustment = 0;
    const intensityPercentage = intensity / 100;

    if (goal === 'lose') {
        calorieAdjustment = -(tdee * intensityPercentage);
    } else if (goal === 'gain') {
        calorieAdjustment = tdee * intensityPercentage;
    }
    
    const dailyCalorieGoal = Math.round(tdee + calorieAdjustment);

    // Macronutrient split (40% Carbs, 30% Protein, 30% Fat)
    const dailyCarbsGoal = Math.round((dailyCalorieGoal * 0.4) / 4);
    const dailyProteinGoal = Math.round((dailyCalorieGoal * 0.3) / 4);
    const dailyFatGoal = Math.round((dailyCalorieGoal * 0.3) / 9);
    
    return {
        dailyCalorieGoal,
        dailyProteinGoal,
        dailyCarbsGoal,
        dailyFatGoal
    };
}
