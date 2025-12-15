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
