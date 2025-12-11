USE [PerformanceManagement];
GO
SET XACT_ABORT ON;
GO

PRINT 'Starting rollback of Complete_query.sql...';
GO

/**********************************************************
 * ROLLBACK SCRIPT - Drops all tables created by Complete_query.sql
 * Execute this to revert the database schema
 **********************************************************/

-- Drop foreign keys first
IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_calendar_credentials_company')
BEGIN
    ALTER TABLE dbo.calendar_credentials DROP CONSTRAINT FK_calendar_credentials_company;
    PRINT 'Dropped FK_calendar_credentials_company';
END
GO

-- Drop tables in reverse order of dependencies

-- 7. TOKENS & MISC
IF OBJECT_ID('dbo.access_tokens', 'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.access_tokens;
    PRINT 'Dropped access_tokens';
END
GO

-- 6. PUBLISHING & CALENDAR CREDS
IF OBJECT_ID('dbo.calendar_credentials', 'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.calendar_credentials;
    PRINT 'Dropped calendar_credentials';
END
GO

IF OBJECT_ID('dbo.publish_questionnaires', 'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.publish_questionnaires;
    PRINT 'Dropped publish_questionnaires';
END
GO

-- 5. EVALUATIONS & SCHEDULED TASKS
IF OBJECT_ID('dbo.scheduled_appraisal_tasks', 'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.scheduled_appraisal_tasks;
    PRINT 'Dropped scheduled_appraisal_tasks';
END
GO

IF OBJECT_ID('dbo.evaluations', 'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.evaluations;
    PRINT 'Dropped evaluations';
END
GO

-- 4. APPRAISAL GROUPS & INITIATED APPRAISALS
IF OBJECT_ID('dbo.initiated_appraisal_detail_timings', 'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.initiated_appraisal_detail_timings;
    PRINT 'Dropped initiated_appraisal_detail_timings';
END
GO

IF OBJECT_ID('dbo.initiated_appraisals', 'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.initiated_appraisals;
    PRINT 'Dropped initiated_appraisals';
END
GO

IF OBJECT_ID('dbo.appraisal_group_members', 'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.appraisal_group_members;
    PRINT 'Dropped appraisal_group_members';
END
GO

IF OBJECT_ID('dbo.appraisal_groups', 'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.appraisal_groups;
    PRINT 'Dropped appraisal_groups';
END
GO

-- 3. REVIEW / QUESTIONNAIRE STRUCTURE
IF OBJECT_ID('dbo.frequency_calendar_details', 'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.frequency_calendar_details;
    PRINT 'Dropped frequency_calendar_details';
END
GO

IF OBJECT_ID('dbo.frequency_calendars', 'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.frequency_calendars;
    PRINT 'Dropped frequency_calendars';
END
GO

IF OBJECT_ID('dbo.review_cycles', 'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.review_cycles;
    PRINT 'Dropped review_cycles';
END
GO

IF OBJECT_ID('dbo.questionnaire_templates', 'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.questionnaire_templates;
    PRINT 'Dropped questionnaire_templates';
END
GO

IF OBJECT_ID('dbo.appraisal_cycles', 'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.appraisal_cycles;
    PRINT 'Dropped appraisal_cycles';
END
GO

IF OBJECT_ID('dbo.review_frequencies', 'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.review_frequencies;
    PRINT 'Dropped review_frequencies';
END
GO

-- 2. CONFIG / SUPPORT TABLES
IF OBJECT_ID('dbo.registrations', 'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.registrations;
    PRINT 'Dropped registrations';
END
GO

IF OBJECT_ID('dbo.sessions', 'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.sessions;
    PRINT 'Dropped sessions';
END
GO

IF OBJECT_ID('dbo.email_templates', 'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.email_templates;
    PRINT 'Dropped email_templates';
END
GO

IF OBJECT_ID('dbo.email_config', 'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.email_config;
    PRINT 'Dropped email_config';
END
GO

-- 1. CORE MASTER TABLES
IF OBJECT_ID('dbo.departments', 'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.departments;
    PRINT 'Dropped departments';
END
GO

IF OBJECT_ID('dbo.locations', 'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.locations;
    PRINT 'Dropped locations';
END
GO

IF OBJECT_ID('dbo.grades', 'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.grades;
    PRINT 'Dropped grades';
END
GO

IF OBJECT_ID('dbo.levels', 'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.levels;
    PRINT 'Dropped levels';
END
GO

IF OBJECT_ID('dbo.users', 'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.users;
    PRINT 'Dropped users';
END
GO

IF OBJECT_ID('dbo.companies', 'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.companies;
    PRINT 'Dropped companies';
END
GO

PRINT '';
PRINT 'Rollback completed successfully.';
PRINT 'All tables from Complete_query.sql have been dropped.';
GO
