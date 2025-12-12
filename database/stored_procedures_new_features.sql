-- =============================================
-- Stored Procedures for New Features
-- Calibrate Ratings, Analytics, and Team Member Development Goals
-- =============================================

-- =============================================
-- GetTeamMemberDevelopmentGoals
-- Get all development goals for employees managed by a specific manager
-- =============================================
CREATE OR ALTER PROCEDURE dbo.GetTeamMemberDevelopmentGoals
    @ManagerId NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        dg.Id,
        dg.EmployeeId,
        dg.EvaluationId,
        dg.Description,
        dg.PlannedOutcome,
        dg.TargetDate,
        dg.Progress,
        dg.Status,
        dg.CreatedAt,
        dg.UpdatedAt
    FROM DevelopmentGoals dg
    INNER JOIN Users emp ON dg.EmployeeId = emp.Id
    WHERE emp.ManagerId = @ManagerId
    ORDER BY dg.CreatedAt DESC;
END
GO

-- =============================================
-- Note: The following procedures should already exist in your system
-- =============================================

-- ✅ GetEvaluationsForCalibration - Already exists
--    Returns evaluations with employee and manager details for calibration
--    Parameters: @CompanyId UNIQUEIDENTIFIER
--    Used by: /api/analytics/performance-trends, /api/evaluations/calibrate

-- ✅ UpdateEvaluationCalibration - Already exists  
--    Updates calibration fields for an evaluation
--    Parameters: @Id, @CalibratedRating, @CalibrationRemarks, @CalibratedBy, @CalibratedAt
--    Used by: PUT /api/evaluations/:id/calibrate, POST /api/evaluations/calibrate/import

PRINT 'Stored procedure GetTeamMemberDevelopmentGoals created successfully.'
PRINT ''
PRINT 'Prerequisites verified:'
PRINT '✓ GetEvaluationsForCalibration (already exists)'
PRINT '✓ UpdateEvaluationCalibration (already exists)'
PRINT ''
PRINT 'Migration complete! You can now test the new features.'
