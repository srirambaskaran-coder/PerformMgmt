-- ========================================
-- COMPANY-BASED DATA ISOLATION FIX
-- Performance Management System - MSSQL
-- ========================================
-- This script fixes the stored procedures that failed
-- due to incorrect column names
-- ========================================

USE [YourDatabaseName];
GO
SET XACT_ABORT ON;
GO

-- ========================================
-- FIX: Update locations table - add created_by_id if missing
-- ========================================

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.locations') AND name = 'created_by_id')
BEGIN
  ALTER TABLE dbo.locations ADD created_by_id UNIQUEIDENTIFIER NULL;
  PRINT 'Added created_by_id column to locations table';
END
GO

-- Now populate company_id for locations (retry)
UPDATE loc
SET loc.company_id = u.company_id
FROM dbo.locations loc
INNER JOIN dbo.users u ON loc.created_by_id = u.id
WHERE loc.company_id IS NULL AND u.company_id IS NOT NULL;
PRINT 'Populated company_id for locations';
GO

-- ========================================
-- FREQUENCY CALENDARS - Fixed with correct columns
-- Uses: code, description, appraisal_cycle_id, review_frequency_id
-- ========================================

CREATE OR ALTER PROCEDURE dbo.GetFrequencyCalendars
  @CompanyId UNIQUEIDENTIFIER
AS
BEGIN
  SET NOCOUNT ON;
  SELECT 
    fc.id AS Id, fc.code AS Code, fc.description AS Description,
    fc.appraisal_cycle_id AS AppraisalCycleId,
    fc.review_frequency_id AS ReviewFrequencyId,
    fc.status AS Status, fc.created_at AS CreatedAt, fc.updated_at AS UpdatedAt,
    fc.created_by_id AS CreatedById, fc.company_id AS CompanyId,
    ac.code AS AppraisalCycleCode,
    rf.code AS ReviewFrequencyCode
  FROM dbo.frequency_calendars fc
  LEFT JOIN dbo.appraisal_cycles ac ON fc.appraisal_cycle_id = ac.id
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
    fc.appraisal_cycle_id AS AppraisalCycleId,
    fc.review_frequency_id AS ReviewFrequencyId,
    fc.status AS Status, fc.created_at AS CreatedAt, fc.updated_at AS UpdatedAt,
    fc.created_by_id AS CreatedById, fc.company_id AS CompanyId,
    ac.code AS AppraisalCycleCode,
    rf.code AS ReviewFrequencyCode
  FROM dbo.frequency_calendars fc
  LEFT JOIN dbo.appraisal_cycles ac ON fc.appraisal_cycle_id = ac.id
  LEFT JOIN dbo.review_frequencies rf ON fc.review_frequency_id = rf.id
  WHERE fc.id = @Id AND fc.company_id = @CompanyId;
END
GO

CREATE OR ALTER PROCEDURE dbo.CreateFrequencyCalendar
  @Code NVARCHAR(100),
  @Description NVARCHAR(MAX),
  @AppraisalCycleId UNIQUEIDENTIFIER,
  @ReviewFrequencyId UNIQUEIDENTIFIER,
  @CompanyId UNIQUEIDENTIFIER,
  @CreatedById UNIQUEIDENTIFIER,
  @Status NVARCHAR(20) = 'active'
AS
BEGIN
  SET NOCOUNT ON;
  DECLARE @Id UNIQUEIDENTIFIER = NEWID();
  
  INSERT INTO dbo.frequency_calendars (id, code, description, appraisal_cycle_id, review_frequency_id, status, company_id, created_by_id, created_at, updated_at)
  VALUES (@Id, @Code, @Description, @AppraisalCycleId, @ReviewFrequencyId, @Status, @CompanyId, @CreatedById, SYSDATETIME(), SYSDATETIME());
  
  EXEC dbo.GetFrequencyCalendar @Id, @CompanyId;
END
GO

CREATE OR ALTER PROCEDURE dbo.UpdateFrequencyCalendar
  @Id UNIQUEIDENTIFIER,
  @Code NVARCHAR(100) = NULL,
  @Description NVARCHAR(MAX) = NULL,
  @AppraisalCycleId UNIQUEIDENTIFIER = NULL,
  @ReviewFrequencyId UNIQUEIDENTIFIER = NULL,
  @Status NVARCHAR(20) = NULL,
  @CompanyId UNIQUEIDENTIFIER
AS
BEGIN
  SET NOCOUNT ON;
  
  UPDATE dbo.frequency_calendars
  SET code = COALESCE(@Code, code),
      description = COALESCE(@Description, description),
      appraisal_cycle_id = COALESCE(@AppraisalCycleId, appraisal_cycle_id),
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
  DELETE FROM dbo.frequency_calendar_details WHERE frequency_calendar_id = @Id;
  DELETE FROM dbo.frequency_calendars WHERE id = @Id AND company_id = @CompanyId;
END
GO

-- ========================================
-- APPRAISAL CYCLES - Fixed with correct columns
-- Uses: code, description, from_date, to_date
-- ========================================

CREATE OR ALTER PROCEDURE dbo.GetAppraisalCycles
  @CompanyId UNIQUEIDENTIFIER
AS
BEGIN
  SET NOCOUNT ON;
  SELECT 
    id AS Id, code AS Code, description AS Description,
    from_date AS FromDate, to_date AS ToDate,
    status AS Status, created_at AS CreatedAt, updated_at AS UpdatedAt,
    created_by_id AS CreatedById, company_id AS CompanyId
  FROM dbo.appraisal_cycles
  WHERE company_id = @CompanyId AND status = 'active'
  ORDER BY from_date DESC;
END
GO

CREATE OR ALTER PROCEDURE dbo.GetAppraisalCycle
  @Id UNIQUEIDENTIFIER,
  @CompanyId UNIQUEIDENTIFIER
AS
BEGIN
  SET NOCOUNT ON;
  SELECT 
    id AS Id, code AS Code, description AS Description,
    from_date AS FromDate, to_date AS ToDate,
    status AS Status, created_at AS CreatedAt, updated_at AS UpdatedAt,
    created_by_id AS CreatedById, company_id AS CompanyId
  FROM dbo.appraisal_cycles
  WHERE id = @Id AND company_id = @CompanyId;
END
GO

CREATE OR ALTER PROCEDURE dbo.CreateAppraisalCycle
  @Code NVARCHAR(100),
  @Description NVARCHAR(MAX),
  @FromDate DATETIME2,
  @ToDate DATETIME2,
  @CompanyId UNIQUEIDENTIFIER,
  @CreatedById UNIQUEIDENTIFIER,
  @Status NVARCHAR(20) = 'active'
AS
BEGIN
  SET NOCOUNT ON;
  DECLARE @Id UNIQUEIDENTIFIER = NEWID();
  
  INSERT INTO dbo.appraisal_cycles (id, code, description, from_date, to_date, status, company_id, created_by_id, created_at, updated_at)
  VALUES (@Id, @Code, @Description, @FromDate, @ToDate, @Status, @CompanyId, @CreatedById, SYSDATETIME(), SYSDATETIME());
  
  EXEC dbo.GetAppraisalCycle @Id, @CompanyId;
END
GO

CREATE OR ALTER PROCEDURE dbo.UpdateAppraisalCycle
  @Id UNIQUEIDENTIFIER,
  @Code NVARCHAR(100) = NULL,
  @Description NVARCHAR(MAX) = NULL,
  @FromDate DATETIME2 = NULL,
  @ToDate DATETIME2 = NULL,
  @Status NVARCHAR(20) = NULL,
  @CompanyId UNIQUEIDENTIFIER
AS
BEGIN
  SET NOCOUNT ON;
  
  UPDATE dbo.appraisal_cycles
  SET code = COALESCE(@Code, code),
      description = COALESCE(@Description, description),
      from_date = COALESCE(@FromDate, from_date),
      to_date = COALESCE(@ToDate, to_date),
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
-- FREQUENCY CALENDAR DETAILS - Fixed with correct columns
-- Uses: display_name (not period_name)
-- ========================================

CREATE OR ALTER PROCEDURE dbo.GetFrequencyCalendarDetails
  @CompanyId UNIQUEIDENTIFIER
AS
BEGIN
  SET NOCOUNT ON;
  SELECT 
    fcd.id AS Id, fcd.frequency_calendar_id AS FrequencyCalendarId,
    fcd.display_name AS DisplayName, fcd.start_date AS StartDate, fcd.end_date AS EndDate,
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
    fcd.display_name AS DisplayName, fcd.start_date AS StartDate, fcd.end_date AS EndDate,
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
  @DisplayName NVARCHAR(255),
  @StartDate DATETIME2,
  @EndDate DATETIME2,
  @CompanyId UNIQUEIDENTIFIER,
  @CreatedById UNIQUEIDENTIFIER,
  @Status NVARCHAR(20) = 'active'
AS
BEGIN
  SET NOCOUNT ON;
  DECLARE @Id UNIQUEIDENTIFIER = NEWID();
  
  INSERT INTO dbo.frequency_calendar_details (id, frequency_calendar_id, display_name, start_date, end_date, status, company_id, created_by_id, created_at, updated_at)
  VALUES (@Id, @FrequencyCalendarId, @DisplayName, @StartDate, @EndDate, @Status, @CompanyId, @CreatedById, SYSDATETIME(), SYSDATETIME());
  
  EXEC dbo.GetFrequencyCalendarDetail @Id, @CompanyId;
END
GO

CREATE OR ALTER PROCEDURE dbo.UpdateFrequencyCalendarDetails
  @Id UNIQUEIDENTIFIER,
  @FrequencyCalendarId UNIQUEIDENTIFIER = NULL,
  @DisplayName NVARCHAR(255) = NULL,
  @StartDate DATETIME2 = NULL,
  @EndDate DATETIME2 = NULL,
  @Status NVARCHAR(20) = NULL
AS
BEGIN
  SET NOCOUNT ON;
  
  DECLARE @CompanyId UNIQUEIDENTIFIER;
  SELECT @CompanyId = company_id FROM dbo.frequency_calendar_details WHERE id = @Id;
  
  UPDATE dbo.frequency_calendar_details
  SET frequency_calendar_id = COALESCE(@FrequencyCalendarId, frequency_calendar_id),
      display_name = COALESCE(@DisplayName, display_name),
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
-- QUESTIONNAIRE TEMPLATES - Fixed with correct columns
-- Uses: name, description, target_role, questions, year
-- ========================================

CREATE OR ALTER PROCEDURE dbo.GetQuestionnaireTemplates
  @CompanyId UNIQUEIDENTIFIER = NULL
AS
BEGIN
  SET NOCOUNT ON;
  SELECT 
    id AS Id, name AS Name, description AS Description,
    target_role AS TargetRole, questions AS Questions, year AS Year,
    status AS Status, created_at AS CreatedAt, updated_at AS UpdatedAt,
    created_by_id AS CreatedById, company_id AS CompanyId,
    applicable_category AS ApplicableCategory,
    applicable_level_id AS ApplicableLevelId,
    applicable_grade_id AS ApplicableGradeId,
    applicable_location_id AS ApplicableLocationId,
    send_on_mail AS SendOnMail
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
    target_role AS TargetRole, questions AS Questions, year AS Year,
    status AS Status, created_at AS CreatedAt, updated_at AS UpdatedAt,
    created_by_id AS CreatedById, company_id AS CompanyId,
    applicable_category AS ApplicableCategory,
    applicable_level_id AS ApplicableLevelId,
    applicable_grade_id AS ApplicableGradeId,
    applicable_location_id AS ApplicableLocationId,
    send_on_mail AS SendOnMail
  FROM dbo.questionnaire_templates
  WHERE id = @Id AND (@CompanyId IS NULL OR company_id = @CompanyId);
END
GO

CREATE OR ALTER PROCEDURE dbo.CreateQuestionnaireTemplate
  @Name NVARCHAR(255),
  @Description NVARCHAR(MAX) = NULL,
  @TargetRole NVARCHAR(50),
  @Questions NVARCHAR(MAX),
  @Year INT = NULL,
  @CompanyId UNIQUEIDENTIFIER = NULL,
  @CreatedById UNIQUEIDENTIFIER,
  @Status NVARCHAR(20) = 'active',
  @ApplicableCategory NVARCHAR(20) = NULL,
  @ApplicableLevelId UNIQUEIDENTIFIER = NULL,
  @ApplicableGradeId UNIQUEIDENTIFIER = NULL,
  @ApplicableLocationId UNIQUEIDENTIFIER = NULL,
  @SendOnMail BIT = 0
AS
BEGIN
  SET NOCOUNT ON;
  DECLARE @Id UNIQUEIDENTIFIER = NEWID();
  
  INSERT INTO dbo.questionnaire_templates (id, name, description, target_role, questions, year, status, company_id, created_by_id, created_at, updated_at, applicable_category, applicable_level_id, applicable_grade_id, applicable_location_id, send_on_mail)
  VALUES (@Id, @Name, @Description, @TargetRole, @Questions, @Year, @Status, @CompanyId, @CreatedById, SYSDATETIME(), SYSDATETIME(), @ApplicableCategory, @ApplicableLevelId, @ApplicableGradeId, @ApplicableLocationId, @SendOnMail);
  
  EXEC dbo.GetQuestionnaireTemplate @Id, @CompanyId;
END
GO

CREATE OR ALTER PROCEDURE dbo.UpdateQuestionnaireTemplate
  @Id UNIQUEIDENTIFIER,
  @Name NVARCHAR(255) = NULL,
  @Description NVARCHAR(MAX) = NULL,
  @TargetRole NVARCHAR(50) = NULL,
  @Questions NVARCHAR(MAX) = NULL,
  @Year INT = NULL,
  @Status NVARCHAR(20) = NULL,
  @CompanyId UNIQUEIDENTIFIER = NULL,
  @ApplicableCategory NVARCHAR(20) = NULL,
  @ApplicableLevelId UNIQUEIDENTIFIER = NULL,
  @ApplicableGradeId UNIQUEIDENTIFIER = NULL,
  @ApplicableLocationId UNIQUEIDENTIFIER = NULL,
  @SendOnMail BIT = NULL
AS
BEGIN
  SET NOCOUNT ON;
  
  UPDATE dbo.questionnaire_templates
  SET name = COALESCE(@Name, name),
      description = COALESCE(@Description, description),
      target_role = COALESCE(@TargetRole, target_role),
      questions = COALESCE(@Questions, questions),
      year = COALESCE(@Year, year),
      status = COALESCE(@Status, status),
      applicable_category = COALESCE(@ApplicableCategory, applicable_category),
      applicable_level_id = COALESCE(@ApplicableLevelId, applicable_level_id),
      applicable_grade_id = COALESCE(@ApplicableGradeId, applicable_grade_id),
      applicable_location_id = COALESCE(@ApplicableLocationId, applicable_location_id),
      send_on_mail = COALESCE(@SendOnMail, send_on_mail),
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
-- LOCATIONS - Fixed with correct columns
-- Uses: code, name, state, country (no address, city, pincode)
-- ========================================

CREATE OR ALTER PROCEDURE dbo.GetLocations
  @CompanyId UNIQUEIDENTIFIER = NULL
AS
BEGIN
  SET NOCOUNT ON;
  SELECT 
    id AS Id, code AS Code, name AS Name,
    state AS State, country AS Country,
    status AS Status, created_at AS CreatedAt, updated_at AS UpdatedAt,
    company_id AS CompanyId
  FROM dbo.locations
  WHERE (@CompanyId IS NULL OR company_id = @CompanyId) AND status = 'active'
  ORDER BY name;
END
GO

CREATE OR ALTER PROCEDURE dbo.GetLocation
  @Id UNIQUEIDENTIFIER,
  @CompanyId UNIQUEIDENTIFIER = NULL
AS
BEGIN
  SET NOCOUNT ON;
  SELECT 
    id AS Id, code AS Code, name AS Name,
    state AS State, country AS Country,
    status AS Status, created_at AS CreatedAt, updated_at AS UpdatedAt,
    company_id AS CompanyId
  FROM dbo.locations
  WHERE id = @Id AND (@CompanyId IS NULL OR company_id = @CompanyId);
END
GO

CREATE OR ALTER PROCEDURE dbo.CreateLocation
  @Code NVARCHAR(100),
  @Name NVARCHAR(255),
  @State NVARCHAR(100) = NULL,
  @Country NVARCHAR(100) = NULL,
  @CompanyId UNIQUEIDENTIFIER = NULL,
  @Status NVARCHAR(20) = 'active'
AS
BEGIN
  SET NOCOUNT ON;
  DECLARE @Id UNIQUEIDENTIFIER = NEWID();
  
  INSERT INTO dbo.locations (id, code, name, state, country, status, company_id, created_at, updated_at)
  VALUES (@Id, @Code, @Name, @State, @Country, @Status, @CompanyId, SYSDATETIME(), SYSDATETIME());
  
  EXEC dbo.GetLocation @Id, @CompanyId;
END
GO

CREATE OR ALTER PROCEDURE dbo.UpdateLocation
  @Id UNIQUEIDENTIFIER,
  @Code NVARCHAR(100) = NULL,
  @Name NVARCHAR(255) = NULL,
  @State NVARCHAR(100) = NULL,
  @Country NVARCHAR(100) = NULL,
  @Status NVARCHAR(20) = NULL,
  @CompanyId UNIQUEIDENTIFIER = NULL
AS
BEGIN
  SET NOCOUNT ON;
  
  UPDATE dbo.locations
  SET code = COALESCE(@Code, code),
      name = COALESCE(@Name, name),
      state = COALESCE(@State, state),
      country = COALESCE(@Country, country),
      status = COALESCE(@Status, status),
      updated_at = SYSDATETIME()
  WHERE id = @Id AND (@CompanyId IS NULL OR company_id = @CompanyId);
  
  EXEC dbo.GetLocation @Id, @CompanyId;
END
GO

CREATE OR ALTER PROCEDURE dbo.DeleteLocation
  @Id UNIQUEIDENTIFIER,
  @CompanyId UNIQUEIDENTIFIER = NULL
AS
BEGIN
  SET NOCOUNT ON;
  DELETE FROM dbo.locations WHERE id = @Id AND (@CompanyId IS NULL OR company_id = @CompanyId);
END
GO

-- ========================================
-- PUBLISH QUESTIONNAIRES - Fixed with correct columns
-- Uses: code, display_name, template_id, frequency_calendar_id
-- ========================================

CREATE OR ALTER PROCEDURE dbo.GetPublishQuestionnaires
  @CompanyId UNIQUEIDENTIFIER
AS
BEGIN
  SET NOCOUNT ON;
  SELECT 
    id AS Id, code AS Code, display_name AS DisplayName,
    template_id AS TemplateId, frequency_calendar_id AS FrequencyCalendarId,
    status AS Status, publish_type AS PublishType,
    created_at AS CreatedAt, updated_at AS UpdatedAt,
    created_by_id AS CreatedById, company_id AS CompanyId
  FROM dbo.publish_questionnaires
  WHERE company_id = @CompanyId AND status = 'active'
  ORDER BY created_at DESC;
END
GO

CREATE OR ALTER PROCEDURE dbo.GetPublishQuestionnaire
  @Id UNIQUEIDENTIFIER,
  @CompanyId UNIQUEIDENTIFIER
AS
BEGIN
  SET NOCOUNT ON;
  SELECT 
    id AS Id, code AS Code, display_name AS DisplayName,
    template_id AS TemplateId, frequency_calendar_id AS FrequencyCalendarId,
    status AS Status, publish_type AS PublishType,
    created_at AS CreatedAt, updated_at AS UpdatedAt,
    created_by_id AS CreatedById, company_id AS CompanyId
  FROM dbo.publish_questionnaires
  WHERE id = @Id AND company_id = @CompanyId;
END
GO

CREATE OR ALTER PROCEDURE dbo.CreatePublishQuestionnaire
  @Code NVARCHAR(100),
  @DisplayName NVARCHAR(255),
  @TemplateId UNIQUEIDENTIFIER,
  @FrequencyCalendarId UNIQUEIDENTIFIER = NULL,
  @PublishType NVARCHAR(20) = 'now',
  @CompanyId UNIQUEIDENTIFIER,
  @CreatedById UNIQUEIDENTIFIER,
  @Status NVARCHAR(20) = 'active'
AS
BEGIN
  SET NOCOUNT ON;
  DECLARE @Id UNIQUEIDENTIFIER = NEWID();
  
  INSERT INTO dbo.publish_questionnaires (id, code, display_name, template_id, frequency_calendar_id, publish_type, status, company_id, created_by_id, created_at, updated_at)
  VALUES (@Id, @Code, @DisplayName, @TemplateId, @FrequencyCalendarId, @PublishType, @Status, @CompanyId, @CreatedById, SYSDATETIME(), SYSDATETIME());
  
  EXEC dbo.GetPublishQuestionnaire @Id, @CompanyId;
END
GO

CREATE OR ALTER PROCEDURE dbo.UpdatePublishQuestionnaire
  @Id UNIQUEIDENTIFIER,
  @Code NVARCHAR(100) = NULL,
  @DisplayName NVARCHAR(255) = NULL,
  @TemplateId UNIQUEIDENTIFIER = NULL,
  @FrequencyCalendarId UNIQUEIDENTIFIER = NULL,
  @PublishType NVARCHAR(20) = NULL,
  @Status NVARCHAR(20) = NULL,
  @CompanyId UNIQUEIDENTIFIER
AS
BEGIN
  SET NOCOUNT ON;
  
  UPDATE dbo.publish_questionnaires
  SET code = COALESCE(@Code, code),
      display_name = COALESCE(@DisplayName, display_name),
      template_id = COALESCE(@TemplateId, template_id),
      frequency_calendar_id = COALESCE(@FrequencyCalendarId, frequency_calendar_id),
      publish_type = COALESCE(@PublishType, publish_type),
      status = COALESCE(@Status, status),
      updated_at = SYSDATETIME()
  WHERE id = @Id AND company_id = @CompanyId;
  
  EXEC dbo.GetPublishQuestionnaire @Id, @CompanyId;
END
GO

CREATE OR ALTER PROCEDURE dbo.DeletePublishQuestionnaire
  @Id UNIQUEIDENTIFIER,
  @CompanyId UNIQUEIDENTIFIER
AS
BEGIN
  SET NOCOUNT ON;
  DELETE FROM dbo.publish_questionnaires WHERE id = @Id AND company_id = @CompanyId;
END
GO

PRINT '========================================';
PRINT 'Company-based data isolation FIX completed!';
PRINT '========================================';
GO

-- ========================================
-- APPRAISAL GROUPS - Fixed to use company_id
-- Uses: name, description (not group_name)
-- ========================================

CREATE OR ALTER PROCEDURE dbo.GetAppraisalGroups
  @CompanyId UNIQUEIDENTIFIER
AS
BEGIN
  SET NOCOUNT ON;
  SELECT 
    id AS Id, name AS Name, description AS Description,
    created_by_id AS CreatedById, company_id AS CompanyId,
    status AS Status, created_at AS CreatedAt, updated_at AS UpdatedAt
  FROM dbo.appraisal_groups
  WHERE company_id = @CompanyId AND status = 'active'
  ORDER BY created_at DESC;
END
GO

CREATE OR ALTER PROCEDURE dbo.GetAppraisalGroup
  @Id UNIQUEIDENTIFIER,
  @CompanyId UNIQUEIDENTIFIER
AS
BEGIN
  SET NOCOUNT ON;
  SELECT 
    id AS Id, name AS Name, description AS Description,
    created_by_id AS CreatedById, company_id AS CompanyId,
    status AS Status, created_at AS CreatedAt, updated_at AS UpdatedAt
  FROM dbo.appraisal_groups
  WHERE id = @Id AND company_id = @CompanyId;
END
GO

CREATE OR ALTER PROCEDURE dbo.CreateAppraisalGroup
  @Name NVARCHAR(255),
  @Description NVARCHAR(MAX) = NULL,
  @CompanyId UNIQUEIDENTIFIER,
  @CreatedById UNIQUEIDENTIFIER,
  @Status NVARCHAR(20) = 'active'
AS
BEGIN
  SET NOCOUNT ON;
  DECLARE @Id UNIQUEIDENTIFIER = NEWID();
  
  INSERT INTO dbo.appraisal_groups (id, name, description, company_id, created_by_id, status, created_at, updated_at)
  VALUES (@Id, @Name, @Description, @CompanyId, @CreatedById, @Status, SYSDATETIME(), SYSDATETIME());
  
  EXEC dbo.GetAppraisalGroup @Id, @CompanyId;
END
GO

CREATE OR ALTER PROCEDURE dbo.UpdateAppraisalGroup
  @Id UNIQUEIDENTIFIER,
  @Name NVARCHAR(255) = NULL,
  @Description NVARCHAR(MAX) = NULL,
  @Status NVARCHAR(20) = NULL,
  @CompanyId UNIQUEIDENTIFIER
AS
BEGIN
  SET NOCOUNT ON;
  
  UPDATE dbo.appraisal_groups
  SET name = COALESCE(@Name, name),
      description = COALESCE(@Description, description),
      status = COALESCE(@Status, status),
      updated_at = SYSDATETIME()
  WHERE id = @Id AND company_id = @CompanyId;
  
  EXEC dbo.GetAppraisalGroup @Id, @CompanyId;
END
GO

CREATE OR ALTER PROCEDURE dbo.DeleteAppraisalGroup
  @Id UNIQUEIDENTIFIER,
  @CompanyId UNIQUEIDENTIFIER
AS
BEGIN
  SET NOCOUNT ON;
  -- First delete group members
  DELETE FROM dbo.appraisal_group_members WHERE appraisal_group_id = @Id;
  DELETE FROM dbo.appraisal_groups WHERE id = @Id AND company_id = @CompanyId;
END
GO

PRINT 'Appraisal Groups stored procedures updated!';
GO

-- ========================================
-- LEVELS - Fixed to use company_id
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
  @CompanyId UNIQUEIDENTIFIER = NULL
AS
BEGIN
  SET NOCOUNT ON;
  SELECT 
    id AS Id, code AS Code, description AS Description,
    status AS Status, created_at AS CreatedAt, updated_at AS UpdatedAt,
    created_by_id AS CreatedById, company_id AS CompanyId
  FROM dbo.levels
  WHERE id = @Id AND (@CompanyId IS NULL OR company_id = @CompanyId);
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

PRINT 'Levels stored procedures updated!';
GO

-- ========================================
-- GRADES - Fixed to use company_id
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
  @CompanyId UNIQUEIDENTIFIER = NULL
AS
BEGIN
  SET NOCOUNT ON;
  SELECT 
    id AS Id, code AS Code, description AS Description,
    status AS Status, created_at AS CreatedAt, updated_at AS UpdatedAt,
    created_by_id AS CreatedById, company_id AS CompanyId
  FROM dbo.grades
  WHERE id = @Id AND (@CompanyId IS NULL OR company_id = @CompanyId);
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

PRINT 'Grades stored procedures updated!';
GO

-- ========================================
-- DEPARTMENTS - Fixed to use company_id
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
  @CompanyId UNIQUEIDENTIFIER = NULL
AS
BEGIN
  SET NOCOUNT ON;
  SELECT 
    id AS Id, code AS Code, description AS Description,
    status AS Status, created_at AS CreatedAt, updated_at AS UpdatedAt,
    created_by_id AS CreatedById, company_id AS CompanyId
  FROM dbo.departments
  WHERE id = @Id AND (@CompanyId IS NULL OR company_id = @CompanyId);
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

PRINT 'Departments stored procedures updated!';
GO

-- ========================================
-- REVIEW FREQUENCIES - Fixed to use company_id
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
  @CompanyId UNIQUEIDENTIFIER = NULL
AS
BEGIN
  SET NOCOUNT ON;
  SELECT 
    id AS Id, code AS Code, description AS Description,
    status AS Status, created_at AS CreatedAt, updated_at AS UpdatedAt,
    created_by_id AS CreatedById, company_id AS CompanyId
  FROM dbo.review_frequencies
  WHERE id = @Id AND (@CompanyId IS NULL OR company_id = @CompanyId);
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

PRINT 'Review Frequencies stored procedures updated!';
GO

-- ========================================
-- USERS - Fix company isolation for all non-super_admin roles
-- ========================================

CREATE OR ALTER PROCEDURE dbo.GetUsers
  @Role NVARCHAR(50) = NULL,
  @Department NVARCHAR(255) = NULL,
  @Status NVARCHAR(20) = NULL,
  @CompanyId UNIQUEIDENTIFIER = NULL,
  @RequestingUserId UNIQUEIDENTIFIER = NULL
AS
BEGIN
  SET NOCOUNT ON;
  
  -- Get requesting user for security checks
  DECLARE @RequestingRole NVARCHAR(50);
  DECLARE @RequestingCompanyId UNIQUEIDENTIFIER;
  
  IF @RequestingUserId IS NOT NULL
  BEGIN
    SELECT @RequestingRole = role, @RequestingCompanyId = company_id
    FROM dbo.users WHERE id = @RequestingUserId;
  END
  
  SELECT 
    id AS Id, email AS Email, first_name AS FirstName, last_name AS LastName,
    profile_image_url AS ProfileImageUrl, created_at AS CreatedAt, updated_at AS UpdatedAt,
    code AS Code, designation AS Designation, date_of_joining AS DateOfJoining,
    mobile_number AS MobileNumber, reporting_manager_id AS ReportingManagerId,
    location_id AS LocationId, company_id AS CompanyId, role AS Role,
    status AS Status, department AS Department, roles AS Roles,
    created_by_id AS CreatedById, level_id AS LevelId, grade_id AS GradeId
  FROM dbo.users
  WHERE 1=1
    -- Company isolation: everyone except super_admin sees only their company's users
    AND (
      @RequestingRole = 'super_admin'
      OR @RequestingRole IS NULL
      OR (@RequestingCompanyId IS NOT NULL AND company_id = @RequestingCompanyId)
    )
    -- HR Managers cannot see super_admin or admin roles
    AND (
      @RequestingRole IS NULL
      OR @RequestingRole NOT IN ('hr_manager', 'manager', 'employee')
      OR (role NOT IN ('super_admin', 'admin') AND (roles IS NULL OR roles NOT LIKE '%super_admin%' AND roles NOT LIKE '%admin%'))
    )
    -- Filter parameters
    AND (@Role IS NULL OR role = @Role OR roles LIKE '%' + @Role + '%')
    AND (@Department IS NULL OR department = @Department)
    AND (@Status IS NULL OR status = @Status)
    AND (@CompanyId IS NULL OR company_id = @CompanyId)
  ORDER BY first_name;
END
GO

PRINT 'GetUsers stored procedure updated with company isolation!';
GO

-- ========================================
-- APPRAISAL GROUP MEMBERS - Fixed to work without CreatedById filter
-- ========================================

CREATE OR ALTER PROCEDURE dbo.GetAppraisalGroupMembers
  @AppraisalGroupId UNIQUEIDENTIFIER
AS
BEGIN
  SET NOCOUNT ON;
  SELECT 
    agm.id AS Id,
    agm.appraisal_group_id AS AppraisalGroupId,
    agm.user_id AS UserId,
    agm.added_by_id AS AddedById,
    agm.added_at AS AddedAt,
    u.first_name AS FirstName,
    u.last_name AS LastName,
    u.email AS Email,
    u.code AS Code,
    u.designation AS Designation,
    u.department AS Department,
    u.status AS Status,
    u.reporting_manager_id AS ReportingManagerId
  FROM dbo.appraisal_group_members agm
  INNER JOIN dbo.users u ON agm.user_id = u.id
  WHERE agm.appraisal_group_id = @AppraisalGroupId
  ORDER BY u.first_name, u.last_name;
END
GO

CREATE OR ALTER PROCEDURE dbo.AddAppraisalGroupMember
  @AppraisalGroupId UNIQUEIDENTIFIER,
  @UserId UNIQUEIDENTIFIER,
  @AddedById UNIQUEIDENTIFIER
AS
BEGIN
  SET NOCOUNT ON;
  
  -- Check if member already exists
  IF EXISTS (SELECT 1 FROM dbo.appraisal_group_members 
             WHERE appraisal_group_id = @AppraisalGroupId AND user_id = @UserId)
  BEGIN
    RAISERROR('User is already a member of this appraisal group', 16, 1);
    RETURN;
  END
  
  -- Check if user exists
  IF NOT EXISTS (SELECT 1 FROM dbo.users WHERE id = @UserId)
  BEGIN
    RAISERROR('User not found', 16, 1);
    RETURN;
  END
  
  DECLARE @Id UNIQUEIDENTIFIER = NEWID();
  
  INSERT INTO dbo.appraisal_group_members
    (id, appraisal_group_id, user_id, added_by_id, added_at)
  VALUES 
    (@Id, @AppraisalGroupId, @UserId, @AddedById, SYSDATETIME());
    
  SELECT 
    id AS Id, appraisal_group_id AS AppraisalGroupId,
    user_id AS UserId, added_by_id AS AddedById, added_at AS AddedAt
  FROM dbo.appraisal_group_members WHERE id = @Id;
END
GO

CREATE OR ALTER PROCEDURE dbo.RemoveAppraisalGroupMember
  @AppraisalGroupId UNIQUEIDENTIFIER,
  @UserId UNIQUEIDENTIFIER
AS
BEGIN
  SET NOCOUNT ON;
  DELETE FROM dbo.appraisal_group_members 
  WHERE appraisal_group_id = @AppraisalGroupId AND user_id = @UserId;
END
GO

PRINT 'Appraisal Group Members stored procedures updated!';
GO

PRINT '========================================';
PRINT 'ALL Company-based data isolation COMPLETE!';
PRINT '========================================';
GO

-- ========================================
-- INITIATED APPRAISALS - Fixed to use company_id via appraisal_groups join
-- ========================================

CREATE OR ALTER PROCEDURE dbo.GetInitiatedAppraisals
  @CompanyId UNIQUEIDENTIFIER
AS
BEGIN
  SET NOCOUNT ON;
  SELECT 
    ia.id AS Id, 
    ia.appraisal_group_id AS AppraisalGroupId,
    ia.appraisal_type AS AppraisalType,
    ia.questionnaire_template_ids AS QuestionnaireTemplateIds,
    ia.document_url AS DocumentUrl,
    ia.frequency_calendar_id AS FrequencyCalendarId,
    ia.days_to_initiate AS DaysToInitiate,
    ia.days_to_close AS DaysToClose,
    ia.number_of_reminders AS NumberOfReminders,
    ia.exclude_tenure_less_than_year AS ExcludeTenureLessThanYear,
    ia.excluded_employee_ids AS ExcludedEmployeeIds,
    ia.status AS Status,
    ia.make_public AS MakePublic,
    ia.publish_type AS PublishType,
    ia.created_by_id AS CreatedById,
    ia.created_at AS CreatedAt, 
    ia.updated_at AS UpdatedAt,
    ag.name AS AppraisalGroupName
  FROM dbo.initiated_appraisals ia
  INNER JOIN dbo.appraisal_groups ag ON ia.appraisal_group_id = ag.id
  WHERE ag.company_id = @CompanyId
  ORDER BY ia.created_at DESC;
END
GO

PRINT 'GetInitiatedAppraisals stored procedure updated with company isolation!';
GO
