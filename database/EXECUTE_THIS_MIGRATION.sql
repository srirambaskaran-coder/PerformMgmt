-- ========================================
-- COMPLETE MIGRATION SCRIPT FOR DEVELOPMENT GOALS
-- Run this entire script in SQL Server Management Studio
-- ========================================

-- Replace 'YourDatabaseName' with your actual database name
USE [YourDatabaseName];
GO

-- ========================================
-- 1. CREATE TABLE
-- ========================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[development_goals]') AND type in (N'U'))
BEGIN
  PRINT 'Creating development_goals table...';
  
  CREATE TABLE dbo.development_goals (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    evaluation_id UNIQUEIDENTIFIER NOT NULL,
    employee_id UNIQUEIDENTIFIER NOT NULL,
    description NVARCHAR(MAX) NOT NULL,
    planned_outcome NVARCHAR(MAX) NOT NULL,
    target_date DATETIME2 NOT NULL,
    progress INT DEFAULT 0,
    status NVARCHAR(20) DEFAULT 'not_started',
    created_at DATETIME2 DEFAULT SYSDATETIME(),
    updated_at DATETIME2 DEFAULT SYSDATETIME()
  );

  -- Add indexes
  CREATE NONCLUSTERED INDEX IX_development_goals_evaluation_id ON dbo.development_goals(evaluation_id);
  CREATE NONCLUSTERED INDEX IX_development_goals_employee_id ON dbo.development_goals(employee_id);
  
  PRINT 'Table created successfully!';
END
ELSE
BEGIN
  PRINT 'Table development_goals already exists, skipping creation.';
END
GO

-- ========================================
-- 2. CREATE STORED PROCEDURE
-- ========================================
PRINT 'Creating GetTeamMemberDevelopmentGoals stored procedure...';
GO

CREATE OR ALTER PROCEDURE dbo.GetTeamMemberDevelopmentGoals
    @ManagerId NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        dg.id AS Id,
        dg.employee_id AS EmployeeId,
        dg.evaluation_id AS EvaluationId,
        dg.description AS Description,
        dg.planned_outcome AS PlannedOutcome,
        dg.target_date AS TargetDate,
        dg.progress AS Progress,
        dg.status AS Status,
        dg.created_at AS CreatedAt,
        dg.updated_at AS UpdatedAt
    FROM development_goals dg
    INNER JOIN users emp ON dg.employee_id = emp.id
    WHERE emp.reporting_manager_id = @ManagerId
    ORDER BY dg.created_at DESC;
END
GO

PRINT 'Stored procedure created successfully!';
PRINT '';
PRINT '========================================';
PRINT 'MIGRATION COMPLETE!';
PRINT '========================================';
PRINT 'You can now restart your Node.js application.';
PRINT 'The Member Development Goals feature should now work.';
GO
