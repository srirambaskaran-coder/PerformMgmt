-- Rollback: Remove companyId from email_config table
-- Date: 2025-01-11
-- Description: Reverts the email_config company isolation changes

USE PMS_DB
GO

PRINT 'Starting rollback of email_config company_id migration...';
GO

-- Step 1: Drop unique constraint if exists
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UQ_email_config_company_id' AND object_id = OBJECT_ID('dbo.email_config'))
BEGIN
    ALTER TABLE dbo.email_config DROP CONSTRAINT UQ_email_config_company_id;
    PRINT 'Dropped unique constraint UQ_email_config_company_id';
END
GO

-- Step 2: Drop index on company_id if exists
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'email_config_company_id_idx' AND object_id = OBJECT_ID('dbo.email_config'))
BEGIN
    DROP INDEX email_config_company_id_idx ON dbo.email_config;
    PRINT 'Dropped index email_config_company_id_idx';
END
GO

-- Step 3: Drop company_id column if exists
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.email_config') AND name = 'company_id')
BEGIN
    ALTER TABLE dbo.email_config DROP COLUMN company_id;
    PRINT 'Dropped company_id column from email_config table';
END
GO

PRINT '';
PRINT 'Rollback completed successfully.';
PRINT 'email_config table restored to original state (without company_id).';
GO
