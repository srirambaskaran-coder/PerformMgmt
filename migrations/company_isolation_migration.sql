-- ========================================
-- COMPANY-BASED DATA ISOLATION MIGRATION
-- Performance Management System - MSSQL
-- ========================================
-- This migration changes filtering from CreatedById to CompanyId
-- for multi-tenant data isolation within organizations.
-- ========================================

USE [YourDatabaseName];
GO
SET XACT_ABORT ON;
GO

-- ========================================
-- STEP 1: ADD COMPANY_ID COLUMNS TO TABLES
-- ========================================

-- Add company_id to levels table if not exists
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.levels') AND name = 'company_id')
BEGIN
  ALTER TABLE dbo.levels ADD company_id UNIQUEIDENTIFIER NULL;
  PRINT 'Added company_id column to levels table';
END
GO

-- Add company_id to grades table if not exists
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.grades') AND name = 'company_id')
BEGIN
  ALTER TABLE dbo.grades ADD company_id UNIQUEIDENTIFIER NULL;
  PRINT 'Added company_id column to grades table';
END
GO

-- Add company_id to departments table if not exists
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.departments') AND name = 'company_id')
BEGIN
  ALTER TABLE dbo.departments ADD company_id UNIQUEIDENTIFIER NULL;
  PRINT 'Added company_id column to departments table';
END
GO

-- Add company_id to appraisal_cycles table if not exists
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.appraisal_cycles') AND name = 'company_id')
BEGIN
  ALTER TABLE dbo.appraisal_cycles ADD company_id UNIQUEIDENTIFIER NULL;
  PRINT 'Added company_id column to appraisal_cycles table';
END
GO

-- Add company_id to review_frequencies table if not exists
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.review_frequencies') AND name = 'company_id')
BEGIN
  ALTER TABLE dbo.review_frequencies ADD company_id UNIQUEIDENTIFIER NULL;
  PRINT 'Added company_id column to review_frequencies table';
END
GO

-- Add company_id to frequency_calendars table if not exists
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.frequency_calendars') AND name = 'company_id')
BEGIN
  ALTER TABLE dbo.frequency_calendars ADD company_id UNIQUEIDENTIFIER NULL;
  PRINT 'Added company_id column to frequency_calendars table';
END
GO

-- Add company_id to frequency_calendar_details table if not exists
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.frequency_calendar_details') AND name = 'company_id')
BEGIN
  ALTER TABLE dbo.frequency_calendar_details ADD company_id UNIQUEIDENTIFIER NULL;
  PRINT 'Added company_id column to frequency_calendar_details table';
END
GO

-- Add company_id to questionnaire_templates table if not exists
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.questionnaire_templates') AND name = 'company_id')
BEGIN
  ALTER TABLE dbo.questionnaire_templates ADD company_id UNIQUEIDENTIFIER NULL;
  PRINT 'Added company_id column to questionnaire_templates table';
END
GO

-- Add company_id to publish_questionnaires table if not exists
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.publish_questionnaires') AND name = 'company_id')
BEGIN
  ALTER TABLE dbo.publish_questionnaires ADD company_id UNIQUEIDENTIFIER NULL;
  PRINT 'Added company_id column to publish_questionnaires table';
END
GO

-- Add company_id to locations table if not exists
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.locations') AND name = 'company_id')
BEGIN
  ALTER TABLE dbo.locations ADD company_id UNIQUEIDENTIFIER NULL;
  PRINT 'Added company_id column to locations table';
END
GO

-- ========================================
-- STEP 2: POPULATE COMPANY_ID FROM CREATOR'S COMPANY
-- ========================================

-- Update levels with creator's company_id
UPDATE l
SET l.company_id = u.company_id
FROM dbo.levels l
INNER JOIN dbo.users u ON l.created_by_id = u.id
WHERE l.company_id IS NULL AND u.company_id IS NOT NULL;
PRINT 'Populated company_id for levels';
GO

-- Update grades with creator's company_id
UPDATE g
SET g.company_id = u.company_id
FROM dbo.grades g
INNER JOIN dbo.users u ON g.created_by_id = u.id
WHERE g.company_id IS NULL AND u.company_id IS NOT NULL;
PRINT 'Populated company_id for grades';
GO

-- Update departments with creator's company_id
UPDATE d
SET d.company_id = u.company_id
FROM dbo.departments d
INNER JOIN dbo.users u ON d.created_by_id = u.id
WHERE d.company_id IS NULL AND u.company_id IS NOT NULL;
PRINT 'Populated company_id for departments';
GO

-- Update appraisal_cycles with creator's company_id
UPDATE ac
SET ac.company_id = u.company_id
FROM dbo.appraisal_cycles ac
INNER JOIN dbo.users u ON ac.created_by_id = u.id
WHERE ac.company_id IS NULL AND u.company_id IS NOT NULL;
PRINT 'Populated company_id for appraisal_cycles';
GO

-- Update review_frequencies with creator's company_id
UPDATE rf
SET rf.company_id = u.company_id
FROM dbo.review_frequencies rf
INNER JOIN dbo.users u ON rf.created_by_id = u.id
WHERE rf.company_id IS NULL AND u.company_id IS NOT NULL;
PRINT 'Populated company_id for review_frequencies';
GO

-- Update frequency_calendars with creator's company_id
UPDATE fc
SET fc.company_id = u.company_id
FROM dbo.frequency_calendars fc
INNER JOIN dbo.users u ON fc.created_by_id = u.id
WHERE fc.company_id IS NULL AND u.company_id IS NOT NULL;
PRINT 'Populated company_id for frequency_calendars';
GO

-- Update frequency_calendar_details with creator's company_id
UPDATE fcd
SET fcd.company_id = u.company_id
FROM dbo.frequency_calendar_details fcd
INNER JOIN dbo.users u ON fcd.created_by_id = u.id
WHERE fcd.company_id IS NULL AND u.company_id IS NOT NULL;
PRINT 'Populated company_id for frequency_calendar_details';
GO

-- Update questionnaire_templates with creator's company_id
UPDATE qt
SET qt.company_id = u.company_id
FROM dbo.questionnaire_templates qt
INNER JOIN dbo.users u ON qt.created_by_id = u.id
WHERE qt.company_id IS NULL AND u.company_id IS NOT NULL;
PRINT 'Populated company_id for questionnaire_templates';
GO

-- Update publish_questionnaires with creator's company_id
UPDATE pq
SET pq.company_id = u.company_id
FROM dbo.publish_questionnaires pq
INNER JOIN dbo.users u ON pq.created_by_id = u.id
WHERE pq.company_id IS NULL AND u.company_id IS NOT NULL;
PRINT 'Populated company_id for publish_questionnaires';
GO

-- Update locations with creator's company_id
UPDATE loc
SET loc.company_id = u.company_id
FROM dbo.locations loc
INNER JOIN dbo.users u ON loc.created_by_id = u.id
WHERE loc.company_id IS NULL AND u.company_id IS NOT NULL;
PRINT 'Populated company_id for locations';
GO

-- ========================================
-- STEP 3: CREATE INDEXES ON COMPANY_ID
-- ========================================

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_levels_company_id' AND object_id = OBJECT_ID('dbo.levels'))
  CREATE INDEX IX_levels_company_id ON dbo.levels(company_id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_grades_company_id' AND object_id = OBJECT_ID('dbo.grades'))
  CREATE INDEX IX_grades_company_id ON dbo.grades(company_id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_departments_company_id' AND object_id = OBJECT_ID('dbo.departments'))
  CREATE INDEX IX_departments_company_id ON dbo.departments(company_id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_appraisal_cycles_company_id' AND object_id = OBJECT_ID('dbo.appraisal_cycles'))
  CREATE INDEX IX_appraisal_cycles_company_id ON dbo.appraisal_cycles(company_id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_review_frequencies_company_id' AND object_id = OBJECT_ID('dbo.review_frequencies'))
  CREATE INDEX IX_review_frequencies_company_id ON dbo.review_frequencies(company_id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_frequency_calendars_company_id' AND object_id = OBJECT_ID('dbo.frequency_calendars'))
  CREATE INDEX IX_frequency_calendars_company_id ON dbo.frequency_calendars(company_id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_frequency_calendar_details_company_id' AND object_id = OBJECT_ID('dbo.frequency_calendar_details'))
  CREATE INDEX IX_frequency_calendar_details_company_id ON dbo.frequency_calendar_details(company_id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_questionnaire_templates_company_id' AND object_id = OBJECT_ID('dbo.questionnaire_templates'))
  CREATE INDEX IX_questionnaire_templates_company_id ON dbo.questionnaire_templates(company_id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_locations_company_id' AND object_id = OBJECT_ID('dbo.locations'))
  CREATE INDEX IX_locations_company_id ON dbo.locations(company_id);
GO

PRINT 'Created indexes on company_id columns';
GO

-- ========================================
-- STEP 4: UPDATE STORED PROCEDURES
-- ========================================

-- ========================================
-- LEVELS - Updated to use CompanyId
-- ========================================

CREATE OR ALTER PROCEDURE dbo.GetLevels
  @CompanyId UNIQUEIDENTIFIER
AS
BEGIN
  SET NOCOUNT ON;
  SELECT 
    id AS Id, code AS Code, description AS Description,
    status AS Status, created_at AS CreatedAt, updated_at AS UpdatedAt,
    created_by_id AS CreatedById, company_id AS CompanyId
  FROM dbo.levels
  WHERE company_id = @CompanyId AND status = 'active'
  ORDER BY code;
END
GO

CREATE OR ALTER PROCEDURE dbo.GetLevel
  @Id UNIQUEIDENTIFIER,
  @CompanyId UNIQUEIDENTIFIER
AS
BEGIN
  SET NOCOUNT ON;
  SELECT 
    id AS Id, code AS Code, description AS Description,
    status AS Status, created_at AS CreatedAt, updated_at AS UpdatedAt,
    created_by_id AS CreatedById, company_id AS CompanyId
  FROM dbo.levels
  WHERE id = @Id AND company_id = @CompanyId;
END
GO

CREATE OR ALTER PROCEDURE dbo.CreateLevel
  @Code NVARCHAR(100),
  @Description NVARCHAR(MAX),
  @CompanyId UNIQUEIDENTIFIER,
  @CreatedById UNIQUEIDENTIFIER,
  @Status NVARCHAR(20) = 'active'
AS
BEGIN
  SET NOCOUNT ON;
  DECLARE @Id UNIQUEIDENTIFIER = NEWID();
  
  INSERT INTO dbo.levels (id, code, description, status, company_id, created_by_id, created_at, updated_at)
  VALUES (@Id, @Code, @Description, @Status, @CompanyId, @CreatedById, SYSDATETIME(), SYSDATETIME());
  
  EXEC dbo.GetLevel @Id, @CompanyId;
END
GO

CREATE OR ALTER PROCEDURE dbo.UpdateLevel
  @Id UNIQUEIDENTIFIER,
  @Code NVARCHAR(100) = NULL,
  @Description NVARCHAR(MAX) = NULL,
  @Status NVARCHAR(20) = NULL,
  @CompanyId UNIQUEIDENTIFIER
AS
BEGIN
  SET NOCOUNT ON;
  
  UPDATE dbo.levels
  SET code = COALESCE(@Code, code),
      description = COALESCE(@Description, description),
      status = COALESCE(@Status, status),
      updated_at = SYSDATETIME()
  WHERE id = @Id AND company_id = @CompanyId;
  
  EXEC dbo.GetLevel @Id, @CompanyId;
END
GO

CREATE OR ALTER PROCEDURE dbo.DeleteLevel
  @Id UNIQUEIDENTIFIER,
  @CompanyId UNIQUEIDENTIFIER
AS
BEGIN
  SET NOCOUNT ON;
  DELETE FROM dbo.levels WHERE id = @Id AND company_id = @CompanyId;
END
GO

-- ========================================
-- GRADES - Updated to use CompanyId
-- ========================================

CREATE OR ALTER PROCEDURE dbo.GetGrades
  @CompanyId UNIQUEIDENTIFIER
AS
BEGIN
  SET NOCOUNT ON;
  SELECT 
    id AS Id, code AS Code, description AS Description,
    status AS Status, created_at AS CreatedAt, updated_at AS UpdatedAt,
    created_by_id AS CreatedById, company_id AS CompanyId
  FROM dbo.grades
  WHERE company_id = @CompanyId AND status = 'active'
  ORDER BY code;
END
GO

CREATE OR ALTER PROCEDURE dbo.GetGrade
  @Id UNIQUEIDENTIFIER,
  @CompanyId UNIQUEIDENTIFIER
AS
BEGIN
  SET NOCOUNT ON;
  SELECT 
    id AS Id, code AS Code, description AS Description,
    status AS Status, created_at AS CreatedAt, updated_at AS UpdatedAt,
    created_by_id AS CreatedById, company_id AS CompanyId
  FROM dbo.grades
  WHERE id = @Id AND company_id = @CompanyId;
END
GO

CREATE OR ALTER PROCEDURE dbo.CreateGrade
  @Code NVARCHAR(100),
  @Description NVARCHAR(MAX),
  @CompanyId UNIQUEIDENTIFIER,
  @CreatedById UNIQUEIDENTIFIER,
  @Status NVARCHAR(20) = 'active'
AS
BEGIN
  SET NOCOUNT ON;
  DECLARE @Id UNIQUEIDENTIFIER = NEWID();
  
  INSERT INTO dbo.grades (id, code, description, status, company_id, created_by_id, created_at, updated_at)
  VALUES (@Id, @Code, @Description, @Status, @CompanyId, @CreatedById, SYSDATETIME(), SYSDATETIME());
  
  EXEC dbo.GetGrade @Id, @CompanyId;
END
GO

CREATE OR ALTER PROCEDURE dbo.UpdateGrade
  @Id UNIQUEIDENTIFIER,
  @Code NVARCHAR(100) = NULL,
  @Description NVARCHAR(MAX) = NULL,
  @Status NVARCHAR(20) = NULL,
  @CompanyId UNIQUEIDENTIFIER
AS
BEGIN
  SET NOCOUNT ON;
  
  UPDATE dbo.grades
  SET code = COALESCE(@Code, code),
      description = COALESCE(@Description, description),
      status = COALESCE(@Status, status),
      updated_at = SYSDATETIME()
  WHERE id = @Id AND company_id = @CompanyId;
  
  EXEC dbo.GetGrade @Id, @CompanyId;
END
GO

CREATE OR ALTER PROCEDURE dbo.DeleteGrade
  @Id UNIQUEIDENTIFIER,
  @CompanyId UNIQUEIDENTIFIER
AS
BEGIN
  SET NOCOUNT ON;
  DELETE FROM dbo.grades WHERE id = @Id AND company_id = @CompanyId;
END
GO

-- ========================================
-- DEPARTMENTS - Updated to use CompanyId
-- ========================================

CREATE OR ALTER PROCEDURE dbo.GetDepartments
  @CompanyId UNIQUEIDENTIFIER
AS
BEGIN
  SET NOCOUNT ON;
  SELECT 
    id AS Id, code AS Code, description AS Description,
    status AS Status, created_at AS CreatedAt, updated_at AS UpdatedAt,
    created_by_id AS CreatedById, company_id AS CompanyId
  FROM dbo.departments
  WHERE company_id = @CompanyId AND status = 'active'
  ORDER BY code;
END
GO

CREATE OR ALTER PROCEDURE dbo.GetDepartment
  @Id UNIQUEIDENTIFIER,
  @CompanyId UNIQUEIDENTIFIER
AS
BEGIN
  SET NOCOUNT ON;
  SELECT 
    id AS Id, code AS Code, description AS Description,
    status AS Status, created_at AS CreatedAt, updated_at AS UpdatedAt,
    created_by_id AS CreatedById, company_id AS CompanyId
  FROM dbo.departments
  WHERE id = @Id AND company_id = @CompanyId;
END
GO

CREATE OR ALTER PROCEDURE dbo.CreateDepartment
  @Code NVARCHAR(100),
  @Description NVARCHAR(MAX),
  @CompanyId UNIQUEIDENTIFIER,
  @CreatedById UNIQUEIDENTIFIER,
  @Status NVARCHAR(20) = 'active'
AS
BEGIN
  SET NOCOUNT ON;
  DECLARE @Id UNIQUEIDENTIFIER = NEWID();
  
  INSERT INTO dbo.departments (id, code, description, status, company_id, created_by_id, created_at, updated_at)
  VALUES (@Id, @Code, @Description, @Status, @CompanyId, @CreatedById, SYSDATETIME(), SYSDATETIME());
  
  EXEC dbo.GetDepartment @Id, @CompanyId;
END
GO

CREATE OR ALTER PROCEDURE dbo.UpdateDepartment
  @Id UNIQUEIDENTIFIER,
  @Code NVARCHAR(100) = NULL,
  @Description NVARCHAR(MAX) = NULL,
  @Status NVARCHAR(20) = NULL,
  @CompanyId UNIQUEIDENTIFIER
AS
BEGIN
  SET NOCOUNT ON;
  
  UPDATE dbo.departments
  SET code = COALESCE(@Code, code),
      description = COALESCE(@Description, description),
      status = COALESCE(@Status, status),
      updated_at = SYSDATETIME()
  WHERE id = @Id AND company_id = @CompanyId;
  
  EXEC dbo.GetDepartment @Id, @CompanyId;
END
GO

CREATE OR ALTER PROCEDURE dbo.DeleteDepartment
  @Id UNIQUEIDENTIFIER,
  @CompanyId UNIQUEIDENTIFIER
AS
BEGIN
  SET NOCOUNT ON;
  DELETE FROM dbo.departments WHERE id = @Id AND company_id = @CompanyId;
END
GO

-- ========================================
-- APPRAISAL CYCLES - Updated to use CompanyId
-- ========================================

CREATE OR ALTER PROCEDURE dbo.GetAppraisalCycles
  @CompanyId UNIQUEIDENTIFIER
AS
BEGIN
  SET NOCOUNT ON;
  SELECT 
    id AS Id, name AS Name, start_date AS StartDate, end_date AS EndDate,
    status AS Status, description AS Description,
    created_at AS CreatedAt, updated_at AS UpdatedAt,
    created_by_id AS CreatedById, company_id AS CompanyId
  FROM dbo.appraisal_cycles
  WHERE company_id = @CompanyId AND status = 'active'
  ORDER BY start_date DESC;
END
GO

CREATE OR ALTER PROCEDURE dbo.GetAppraisalCycle
  @Id UNIQUEIDENTIFIER,
  @CompanyId UNIQUEIDENTIFIER
AS
BEGIN
  SET NOCOUNT ON;
  SELECT 
    id AS Id, name AS Name, start_date AS StartDate, end_date AS EndDate,
    status AS Status, description AS Description,
    created_at AS CreatedAt, updated_at AS UpdatedAt,
    created_by_id AS CreatedById, company_id AS CompanyId
  FROM dbo.appraisal_cycles
  WHERE id = @Id AND company_id = @CompanyId;
END
GO

CREATE OR ALTER PROCEDURE dbo.CreateAppraisalCycle
  @Name NVARCHAR(255),
  @StartDate DATE,
  @EndDate DATE,
  @Description NVARCHAR(MAX) = NULL,
  @CompanyId UNIQUEIDENTIFIER,
  @CreatedById UNIQUEIDENTIFIER,
  @Status NVARCHAR(20) = 'active'
AS
BEGIN
  SET NOCOUNT ON;
  DECLARE @Id UNIQUEIDENTIFIER = NEWID();
  
  INSERT INTO dbo.appraisal_cycles (id, name, start_date, end_date, description, status, company_id, created_by_id, created_at, updated_at)
  VALUES (@Id, @Name, @StartDate, @EndDate, @Description, @Status, @CompanyId, @CreatedById, SYSDATETIME(), SYSDATETIME());
  
  EXEC dbo.GetAppraisalCycle @Id, @CompanyId;
END
GO

CREATE OR ALTER PROCEDURE dbo.UpdateAppraisalCycle
  @Id UNIQUEIDENTIFIER,
  @Name NVARCHAR(255) = NULL,
  @StartDate DATE = NULL,
  @EndDate DATE = NULL,
  @Description NVARCHAR(MAX) = NULL,
  @Status NVARCHAR(20) = NULL,
  @CompanyId UNIQUEIDENTIFIER
AS
BEGIN
  SET NOCOUNT ON;
  
  UPDATE dbo.appraisal_cycles
  SET name = COALESCE(@Name, name),
      start_date = COALESCE(@StartDate, start_date),
      end_date = COALESCE(@EndDate, end_date),
      description = COALESCE(@Description, description),
      status = COALESCE(@Status, status),
      updated_at = SYSDATETIME()
  WHERE id = @Id AND company_id = @CompanyId;
  
  EXEC dbo.GetAppraisalCycle @Id, @CompanyId;
END
GO

CREATE OR ALTER PROCEDURE dbo.DeleteAppraisalCycle
  @Id UNIQUEIDENTIFIER,
  @CompanyId UNIQUEIDENTIFIER
AS
BEGIN
  SET NOCOUNT ON;
  DELETE FROM dbo.appraisal_cycles WHERE id = @Id AND company_id = @CompanyId;
END
GO

-- ========================================
-- REVIEW FREQUENCIES - Updated to use CompanyId
-- ========================================

CREATE OR ALTER PROCEDURE dbo.GetReviewFrequencies
  @CompanyId UNIQUEIDENTIFIER
AS
BEGIN
  SET NOCOUNT ON;
  SELECT 
    id AS Id, code AS Code, description AS Description,
    status AS Status, created_at AS CreatedAt, updated_at AS UpdatedAt,
    created_by_id AS CreatedById, company_id AS CompanyId
  FROM dbo.review_frequencies
  WHERE company_id = @CompanyId AND status = 'active'
  ORDER BY code;
END
GO

CREATE OR ALTER PROCEDURE dbo.GetReviewFrequency
  @Id UNIQUEIDENTIFIER,
  @CompanyId UNIQUEIDENTIFIER
AS
BEGIN
  SET NOCOUNT ON;
  SELECT 
    id AS Id, code AS Code, description AS Description,
    status AS Status, created_at AS CreatedAt, updated_at AS UpdatedAt,
    created_by_id AS CreatedById, company_id AS CompanyId
  FROM dbo.review_frequencies
  WHERE id = @Id AND company_id = @CompanyId;
END
GO

CREATE OR ALTER PROCEDURE dbo.CreateReviewFrequency
  @Code NVARCHAR(100),
  @Description NVARCHAR(MAX),
  @CompanyId UNIQUEIDENTIFIER,
  @CreatedById UNIQUEIDENTIFIER,
  @Status NVARCHAR(20) = 'active'
AS
BEGIN
  SET NOCOUNT ON;
  DECLARE @Id UNIQUEIDENTIFIER = NEWID();
  
  INSERT INTO dbo.review_frequencies (id, code, description, status, company_id, created_by_id, created_at, updated_at)
  VALUES (@Id, @Code, @Description, @Status, @CompanyId, @CreatedById, SYSDATETIME(), SYSDATETIME());
  
  EXEC dbo.GetReviewFrequency @Id, @CompanyId;
END
GO

CREATE OR ALTER PROCEDURE dbo.UpdateReviewFrequency
  @Id UNIQUEIDENTIFIER,
  @Code NVARCHAR(100) = NULL,
  @Description NVARCHAR(MAX) = NULL,
  @Status NVARCHAR(20) = NULL,
  @CompanyId UNIQUEIDENTIFIER
AS
BEGIN
  SET NOCOUNT ON;
  
  UPDATE dbo.review_frequencies
  SET code = COALESCE(@Code, code),
      description = COALESCE(@Description, description),
      status = COALESCE(@Status, status),
      updated_at = SYSDATETIME()
  WHERE id = @Id AND company_id = @CompanyId;
  
  EXEC dbo.GetReviewFrequency @Id, @CompanyId;
END
GO

CREATE OR ALTER PROCEDURE dbo.DeleteReviewFrequency
  @Id UNIQUEIDENTIFIER,
  @CompanyId UNIQUEIDENTIFIER
AS
BEGIN
  SET NOCOUNT ON;
  DELETE FROM dbo.review_frequencies WHERE id = @Id AND company_id = @CompanyId;
END
GO

-- ========================================
-- FREQUENCY CALENDARS - Updated to use CompanyId
-- ========================================

CREATE OR ALTER PROCEDURE dbo.GetFrequencyCalendars
  @CompanyId UNIQUEIDENTIFIER
AS
BEGIN
  SET NOCOUNT ON;
  SELECT 
    fc.id AS Id, fc.code AS Code, fc.description AS Description,
    fc.review_frequency_id AS ReviewFrequencyId,
    fc.status AS Status, fc.created_at AS CreatedAt, fc.updated_at AS UpdatedAt,
    fc.created_by_id AS CreatedById, fc.company_id AS CompanyId,
    rf.code AS ReviewFrequencyCode, rf.description AS ReviewFrequencyDescription
  FROM dbo.frequency_calendars fc
  LEFT JOIN dbo.review_frequencies rf ON fc.review_frequency_id = rf.id
  WHERE fc.company_id = @CompanyId AND fc.status = 'active'
  ORDER BY fc.code;
END
GO

CREATE OR ALTER PROCEDURE dbo.GetFrequencyCalendar
  @Id UNIQUEIDENTIFIER,
  @CompanyId UNIQUEIDENTIFIER
AS
BEGIN
  SET NOCOUNT ON;
  SELECT 
    fc.id AS Id, fc.code AS Code, fc.description AS Description,
    fc.review_frequency_id AS ReviewFrequencyId,
    fc.status AS Status, fc.created_at AS CreatedAt, fc.updated_at AS UpdatedAt,
    fc.created_by_id AS CreatedById, fc.company_id AS CompanyId,
    rf.code AS ReviewFrequencyCode, rf.description AS ReviewFrequencyDescription
  FROM dbo.frequency_calendars fc
  LEFT JOIN dbo.review_frequencies rf ON fc.review_frequency_id = rf.id
  WHERE fc.id = @Id AND fc.company_id = @CompanyId;
END
GO

CREATE OR ALTER PROCEDURE dbo.CreateFrequencyCalendar
  @Code NVARCHAR(100),
  @Description NVARCHAR(MAX),
  @ReviewFrequencyId UNIQUEIDENTIFIER,
  @CompanyId UNIQUEIDENTIFIER,
  @CreatedById UNIQUEIDENTIFIER,
  @Status NVARCHAR(20) = 'active'
AS
BEGIN
  SET NOCOUNT ON;
  DECLARE @Id UNIQUEIDENTIFIER = NEWID();
  
  INSERT INTO dbo.frequency_calendars (id, code, description, review_frequency_id, status, company_id, created_by_id, created_at, updated_at)
  VALUES (@Id, @Code, @Description, @ReviewFrequencyId, @Status, @CompanyId, @CreatedById, SYSDATETIME(), SYSDATETIME());
  
  EXEC dbo.GetFrequencyCalendar @Id, @CompanyId;
END
GO

CREATE OR ALTER PROCEDURE dbo.UpdateFrequencyCalendar
  @Id UNIQUEIDENTIFIER,
  @Code NVARCHAR(100) = NULL,
  @Description NVARCHAR(MAX) = NULL,
  @ReviewFrequencyId UNIQUEIDENTIFIER = NULL,
  @Status NVARCHAR(20) = NULL,
  @CompanyId UNIQUEIDENTIFIER
AS
BEGIN
  SET NOCOUNT ON;
  
  UPDATE dbo.frequency_calendars
  SET code = COALESCE(@Code, code),
      description = COALESCE(@Description, description),
      review_frequency_id = COALESCE(@ReviewFrequencyId, review_frequency_id),
      status = COALESCE(@Status, status),
      updated_at = SYSDATETIME()
  WHERE id = @Id AND company_id = @CompanyId;
  
  EXEC dbo.GetFrequencyCalendar @Id, @CompanyId;
END
GO

CREATE OR ALTER PROCEDURE dbo.DeleteFrequencyCalendar
  @Id UNIQUEIDENTIFIER,
  @CompanyId UNIQUEIDENTIFIER
AS
BEGIN
  SET NOCOUNT ON;
  -- First delete related calendar details
  DELETE FROM dbo.frequency_calendar_details WHERE frequency_calendar_id = @Id;
  -- Then delete the calendar
  DELETE FROM dbo.frequency_calendars WHERE id = @Id AND company_id = @CompanyId;
END
GO

-- ========================================
-- FREQUENCY CALENDAR DETAILS - Updated to use CompanyId
-- ========================================

CREATE OR ALTER PROCEDURE dbo.GetFrequencyCalendarDetails
  @CompanyId UNIQUEIDENTIFIER
AS
BEGIN
  SET NOCOUNT ON;
  SELECT 
    fcd.id AS Id, fcd.frequency_calendar_id AS FrequencyCalendarId,
    fcd.period_name AS PeriodName, fcd.start_date AS StartDate, fcd.end_date AS EndDate,
    fcd.status AS Status, fcd.created_at AS CreatedAt, fcd.updated_at AS UpdatedAt,
    fcd.created_by_id AS CreatedById, fcd.company_id AS CompanyId,
    fc.code AS FrequencyCalendarCode
  FROM dbo.frequency_calendar_details fcd
  LEFT JOIN dbo.frequency_calendars fc ON fcd.frequency_calendar_id = fc.id
  WHERE fcd.company_id = @CompanyId AND fcd.status = 'active'
  ORDER BY fcd.start_date;
END
GO

CREATE OR ALTER PROCEDURE dbo.GetFrequencyCalendarDetail
  @Id UNIQUEIDENTIFIER,
  @CompanyId UNIQUEIDENTIFIER
AS
BEGIN
  SET NOCOUNT ON;
  SELECT 
    fcd.id AS Id, fcd.frequency_calendar_id AS FrequencyCalendarId,
    fcd.period_name AS PeriodName, fcd.start_date AS StartDate, fcd.end_date AS EndDate,
    fcd.status AS Status, fcd.created_at AS CreatedAt, fcd.updated_at AS UpdatedAt,
    fcd.created_by_id AS CreatedById, fcd.company_id AS CompanyId,
    fc.code AS FrequencyCalendarCode
  FROM dbo.frequency_calendar_details fcd
  LEFT JOIN dbo.frequency_calendars fc ON fcd.frequency_calendar_id = fc.id
  WHERE fcd.id = @Id AND fcd.company_id = @CompanyId;
END
GO

CREATE OR ALTER PROCEDURE dbo.CreateFrequencyCalendarDetails
  @FrequencyCalendarId UNIQUEIDENTIFIER,
  @PeriodName NVARCHAR(255),
  @StartDate DATE,
  @EndDate DATE,
  @CompanyId UNIQUEIDENTIFIER,
  @CreatedById UNIQUEIDENTIFIER,
  @Status NVARCHAR(20) = 'active'
AS
BEGIN
  SET NOCOUNT ON;
  DECLARE @Id UNIQUEIDENTIFIER = NEWID();
  
  INSERT INTO dbo.frequency_calendar_details (id, frequency_calendar_id, period_name, start_date, end_date, status, company_id, created_by_id, created_at, updated_at)
  VALUES (@Id, @FrequencyCalendarId, @PeriodName, @StartDate, @EndDate, @Status, @CompanyId, @CreatedById, SYSDATETIME(), SYSDATETIME());
  
  EXEC dbo.GetFrequencyCalendarDetail @Id, @CompanyId;
END
GO

CREATE OR ALTER PROCEDURE dbo.UpdateFrequencyCalendarDetails
  @Id UNIQUEIDENTIFIER,
  @FrequencyCalendarId UNIQUEIDENTIFIER = NULL,
  @PeriodName NVARCHAR(255) = NULL,
  @StartDate DATE = NULL,
  @EndDate DATE = NULL,
  @Status NVARCHAR(20) = NULL
AS
BEGIN
  SET NOCOUNT ON;
  
  DECLARE @CompanyId UNIQUEIDENTIFIER;
  SELECT @CompanyId = company_id FROM dbo.frequency_calendar_details WHERE id = @Id;
  
  UPDATE dbo.frequency_calendar_details
  SET frequency_calendar_id = COALESCE(@FrequencyCalendarId, frequency_calendar_id),
      period_name = COALESCE(@PeriodName, period_name),
      start_date = COALESCE(@StartDate, start_date),
      end_date = COALESCE(@EndDate, end_date),
      status = COALESCE(@Status, status),
      updated_at = SYSDATETIME()
  WHERE id = @Id;
  
  EXEC dbo.GetFrequencyCalendarDetail @Id, @CompanyId;
END
GO

CREATE OR ALTER PROCEDURE dbo.DeleteFrequencyCalendarDetails
  @Id UNIQUEIDENTIFIER
AS
BEGIN
  SET NOCOUNT ON;
  DELETE FROM dbo.frequency_calendar_details WHERE id = @Id;
END
GO

-- ========================================
-- QUESTIONNAIRE TEMPLATES - Updated to use CompanyId
-- ========================================

CREATE OR ALTER PROCEDURE dbo.GetQuestionnaireTemplates
  @CompanyId UNIQUEIDENTIFIER = NULL
AS
BEGIN
  SET NOCOUNT ON;
  SELECT 
    id AS Id, name AS Name, description AS Description,
    year AS Year, type AS Type, sections AS Sections,
    status AS Status, created_at AS CreatedAt, updated_at AS UpdatedAt,
    created_by_id AS CreatedById, company_id AS CompanyId
  FROM dbo.questionnaire_templates
  WHERE (@CompanyId IS NULL OR company_id = @CompanyId) AND status = 'active'
  ORDER BY year DESC, name;
END
GO

CREATE OR ALTER PROCEDURE dbo.GetQuestionnaireTemplate
  @Id UNIQUEIDENTIFIER,
  @CompanyId UNIQUEIDENTIFIER = NULL
AS
BEGIN
  SET NOCOUNT ON;
  SELECT 
    id AS Id, name AS Name, description AS Description,
    year AS Year, type AS Type, sections AS Sections,
    status AS Status, created_at AS CreatedAt, updated_at AS UpdatedAt,
    created_by_id AS CreatedById, company_id AS CompanyId
  FROM dbo.questionnaire_templates
  WHERE id = @Id AND (@CompanyId IS NULL OR company_id = @CompanyId);
END
GO

CREATE OR ALTER PROCEDURE dbo.CreateQuestionnaireTemplate
  @Name NVARCHAR(255),
  @Description NVARCHAR(MAX) = NULL,
  @Year INT,
  @Type NVARCHAR(50),
  @Sections NVARCHAR(MAX) = NULL,
  @CompanyId UNIQUEIDENTIFIER = NULL,
  @CreatedById UNIQUEIDENTIFIER,
  @Status NVARCHAR(20) = 'active'
AS
BEGIN
  SET NOCOUNT ON;
  DECLARE @Id UNIQUEIDENTIFIER = NEWID();
  
  INSERT INTO dbo.questionnaire_templates (id, name, description, year, type, sections, status, company_id, created_by_id, created_at, updated_at)
  VALUES (@Id, @Name, @Description, @Year, @Type, @Sections, @Status, @CompanyId, @CreatedById, SYSDATETIME(), SYSDATETIME());
  
  EXEC dbo.GetQuestionnaireTemplate @Id, @CompanyId;
END
GO

CREATE OR ALTER PROCEDURE dbo.UpdateQuestionnaireTemplate
  @Id UNIQUEIDENTIFIER,
  @Name NVARCHAR(255) = NULL,
  @Description NVARCHAR(MAX) = NULL,
  @Year INT = NULL,
  @Type NVARCHAR(50) = NULL,
  @Sections NVARCHAR(MAX) = NULL,
  @Status NVARCHAR(20) = NULL,
  @CompanyId UNIQUEIDENTIFIER = NULL
AS
BEGIN
  SET NOCOUNT ON;
  
  UPDATE dbo.questionnaire_templates
  SET name = COALESCE(@Name, name),
      description = COALESCE(@Description, description),
      year = COALESCE(@Year, year),
      type = COALESCE(@Type, type),
      sections = COALESCE(@Sections, sections),
      status = COALESCE(@Status, status),
      updated_at = SYSDATETIME()
  WHERE id = @Id AND (@CompanyId IS NULL OR company_id = @CompanyId);
  
  EXEC dbo.GetQuestionnaireTemplate @Id, @CompanyId;
END
GO

CREATE OR ALTER PROCEDURE dbo.DeleteQuestionnaireTemplate
  @Id UNIQUEIDENTIFIER,
  @CompanyId UNIQUEIDENTIFIER = NULL
AS
BEGIN
  SET NOCOUNT ON;
  DELETE FROM dbo.questionnaire_templates WHERE id = @Id AND (@CompanyId IS NULL OR company_id = @CompanyId);
END
GO

-- ========================================
-- LOCATIONS - Updated to use CompanyId
-- ========================================

CREATE OR ALTER PROCEDURE dbo.GetLocations
  @CompanyId UNIQUEIDENTIFIER = NULL
AS
BEGIN
  SET NOCOUNT ON;
  SELECT 
    id AS Id, name AS Name, code AS Code,
    address AS Address, city AS City, state AS State,
    country AS Country, pincode AS Pincode,
    status AS Status, created_at AS CreatedAt, updated_at AS UpdatedAt,
    created_by_id AS CreatedById, company_id AS CompanyId
  FROM dbo.locations
  WHERE (@CompanyId IS NULL OR company_id = @CompanyId) AND status = 'active'
  ORDER BY name;
END
GO

-- ========================================
-- PUBLISH QUESTIONNAIRES - Updated to use CompanyId
-- ========================================

CREATE OR ALTER PROCEDURE dbo.GetPublishQuestionnaires
  @CompanyId UNIQUEIDENTIFIER
AS
BEGIN
  SET NOCOUNT ON;
  SELECT 
    id AS Id, template_id AS TemplateId, appraisal_cycle_id AS AppraisalCycleId,
    target_roles AS TargetRoles, published_at AS PublishedAt,
    status AS Status, created_at AS CreatedAt, updated_at AS UpdatedAt,
    created_by_id AS CreatedById, company_id AS CompanyId
  FROM dbo.publish_questionnaires
  WHERE company_id = @CompanyId AND status = 'active'
  ORDER BY published_at DESC;
END
GO

PRINT '========================================';
PRINT 'Company-based data isolation migration completed!';
PRINT '========================================';
GO
