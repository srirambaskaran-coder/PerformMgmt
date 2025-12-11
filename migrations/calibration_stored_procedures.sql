-- Stored Procedures for Calibration Rating Functionality

-- Get all evaluations with employee and manager details for calibration
CREATE OR ALTER PROCEDURE dbo.GetEvaluationsForCalibration
  @CompanyId UNIQUEIDENTIFIER
AS
BEGIN
  SET NOCOUNT ON;
  
  SELECT 
    e.id AS Id,
    e.employee_id AS EmployeeId,
    e.manager_id AS ManagerId,
    e.review_cycle_id AS ReviewCycleId,
    e.initiated_appraisal_id AS InitiatedAppraisalId,
    e.self_evaluation_data AS SelfEvaluationData,
    e.self_evaluation_submitted_at AS SelfEvaluationSubmittedAt,
    e.manager_evaluation_data AS ManagerEvaluationData,
    e.manager_evaluation_submitted_at AS ManagerEvaluationSubmittedAt,
    e.overall_rating AS OverallRating,
    e.status AS Status,
    e.meeting_scheduled_at AS MeetingScheduledAt,
    e.meeting_notes AS MeetingNotes,
    e.meeting_completed_at AS MeetingCompletedAt,
    e.finalized_at AS FinalizedAt,
    e.show_notes_to_employee AS ShowNotesToEmployee,
    e.calibrated_rating AS CalibratedRating,
    e.calibration_remarks AS CalibrationRemarks,
    e.calibrated_by AS CalibratedBy,
    e.calibrated_at AS CalibratedAt,
    e.created_at AS CreatedAt,
    e.updated_at AS UpdatedAt,
    -- Employee details - flattened for UI
    CONCAT(emp.first_name, ' ', emp.last_name) AS EmployeeName,
    emp.code AS EmployeeCode,
    emp.designation AS EmployeeDesignation,
    emp.department AS DepartmentName,
    emp.level_id AS LevelId,
    emp.grade_id AS GradeId,
    emp.location_id AS LocationId,
    -- Manager details - flattened for UI
    CONCAT(mgr.first_name, ' ', mgr.last_name) AS ManagerName
  FROM dbo.evaluations e
  INNER JOIN dbo.users emp ON e.employee_id = emp.id
  LEFT JOIN dbo.users mgr ON e.manager_id = mgr.id
  WHERE emp.company_id = @CompanyId
  ORDER BY e.created_at DESC;
END
GO

-- Update calibration for an evaluation
CREATE OR ALTER PROCEDURE dbo.UpdateEvaluationCalibration
  @Id UNIQUEIDENTIFIER,
  @CalibratedRating INT = NULL,
  @CalibrationRemarks NVARCHAR(MAX) = NULL,
  @CalibratedBy UNIQUEIDENTIFIER,
  @CalibratedAt DATETIME2
AS
BEGIN
  SET NOCOUNT ON;
  
  -- Update the evaluation
  UPDATE dbo.evaluations
  SET 
    calibrated_rating = @CalibratedRating,
    calibration_remarks = @CalibrationRemarks,
    calibrated_by = @CalibratedBy,
    calibrated_at = @CalibratedAt,
    updated_at = SYSDATETIME()
  WHERE id = @Id;
  
  -- Return the updated evaluation
  SELECT 
    id AS Id,
    employee_id AS EmployeeId,
    manager_id AS ManagerId,
    review_cycle_id AS ReviewCycleId,
    initiated_appraisal_id AS InitiatedAppraisalId,
    self_evaluation_data AS SelfEvaluationData,
    self_evaluation_submitted_at AS SelfEvaluationSubmittedAt,
    manager_evaluation_data AS ManagerEvaluationData,
    manager_evaluation_submitted_at AS ManagerEvaluationSubmittedAt,
    overall_rating AS OverallRating,
    status AS Status,
    meeting_scheduled_at AS MeetingScheduledAt,
    meeting_notes AS MeetingNotes,
    meeting_completed_at AS MeetingCompletedAt,
    finalized_at AS FinalizedAt,
    show_notes_to_employee AS ShowNotesToEmployee,
    calibrated_rating AS CalibratedRating,
    calibration_remarks AS CalibrationRemarks,
    calibrated_by AS CalibratedBy,
    calibrated_at AS CalibratedAt,
    created_at AS CreatedAt,
    updated_at AS UpdatedAt
  FROM dbo.evaluations
  WHERE id = @Id;
END
GO

PRINT 'Calibration stored procedures created successfully.';
GO
