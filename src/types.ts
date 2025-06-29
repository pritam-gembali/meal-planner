/**
 * Represents meal categories
 */
export enum MealCategory {
  BREAKFAST = 'Breakfast',
  LUNCH = 'Lunch', 
  DINNER = 'Dinner'
}

/**
 * Represents a meal option
 */
export interface MealOption {
  id: string;
  name: string;
  category: MealCategory;
  isStaple?: boolean; // Staples like roti, rice can repeat
  tags?: string[]; // Optional tags for additional categorization
}

/**
 * Represents a day's meal plan
 */
export interface DayPlan {
  date: Date;
  breakfast?: MealOption;
  lunch?: MealOption;
  dinner?: MealOption;
}

/**
 * Represents a weekly meal plan
 */
export interface WeeklyPlan {
  weekStartDate: Date;
  days: DayPlan[];
}

/**
 * Configuration for meal planning
 */
export interface MealPlannerConfig {
  spreadsheetId: string;
  optionsSheetName: string;
  currentPlanSheetName: string;
  previousPlanSheetName: string;
  allowStapleRepetition: boolean;
  daysToGenerate: number;
}