-- ========================================
-- DEVELOPMENT GOALS STORED PROCEDURES
-- Performance Management System - MSSQL
-- ========================================

USE [YourDatabaseName];
GO
SET XACT_ABORT ON;
GO

-- ========================================
-- DEVELOPMENT GOALS TABLE
-- ========================================

-- First, create the table if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[development_goals]') AND type in (N'U'))
BEGIN
  CREATE TABLE dbo.development_goals (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    evaluation_id UNIQUEIDENTIFIER NOT NULL,
    employee_id UNIQUEIDENTIFIER NOT NULL,
    description NVARCHAR(MAX) NOT NULL,
    planned_outcome NVARCHAR(MAX) NOT NULL,
    target_date DATETIME2 NOT NULL,
    progress INT DEFAULT 0,
    status NVARCHAR(20) DEFAULT 'not_started', -- 'on_track', 'delayed', 'completed', 'not_started'
    created_at DATETIME2 DEFAULT SYSDATETIME(),
    updated_at DATETIME2 DEFAULT SYSDATETIME()
  );

  -- Add indexes
  CREATE NONCLUSTERED INDEX IX_development_goals_evaluation_id ON dbo.development_goals(evaluation_id);
  CREATE NONCLUSTERED INDEX IX_development_goals_employee_id ON dbo.development_goals(employee_id);
END
GO

-- ========================================
-- HELPER PROCEDURES (Lookups without ownership check)
-- ========================================

CREATE OR ALTER PROCEDURE dbo.GetAppraisalCycleById
  @Id UNIQUEIDENTIFIER
AS
BEGIN
  SET NOCOUNT ON;
  SELECT
    id AS Id,
    code AS Code,
    description AS Description,
    from_date AS FromDate,
    to_date AS ToDate,
    status AS Status,
    created_by_id AS CreatedById,
    created_at AS CreatedAt,
    updated_at AS UpdatedAt
  FROM dbo.appraisal_cycles
  WHERE id = @Id;
END
GO

CREATE OR ALTER PROCEDURE dbo.GetFrequencyCalendarById
  @Id UNIQUEIDENTIFIER
AS
BEGIN
  SET NOCOUNT ON;
  SELECT
    id AS Id,
    code AS Code,
    description AS Description,
    review_frequency_id AS ReviewFrequencyId,
    appraisal_cycle_id AS AppraisalCycleId,
    status AS Status,
    created_by_id AS CreatedById,
    created_at AS CreatedAt,
    updated_at AS UpdatedAt
  FROM dbo.frequency_calendars
  WHERE id = @Id;
END
GO

-- ========================================
-- DEVELOPMENT GOALS PROCEDURES
-- ========================================

-- Get all development goals for an employee
CREATE OR ALTER PROCEDURE dbo.GetDevelopmentGoals
  @EmployeeId UNIQUEIDENTIFIER
AS
BEGIN
  SET NOCOUNT ON;
  SELECT
    id AS Id,
    evaluation_id AS EvaluationId,
    employee_id AS EmployeeId,
    description AS Description,
    planned_outcome AS PlannedOutcome,
    target_date AS TargetDate,
    progress AS Progress,
    status AS Status,
    created_at AS CreatedAt,
    updated_at AS UpdatedAt
  FROM dbo.development_goals
  WHERE employee_id = @EmployeeId
  ORDER BY created_at DESC;
END
GO

-- Get development goals for a specific evaluation
CREATE OR ALTER PROCEDURE dbo.GetDevelopmentGoalsByEvaluation
  @EvaluationId UNIQUEIDENTIFIER
AS
BEGIN
  SET NOCOUNT ON;
  SELECT
    id AS Id,
    evaluation_id AS EvaluationId,
    employee_id AS EmployeeId,
    description AS Description,
    planned_outcome AS PlannedOutcome,
    target_date AS TargetDate,
    progress AS Progress,
    status AS Status,
    created_at AS CreatedAt,
    updated_at AS UpdatedAt
  FROM dbo.development_goals
  WHERE evaluation_id = @EvaluationId
  ORDER BY created_at DESC;
END
GO

-- Get a single development goal by ID
CREATE OR ALTER PROCEDURE dbo.GetDevelopmentGoal
  @Id UNIQUEIDENTIFIER
AS
BEGIN
  SET NOCOUNT ON;
  SELECT
    id AS Id,
    evaluation_id AS EvaluationId,
    employee_id AS EmployeeId,
    description AS Description,
    planned_outcome AS PlannedOutcome,
    target_date AS TargetDate,
    progress AS Progress,
    status AS Status,
    created_at AS CreatedAt,
    updated_at AS UpdatedAt
  FROM dbo.development_goals
  WHERE id = @Id;
END
GO

-- Create a new development goal
CREATE OR ALTER PROCEDURE dbo.CreateDevelopmentGoal
  @EvaluationId UNIQUEIDENTIFIER,
  @EmployeeId UNIQUEIDENTIFIER,
  @Description NVARCHAR(MAX),
  @PlannedOutcome NVARCHAR(MAX),
  @TargetDate DATETIME2,
  @Progress INT = 0,
  @Status NVARCHAR(20) = 'not_started'
AS
BEGIN
  SET NOCOUNT ON;
  DECLARE @NewId UNIQUEIDENTIFIER = NEWID();
  DECLARE @Now DATETIME2 = SYSDATETIME();

  INSERT INTO dbo.development_goals (
    id, evaluation_id, employee_id, description, planned_outcome,
    target_date, progress, status, created_at, updated_at
  )
  VALUES (
    @NewId, @EvaluationId, @EmployeeId, @Description, @PlannedOutcome,
    @TargetDate, @Progress, @Status, @Now, @Now
  );

  SELECT
    id AS Id,
    evaluation_id AS EvaluationId,
    employee_id AS EmployeeId,
    description AS Description,
    planned_outcome AS PlannedOutcome,
    target_date AS TargetDate,
    progress AS Progress,
    status AS Status,
    created_at AS CreatedAt,
    updated_at AS UpdatedAt
  FROM dbo.development_goals
  WHERE id = @NewId;
END
GO

-- Update a development goal
CREATE OR ALTER PROCEDURE dbo.UpdateDevelopmentGoal
  @Id UNIQUEIDENTIFIER,
  @Description NVARCHAR(MAX) = NULL,
  @PlannedOutcome NVARCHAR(MAX) = NULL,
  @TargetDate DATETIME2 = NULL,
  @Progress INT = NULL,
  @Status NVARCHAR(20) = NULL
AS
BEGIN
  SET NOCOUNT ON;

  UPDATE dbo.development_goals
  SET
    description = COALESCE(@Description, description),
    planned_outcome = COALESCE(@PlannedOutcome, planned_outcome),
    target_date = COALESCE(@TargetDate, target_date),
    progress = COALESCE(@Progress, progress),
    status = COALESCE(@Status, status),
    updated_at = SYSDATETIME()
  WHERE id = @Id;

  SELECT
    id AS Id,
    evaluation_id AS EvaluationId,
    employee_id AS EmployeeId,
    description AS Description,
    planned_outcome AS PlannedOutcome,
    target_date AS TargetDate,
    progress AS Progress,
    status AS Status,
    created_at AS CreatedAt,
    updated_at AS UpdatedAt
  FROM dbo.development_goals
  WHERE id = @Id;
END
GO

-- Delete a development goal
CREATE OR ALTER PROCEDURE dbo.DeleteDevelopmentGoal
  @Id UNIQUEIDENTIFIER
AS
BEGIN
  SET NOCOUNT ON;
  DELETE FROM dbo.development_goals WHERE id = @Id;
END
GO

PRINT 'Development Goals stored procedures created successfully!';
GO
