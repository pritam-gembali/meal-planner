import { MealPlannerConfig } from './types';
import { MealPlanner } from './planner';

// Default config values
const DEFAULT_CONFIG: MealPlannerConfig = {
  spreadsheetId: '', // This needs to be set from Script Properties
  optionsSheetName: 'Meal Options',
  currentPlanSheetName: 'Current Plan',
  previousPlanSheetName: 'Previous Plan',
  allowStapleRepetition: true,
  daysToGenerate: 7
};

/**
 * Initialize the app with configuration
 */
function initialize(): MealPlannerConfig {
  const scriptProperties = PropertiesService.getScriptProperties();
  const spreadsheetId = scriptProperties.getProperty('SPREADSHEET_ID');
  
  if (!spreadsheetId) {
    throw new Error('SPREADSHEET_ID not set in script properties');
  }
  
  return {
    ...DEFAULT_CONFIG,
    spreadsheetId,
    // Optionally override other config values from script properties
    optionsSheetName: scriptProperties.getProperty('OPTIONS_SHEET_NAME') || DEFAULT_CONFIG.optionsSheetName,
    currentPlanSheetName: scriptProperties.getProperty('CURRENT_PLAN_SHEET_NAME') || DEFAULT_CONFIG.currentPlanSheetName,
    previousPlanSheetName: scriptProperties.getProperty('PREVIOUS_PLAN_SHEET_NAME') || DEFAULT_CONFIG.previousPlanSheetName,
    allowStapleRepetition: scriptProperties.getProperty('ALLOW_STAPLE_REPETITION') !== 'false',
    daysToGenerate: Number(scriptProperties.getProperty('DAYS_TO_GENERATE')) || DEFAULT_CONFIG.daysToGenerate
  };
}

/**
 * Main function to generate a new meal plan
 * This is the entry point for triggered execution
 */
function generateMealPlan(): void {
  try {
    console.log('Starting meal plan generation');
    
    const config = initialize();
    const planner = new MealPlanner(config);
    
    const success = planner.generateAndSavePlan();
    
    if (success) {
      console.log('Successfully generated and saved meal plan');
    } else {
      console.error('Failed to generate or save meal plan');
    }
  } catch (error) {
    console.error('Error in generateMealPlan:', error);
  }
}

/**
 * Set up trigger to run weekly
 */
function setupWeeklyTrigger(): void {
  try {
    // Delete any existing triggers
    const triggers = ScriptApp.getProjectTriggers();
    for (const trigger of triggers) {
      if (trigger.getHandlerFunction() === 'generateMealPlan') {
        ScriptApp.deleteTrigger(trigger);
      }
    }
    
    // Create a new trigger for Sunday at 5:00 AM
    ScriptApp.newTrigger('generateMealPlan')
      .timeBased()
      .onWeekDay(ScriptApp.WeekDay.SUNDAY)
      .atHour(5)
      .create();
    
    console.log('Weekly trigger set up successfully');
  } catch (error) {
    console.error('Error setting up trigger:', error);
  }
}

/**
 * Manual execution function for debugging
 */
function manualRun(): void {
  generateMealPlan();
}

// Expose functions to global scope for Apps Script
declare global {
  function generateMealPlan(): void;
  function setupWeeklyTrigger(): void;
  function manualRun(): void;
}

// Export globals
global.generateMealPlan = generateMealPlan;
global.setupWeeklyTrigger = setupWeeklyTrigger;
global.manualRun = manualRun;