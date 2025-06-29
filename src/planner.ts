import { MealCategory, MealOption, DayPlan, WeeklyPlan, MealPlannerConfig } from './types';
import { SheetService } from './sheets';

/**
 * Class for generating meal plans
 */
export class MealPlanner {
  private config: MealPlannerConfig;
  private sheetService: SheetService;
  
  constructor(config: MealPlannerConfig) {
    this.config = config;
    this.sheetService = new SheetService(config);
  }
  
  /**
   * Generate a new weekly meal plan
   */
  generateWeeklyPlan(): WeeklyPlan {
    // Get all available meal options
    const allMealOptions = this.sheetService.getMealOptions();
    
    // Get the previous meal plan to avoid repeats
    const previousPlan = this.sheetService.getPreviousMealPlan();
    
    // Start date is today
    const today = new Date();
    const startDate = new Date(today);
    
    // Create the days array
    const days: DayPlan[] = [];
    
    // Generate a meal plan for each day
    for (let i = 0; i < this.config.daysToGenerate; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      // Generate meals for this day
      const breakfast = this.selectMeal(
        MealCategory.BREAKFAST, 
        allMealOptions, 
        previousPlan,
        days
      );
      
      const lunch = this.selectMeal(
        MealCategory.LUNCH, 
        allMealOptions, 
        previousPlan,
        days
      );
      
      const dinner = this.selectMeal(
        MealCategory.DINNER, 
        allMealOptions, 
        previousPlan,
        days
      );
      
      days.push({
        date,
        breakfast,
        lunch,
        dinner
      });
    }
    
    return {
      weekStartDate: startDate,
      days
    };
  }
  
  /**
   * Select a meal for the given category avoiding repeats
   */
  private selectMeal(
    category: MealCategory, 
    allMealOptions: MealOption[], 
    previousPlan: WeeklyPlan | null,
    currentDays: DayPlan[]
  ): MealOption | undefined {
    // Filter options to only the current category
    const options = allMealOptions.filter(meal => meal.category === category);
    
    if (options.length === 0) {
      console.warn(`No meal options found for category: ${category}`);
      return undefined;
    }
    
    // Get meals that were used in previous plan
    const previousMeals = this.getMealsFromPreviousPlan(category, previousPlan);
    
    // Get meals that are already used in the current plan
    const currentMeals = this.getMealsFromCurrentDays(category, currentDays);
    
    // Filter options to avoid non-staple repeats from previous week
    let eligibleOptions = options.filter(option => {
      // If it's a staple and we allow staple repetition, it's always eligible
      if (option.isStaple && this.config.allowStapleRepetition) {
        return true;
      }
      
      // Otherwise, check if it was used in the previous plan
      return !previousMeals.some(meal => meal.id === option.id);
    });
    
    // If no options are left, fall back to all options for this category
    if (eligibleOptions.length === 0) {
      console.warn(`No eligible non-repeat meals for ${category}, using all options`);
      eligibleOptions = options;
    }
    
    // Avoid reusing meals from current plan if possible
    const notYetUsedOptions = eligibleOptions.filter(option => 
      !currentMeals.some(meal => meal.id === option.id)
    );
    
    // Use non-repeating options if available, otherwise use all eligible options
    const finalOptions = notYetUsedOptions.length > 0 ? notYetUsedOptions : eligibleOptions;
    
    // Randomly select a meal from the eligible options
    const randomIndex = Math.floor(Math.random() * finalOptions.length);
    return finalOptions[randomIndex];
  }
  
  /**
   * Extract meals of a specific category from the previous plan
   */
  private getMealsFromPreviousPlan(
    category: MealCategory, 
    previousPlan: WeeklyPlan | null
  ): MealOption[] {
    if (!previousPlan) {
      return [];
    }
    
    const meals: MealOption[] = [];
    
    for (const day of previousPlan.days) {
      switch (category) {
        case MealCategory.BREAKFAST:
          if (day.breakfast) {
            meals.push(day.breakfast);
          }
          break;
        case MealCategory.LUNCH:
          if (day.lunch) {
            meals.push(day.lunch);
          }
          break;
        case MealCategory.DINNER:
          if (day.dinner) {
            meals.push(day.dinner);
          }
          break;
      }
    }
    
    return meals;
  }
  
  /**
   * Extract meals of a specific category from the current plan so far
   */
  private getMealsFromCurrentDays(
    category: MealCategory, 
    currentDays: DayPlan[]
  ): MealOption[] {
    const meals: MealOption[] = [];
    
    for (const day of currentDays) {
      switch (category) {
        case MealCategory.BREAKFAST:
          if (day.breakfast) {
            meals.push(day.breakfast);
          }
          break;
        case MealCategory.LUNCH:
          if (day.lunch) {
            meals.push(day.lunch);
          }
          break;
        case MealCategory.DINNER:
          if (day.dinner) {
            meals.push(day.dinner);
          }
          break;
      }
    }
    
    return meals;
  }
  
  /**
   * Generate and save a new weekly meal plan
   */
  generateAndSavePlan(): boolean {
    try {
      const plan = this.generateWeeklyPlan();
      return this.sheetService.writeWeeklyPlan(plan);
    } catch (error) {
      console.error('Error generating and saving plan:', error);
      return false;
    }
  }
}