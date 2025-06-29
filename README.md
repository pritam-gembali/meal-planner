# Meal Planner

A TypeScript/Google Apps Script application that automatically generates weekly meal plans from a Google Sheet of meal options. The system avoids repetition of meals from the previous week while allowing staple items like rice and roti to repeat.

## Features

- Automated weekly meal plan generation
- Intelligent meal selection with repetition avoidance
- Special handling for staple foods (rice, roti, etc.)
- Google Sheets integration for easy data management
- Automated weekly execution via GitHub Actions
- TypeScript for type safety and code quality

## Setup Instructions

### 1. Google Sheets Setup

1. Create a new Google Sheet with the following sheets:
   - **Meal Options**: List of all available meal options
   - **Current Plan**: Where the new plan will be generated
   - **Previous Plan**: Stores the previous week's plan to avoid repeats

2. Format the "Meal Options" sheet with these columns:
   - ID (unique identifier)
   - Name (meal name)
   - Category (Breakfast, Lunch, or Dinner)
   - IsStaple (TRUE/FALSE)
   - Tags (comma-separated)

3. Format the "Current Plan" and "Previous Plan" sheets with these columns:
   - Date
   - Breakfast
   - Lunch
   - Dinner

### 2. Google Apps Script Setup

1. Create a new Google Apps Script project connected to your spreadsheet
2. Note the Script ID (File > Project properties > Script ID)

### 3. Local Development Setup

1. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/meal-planner.git
   cd meal-planner
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Update the `.clasp.json` file with your Script ID:
   ```json
   {
     "scriptId": "YOUR_SCRIPT_ID_HERE",
     "rootDir": "dist"
   }
   ```

4. Log in to clasp:
   ```bash
   npx clasp login
   ```

5. Build and deploy:
   ```bash
   npm run build
   npm run push
   ```

### 4. Configuration

1. In the Google Apps Script project, set up script properties:
   - Go to Project Settings > Script Properties
   - Add the following properties:
     - `SPREADSHEET_ID`: Your Google Sheet ID
     - `OPTIONS_SHEET_NAME`: "Meal Options" (or your custom name)
     - `CURRENT_PLAN_SHEET_NAME`: "Current Plan" (or your custom name)
     - `PREVIOUS_PLAN_SHEET_NAME`: "Previous Plan" (or your custom name)
     - `ALLOW_STAPLE_REPETITION`: "true" or "false"
     - `DAYS_TO_GENERATE`: "7" (or your preferred number)

### 5. GitHub Actions Setup (Optional)

For automated weekly execution:

1. Store your clasp credentials as a GitHub Secret:
   - Go to your GitHub repository > Settings > Secrets > Actions
   - Add a new secret named `CLASP_TOKEN` with the content of your `~/.clasprc.json` file

2. The workflow will run automatically every Sunday at 5:00 AM UTC

## Usage

### Manual Execution

1. In the Google Apps Script editor, run the `manualRun` function
2. Check the "Current Plan" sheet for your new meal plan

### Weekly Automatic Execution

The meal plan will be generated automatically each week if you:

1. Set up a time-based trigger in Apps Script by running the `setupWeeklyTrigger` function once
2. Or use the GitHub Actions workflow which runs every Sunday

## Local Development

- Build the project: `npm run build`
- Deploy to Apps Script: `npm run push`

## License

MIT