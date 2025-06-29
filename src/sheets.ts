import { MealCategory, MealOption, DayPlan, WeeklyPlan, MealPlannerConfig } from './types';

/**
 * Sheet column indices for meal options data
 */
enum OptionsSheetColumns {
  ID = 0,
  NAME = 1,
  CATEGORY = 2,
  IS_STAPLE = 3,
  TAGS = 4
}

/**
 * Sheet column indices for meal plans
 */
enum PlanSheetColumns {
  DATE = 0,
  BREAKFAST = 1,
  LUNCH = 2,
  DINNER = 3
}

/**
 * Class for handling Google Sheets operations
 */
export class SheetService {
  private config: MealPlannerConfig;
  
  constructor(config: MealPlannerConfig) {
    this.config = config;
  }
  
  /**
   * Gets all meal options from the options sheet
   */
  getMealOptions(): MealOption[] {
    try {
      const sheet = SpreadsheetApp.openById(this.config.spreadsheetId)
        .getSheetByName(this.config.optionsSheetName);
      
      if (!sheet) {
        throw new Error(`Sheet "${this.config.optionsSheetName}" not found`);
      }
      
      const data = sheet.getDataRange().getValues();
      // Skip header row
      const rows = data.slice(1);
      
      return rows.map(row => {
        // Parse meal category string to enum
        let category: MealCategory;
        switch(String(row[OptionsSheetColumns.CATEGORY]).trim()) {
          case 'Breakfast':
            category = MealCategory.BREAKFAST;
            break;
          case 'Lunch':
            category = MealCategory.LUNCH;
            break;
          case 'Dinner':
            category = MealCategory.DINNER;
            break;
          default:
            category = MealCategory.BREAKFAST; // Default if invalid
        }
        
        const tags = row[OptionsSheetColumns.TAGS] 
          ? String(row[OptionsSheetColumns.TAGS]).split(',').map(tag => tag.trim()) 
          : [];
          
        return {
          id: String(row[OptionsSheetColumns.ID]),
          name: String(row[OptionsSheetColumns.NAME]),
          category: category,
          isStaple: Boolean(row[OptionsSheetColumns.IS_STAPLE]),
          tags: tags
        };
      }).filter(meal => meal.name); // Filter out empty rows
    } catch (error) {
      console.error('Error getting meal options:', error);
      return [];
    }
  }
  
  /**
   * Gets the previous week's meal plan
   */
  getPreviousMealPlan(): WeeklyPlan | null {
    try {
      const sheet = SpreadsheetApp.openById(this.config.spreadsheetId)
        .getSheetByName(this.config.previousPlanSheetName);
      
      if (!sheet) {
        console.log(`Sheet "${this.config.previousPlanSheetName}" not found`);
        return null;
      }
      
      return this.parseMealPlanSheet(sheet);
    } catch (error) {
      console.error('Error getting previous meal plan:', error);
      return null;
    }
  }
  
  /**
   * Writes the new weekly meal plan to the current plan sheet
   */
  writeWeeklyPlan(plan: WeeklyPlan): boolean {
    try {
      const allMealOptions = this.getMealOptions();
      const sheet = SpreadsheetApp.openById(this.config.spreadsheetId)
        .getSheetByName(this.config.currentPlanSheetName);
      
      if (!sheet) {
        throw new Error(`Sheet "${this.config.currentPlanSheetName}" not found`);
      }
      
      // Clear previous content but keep header row
      const lastRow = Math.max(sheet.getLastRow(), 1);
      if (lastRow > 1) {
        sheet.getRange(2, 1, lastRow - 1, 4).clear();
      }
      
      // Format dates for output
      const planData = plan.days.map(day => {
        return [
          day.date,
          day.breakfast ? day.breakfast.name : '',
          day.lunch ? day.lunch.name : '',
          day.dinner ? day.dinner.name : ''
        ];
      });
      
      // Write the new plan
      if (planData.length > 0) {
        sheet.getRange(2, 1, planData.length, 4).setValues(planData);
        
        // Format the date column
        sheet.getRange(2, 1, planData.length, 1).setNumberFormat('yyyy-MM-dd');
      }
      
      // Backup this plan to previous plan sheet when completed
      this.backupCurrentToPrevious();
      
      return true;
    } catch (error) {
      console.error('Error writing weekly plan:', error);
      return false;
    }
  }
  
  /**
   * Copies the current plan to the previous plan sheet
   */
  private backupCurrentToPrevious(): void {
    try {
      const ss = SpreadsheetApp.openById(this.config.spreadsheetId);
      const currentSheet = ss.getSheetByName(this.config.currentPlanSheetName);
      const prevSheet = ss.getSheetByName(this.config.previousPlanSheetName);
      
      if (!currentSheet || !prevSheet) {
        throw new Error('Could not find required sheets');
      }
      
      // Get current plan data
      const lastRow = Math.max(currentSheet.getLastRow(), 1);
      const lastCol = 4; // Date, Breakfast, Lunch, Dinner
      const data = currentSheet.getRange(1, 1, lastRow, lastCol).getValues();
      
      // Clear previous content
      prevSheet.clear();
      
      // Write data to previous plan sheet
      prevSheet.getRange(1, 1, data.length, data[0].length).setValues(data);
      
      // Format the date column
      if (data.length > 1) { // If there's data beyond header
        prevSheet.getRange(2, 1, data.length - 1, 1).setNumberFormat('yyyy-MM-dd');
      }
    } catch (error) {
      console.error('Error backing up current plan:', error);
    }
  }
  
  /**
   * Helper method to parse a meal plan from a sheet
   */
  private parseMealPlanSheet(sheet: GoogleAppsScript.Spreadsheet.Sheet): WeeklyPlan | null {
    const data = sheet.getDataRange().getValues();
    
    // Skip header row
    if (data.length <= 1) {
      return null;
    }
    
    const rows = data.slice(1);
    const allMealOptions = this.getMealOptions();
    
    // Find start date
    let startDate: Date | null = null;
    const days: DayPlan[] = [];
    
    for (const row of rows) {
      const date = row[PlanSheetColumns.DATE];
      
      if (!(date instanceof Date) || isNaN(date.getTime())) {
        continue;
      }
      
      if (!startDate || date < startDate) {
        startDate = new Date(date);
      }
      
      const dayPlan: DayPlan = {
        date: new Date(date),
        breakfast: this.findMealByName(row[PlanSheetColumns.BREAKFAST], MealCategory.BREAKFAST, allMealOptions),
        lunch: this.findMealByName(row[PlanSheetColumns.LUNCH], MealCategory.LUNCH, allMealOptions),
        dinner: this.findMealByName(row[PlanSheetColumns.DINNER], MealCategory.DINNER, allMealOptions)
      };
      
      days.push(dayPlan);
    }
    
    if (!startDate || days.length === 0) {
      return null;
    }
    
    return {
      weekStartDate: startDate,
      days: days
    };
  }
  
  /**
   * Helper to find a meal option by name
   */
  private findMealByName(name: string, category: MealCategory, allMeals: MealOption[]): MealOption | undefined {
    name = String(name).trim();
    if (!name) {
      return undefined;
    }
    
    // First try exact match with category
    const exactMatch = allMeals.find(meal => 
      meal.name.toLowerCase() === name.toLowerCase() && meal.category === category
    );
    
    if (exactMatch) {
      return exactMatch;
    }
    
    // Then try just by name if no exact match found
    return allMeals.find(meal => meal.name.toLowerCase() === name.toLowerCase());
  }
}