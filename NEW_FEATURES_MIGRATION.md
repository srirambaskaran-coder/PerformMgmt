# Migration Guide: Calibrate Ratings and Development Goals Features

## Overview
This migration adds the following features from the `Calibrate-Ratings-and-Development-Goals` branch:
1. **Analytics Dashboard** - Performance trends and insights for HR managers
2. **Enhanced Calibrate Ratings** - Excel import/export functionality
3. **Member Development Goals** - Managers can view team members' development goals

## Changes Made

### 1. Frontend Changes

#### New Pages Added
- **`Analytics.tsx`** - Analytics dashboard with performance metrics, charts, and trends
- **`MemberDevelopmentGoals.tsx`** - Manager view for team development goals

#### Updated Pages
- **`CalibrateRatings.tsx`** - Added Excel import/export functionality with template generation

#### Updated Components
- **`Sidebar.tsx`**
  - Added `BarChart3` icon import
  - Added "Analytics" menu item for HR managers
  - Added "Member Development Goals" menu item for managers

- **`App.tsx`**
  - Added route imports for `Analytics` and `MemberDevelopmentGoals`
  - Added routes `/analytics` and `/member-development-goals`

### 2. Backend Changes

#### Updated Files

**`server/storage.ts`**
- Added `getTeamMemberDevelopmentGoals(managerId: string)` method to IStorage interface
- Implemented method to call `dbo.GetTeamMemberDevelopmentGoals` stored procedure

**`server/routes.ts`**
- Added `/api/analytics/performance-trends` endpoint (GET) - Returns comprehensive analytics data
- Added `/api/evaluations/calibrate/import` endpoint (POST) - Bulk import calibrated ratings from Excel
- Added `/api/development-goals/team` endpoint (GET) - Returns development goals for manager's team members

### 3. Database Changes

**New Stored Procedure Required:**
- **`dbo.GetTeamMemberDevelopmentGoals`** - Retrieves development goals for employees managed by a specific manager

**SQL Script Location:**
- `database/stored_procedures_new_features.sql`

## Installation Steps

### Step 1: Run Database Migration
Execute the SQL script to create the new stored procedure:

```sql
-- Run this in your MSSQL database
-- File: database/stored_procedures_new_features.sql
```

The script creates:
- `dbo.GetTeamMemberDevelopmentGoals` stored procedure

### Step 2: Verify Existing Stored Procedures
Make sure these procedures already exist (they should from your previous setup):
- `dbo.GetEvaluationsForCalibration` - Returns evaluations with calibration data
- `dbo.UpdateEvaluationCalibration` - Updates calibration fields

If they don't exist, uncomment and run the reference implementations in the SQL script.

### Step 3: Install Dependencies (if needed)
The new features use existing dependencies. No new packages required.

### Step 4: Test the Features

#### Test Analytics Dashboard
1. Login as HR Manager
2. Navigate to **Analytics** from sidebar
3. Verify you see:
   - Summary cards (employees, evaluations, ratings)
   - Rating distribution chart
   - Performance trends by appraisal cycle
   - Department/Location/Level/Grade comparisons

#### Test Enhanced Calibrate Ratings
1. Login as HR Manager
2. Navigate to **Calibrate Ratings**
3. Test:
   - Export to Excel (download button)
   - Download Template (template button)
   - Import from Excel (upload button)

#### Test Member Development Goals
1. Login as Manager
2. Navigate to **Member Development Goals**
3. Verify you see:
   - Development goals of team members
   - Filter options (appraisal cycle, employee search, etc.)
   - Goal details (description, target date, progress, status)

## API Endpoints Added

### 1. Analytics Endpoint
```
GET /api/analytics/performance-trends
Roles: super_admin, admin, hr_manager
Returns: {
  summary: { ... },
  ratingDistribution: [ ... ],
  cyclePerformance: [ ... ],
  departmentStats: [ ... ],
  locationStats: [ ... ],
  levelStats: [ ... ],
  gradeStats: [ ... ],
  managerStats: [ ... ]
}
```

### 2. Import Calibrations
```
POST /api/evaluations/calibrate/import
Roles: hr_manager
Body: {
  calibrations: [
    {
      evaluationId: string,
      employeeCode: string,
      calibratedRating: number,
      remarks: string
    }
  ]
}
Returns: {
  summary: { successful: number, failed: number },
  errors: [ ... ]
}
```

### 3. Team Development Goals
```
GET /api/development-goals/team
Roles: manager
Returns: [
  {
    ...goal,
    employee: { ... },
    evaluation: { ... },
    appraisalCycle: { ... },
    appraisalGroup: { ... },
    frequencyCalendarPeriod: { ... }
  }
]
```

## Feature Details

### Analytics Dashboard Features
- **Summary Metrics**: Total employees, completed evaluations, average ratings
- **Rating Distribution**: Visual breakdown of ratings (1-5)
- **Cycle Performance**: Trends across appraisal cycles
- **Department Comparison**: Performance by department
- **Location Analysis**: Ratings by office location
- **Level/Grade Insights**: Performance by employee level and grade
- **Manager Performance**: Team sizes and average ratings given

### Calibrate Ratings Enhancements
- **Excel Export**: Export all evaluations to Excel for offline work
- **Template Download**: Pre-formatted Excel template with instructions
- **Bulk Import**: Upload calibrated ratings from Excel (max 500 records)
- **Validation**: Automatic validation of employee codes and ratings
- **Error Reporting**: Detailed errors for failed imports

### Member Development Goals
- **Team View**: See all development goals for direct reports
- **Advanced Filters**: Filter by appraisal cycle, employee, location, etc.
- **Goal Tracking**: View progress and status of each goal
- **Evaluation Context**: See related evaluation and appraisal cycle info

## Rollback Plan

If you need to rollback these changes:

1. **Revert Frontend Changes**:
   ```bash
   cd D:\PMS_newchanges\PerformMgmt
   git checkout HEAD~1 client/src/App.tsx
   git checkout HEAD~1 client/src/components/Sidebar.tsx
   git checkout HEAD~1 client/src/pages/CalibrateRatings.tsx
   # Remove new files
   rm client/src/pages/Analytics.tsx
   rm client/src/pages/MemberDevelopmentGoals.tsx
   ```

2. **Revert Backend Changes**:
   ```bash
   git checkout HEAD~1 server/routes.ts
   git checkout HEAD~1 server/storage.ts
   ```

3. **Drop Database Objects** (optional):
   ```sql
   DROP PROCEDURE IF EXISTS dbo.GetTeamMemberDevelopmentGoals;
   ```

## Notes

- All changes are backward compatible with existing functionality
- The features use MSSQL stored procedures (no ORM)
- Excel import is limited to 500 records per batch for performance
- Analytics data is computed on-demand (no caching yet)
- All endpoints respect company isolation and role-based access control

## Support

If you encounter issues:
1. Check browser console for frontend errors
2. Check server logs for backend errors
3. Verify stored procedures exist in database
4. Ensure user has proper role assignments
5. Verify company data exists and is properly linked

## Testing Checklist

- [ ] SQL stored procedure created successfully
- [ ] Analytics page loads without errors
- [ ] Charts display correctly on Analytics page
- [ ] Calibrate Ratings export works
- [ ] Calibrate Ratings template download works
- [ ] Calibrate Ratings import works with valid data
- [ ] Import validation catches invalid data
- [ ] Member Development Goals page loads for managers
- [ ] Filters work on Member Development Goals page
- [ ] No console errors in browser
- [ ] No errors in server logs
- [ ] All existing features still work

---
**Migration completed on**: December 11, 2025
**Source branch**: Calibrate-Ratings-and-Development-Goals
**Source repo**: https://github.com/kirankshetty/PerformMgmt.git
