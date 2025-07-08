'use server';

/**
 * @fileOverview An AI flow for analyzing meals from photos.
 *
 * - analyzeMeal - A function that analyzes a meal photo and returns nutritional information.
 * - AnalyzeMealInput - The input type for the analyzeMeal function.
 * - AnalyzeMealOutput - The return type for the analyzeMeal function.
 * - FoodItem - A type representing a single food item with its nutritional info.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const FoodItemSchema = z.object({
  name: z.string().describe('The common name of the food item.'),
  calories: z.number().describe('Estimated calories for this item.'),
  protein: z.number().describe('Estimated grams of protein for this item.'),
  carbs: z.number().describe('Estimated grams of carbohydrates for this item.'),
  fat: z.number().describe('Estimated grams of fat for this item.'),
});
export type FoodItem = z.infer<typeof FoodItemSchema>;

const AnalyzeMealInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a meal, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type AnalyzeMealInput = z.infer<typeof AnalyzeMealInputSchema>;

const AnalyzeMealOutputSchema = z.object({
  foodItems: z.array(FoodItemSchema).describe('A list of food items identified in the meal.'),
});
export type AnalyzeMealOutput = z.infer<typeof AnalyzeMealOutputSchema>;

const prompt = ai.definePrompt({
  name: 'mealAnalysisPrompt',
  input: {schema: AnalyzeMealInputSchema},
  output: {schema: AnalyzeMealOutputSchema},
  prompt: `You are an expert nutritionist and calorie estimation AI.
    Analyze the meal in the provided photo. Identify each food item, estimate its portion size, and calculate the estimated calories, protein, carbohydrates, and fat.
    Be as accurate as possible. Only include food items you are confident about from the image.
    Provide the response in the structured JSON format requested.

    Photo of the meal: {{media url=photoDataUri}}`,
});

const analyzeMealFlow = ai.defineFlow(
  {
    name: 'analyzeMealFlow',
    inputSchema: AnalyzeMealInputSchema,
    outputSchema: AnalyzeMealOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('Analysis failed to produce an output.');
    }
    return output;
  }
);

export async function analyzeMeal(input: AnalyzeMealInput): Promise<AnalyzeMealOutput> {
  return analyzeMealFlow(input);
}
