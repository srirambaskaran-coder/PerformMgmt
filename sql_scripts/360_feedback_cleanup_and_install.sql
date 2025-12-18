-- ============================================
-- 360 DEGREE FEEDBACK - CLEANUP AND FRESH INSTALL
-- ============================================
-- This script will:
-- 1. Drop all existing 360 feedback stored procedures  
-- 2. Drop the FeedbackRequests table (if exists)
-- 3. Recreate everything with correct schema
-- ============================================

-- ============================================
-- STEP 1: DROP EXISTING STORED PROCEDURES
-- ============================================

-- Drop procedures from the original script (without dbo prefix)
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_GetFeedbackRequestsByRespondent')
    DROP PROCEDURE sp_GetFeedbackRequestsByRespondent;
GO

IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_GetFeedbackRequestById')
    DROP PROCEDURE sp_GetFeedbackRequestById;
GO

IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_GetFeedbackRequestsBySubject')
    DROP PROCEDURE sp_GetFeedbackRequestsBySubject;
GO

IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_CreateFeedbackRequest')
    DROP PROCEDURE sp_CreateFeedbackRequest;
GO

IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_SubmitFeedback')
    DROP PROCEDURE sp_SubmitFeedback;
GO

IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_GetPeerEmployeesForFeedback')
    DROP PROCEDURE sp_GetPeerEmployeesForFeedback;
GO

IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_GetReporteesForFeedback')
    DROP PROCEDURE sp_GetReporteesForFeedback;
GO

IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_CancelFeedbackRequest')
    DROP PROCEDURE sp_CancelFeedbackRequest;
GO

IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_ExpireOverdueFeedbackRequests')
    DROP PROCEDURE sp_ExpireOverdueFeedbackRequests;
GO

IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_GetFeedbackAnalytics')
    DROP PROCEDURE sp_GetFeedbackAnalytics;
GO

-- Drop procedures from the correct script (with dbo prefix)
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND SCHEMA_NAME(schema_id) = 'dbo' AND name = 'GetFeedbackRequestsForReviewer')
    DROP PROCEDURE dbo.GetFeedbackRequestsForReviewer;
GO

IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND SCHEMA_NAME(schema_id) = 'dbo' AND name = 'GetFeedbackRequestsForSubject')
    DROP PROCEDURE dbo.GetFeedbackRequestsForSubject;
GO

IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND SCHEMA_NAME(schema_id) = 'dbo' AND name = 'GetFeedbackRequest')
    DROP PROCEDURE dbo.GetFeedbackRequest;
GO

IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND SCHEMA_NAME(schema_id) = 'dbo' AND name = 'CreateFeedbackRequest')
    DROP PROCEDURE dbo.CreateFeedbackRequest;
GO

IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND SCHEMA_NAME(schema_id) = 'dbo' AND name = 'SubmitFeedbackRequest')
    DROP PROCEDURE dbo.SubmitFeedbackRequest;
GO

IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND SCHEMA_NAME(schema_id) = 'dbo' AND name = 'CancelFeedbackRequest')
    DROP PROCEDURE dbo.CancelFeedbackRequest;
GO

IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND SCHEMA_NAME(schema_id) = 'dbo' AND name = 'ExpireOverdueFeedbackRequests')
    DROP PROCEDURE dbo.ExpireOverdueFeedbackRequests;
GO

PRINT 'All existing 360 Feedback stored procedures dropped.';
GO

-- ============================================
-- STEP 2: DROP EXISTING TABLE
-- ============================================

-- Drop indexes first
IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_FeedbackRequests_AppraisalId')
    DROP INDEX IX_FeedbackRequests_AppraisalId ON FeedbackRequests;
GO

IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_FeedbackRequests_SubjectEmployeeId')
    DROP INDEX IX_FeedbackRequests_SubjectEmployeeId ON FeedbackRequests;
GO

IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_FeedbackRequests_RespondentEmployeeId')
    DROP INDEX IX_FeedbackRequests_RespondentEmployeeId ON FeedbackRequests;
GO

IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_FeedbackRequests_RequesterId')
    DROP INDEX IX_FeedbackRequests_RequesterId ON FeedbackRequests;
GO

IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_FeedbackRequests_ReviewerId')
    DROP INDEX IX_FeedbackRequests_ReviewerId ON FeedbackRequests;
GO

IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_FeedbackRequests_SubjectId')
    DROP INDEX IX_FeedbackRequests_SubjectId ON FeedbackRequests;
GO

IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_FeedbackRequests_Status')
    DROP INDEX IX_FeedbackRequests_Status ON FeedbackRequests;
GO

-- Drop the table
IF EXISTS (SELECT * FROM sysobjects WHERE name='FeedbackRequests' AND xtype='U')
BEGIN
    DROP TABLE FeedbackRequests;
    PRINT 'Table FeedbackRequests dropped.';
END
GO

-- ============================================
-- STEP 3: CREATE TABLE WITH CORRECT SCHEMA
-- ============================================
-- This schema is designed to work with your existing database structure
-- Column naming follows snake_case to match your users table
-- ============================================

CREATE TABLE dbo.feedback_requests (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    
    -- Request metadata
    requester_id UNIQUEIDENTIFIER NOT NULL,  -- The manager who initiated the request
    reviewer_id UNIQUEIDENTIFIER NULL,       -- The employee who will provide feedback (NULL if external)
    subject_id UNIQUEIDENTIFIER NOT NULL,    -- The employee being reviewed
    
    evaluation_id UNIQUEIDENTIFIER NULL,     -- Link to evaluations table if applicable
    appraisal_cycle_id UNIQUEIDENTIFIER NULL, -- Link to appraisal cycle
    
    external_email NVARCHAR(255) NULL,       -- For external reviewers (not employees)
    
    status NVARCHAR(50) NOT NULL DEFAULT 'pending'
        CONSTRAINT CH_feedback_requests_status CHECK (status IN ('pending', 'submitted', 'expired', 'cancelled')),
    
    due_date DATETIME2 NULL,
    
    -- Feedback Response Fields (filled when submitted)
    relationship_with_peer NVARCHAR(MAX) NULL,
    collaboration_rating NVARCHAR(50) NULL,
    communication_rating NVARCHAR(50) NULL,
    reliability_rating NVARCHAR(50) NULL,
    problem_solving_rating NVARCHAR(50) NULL,
    ownership_rating NVARCHAR(50) NULL,
    openness_to_feedback_rating NVARCHAR(50) NULL,
    conflict_handling_rating NVARCHAR(50) NULL,
    job_specific_competencies NVARCHAR(MAX) NULL,
    strengths NVARCHAR(MAX) NULL,
    development_areas NVARCHAR(MAX) NULL,
    overall_summary NVARCHAR(MAX) NULL,
    recommended_rating INT NULL,
    
    -- Timestamps
    submitted_at DATETIME2 NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    updated_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    
    -- Constraints
    CONSTRAINT CHK_feedback_requests_rating CHECK (
        recommended_rating IS NULL OR (recommended_rating >= 1 AND recommended_rating <= 5)
    )
);
GO

PRINT 'Table dbo.feedback_requests created successfully.';
GO

-- Create indexes
CREATE INDEX IX_feedback_requests_requester_id ON dbo.feedback_requests(requester_id);
GO

CREATE INDEX IX_feedback_requests_reviewer_id ON dbo.feedback_requests(reviewer_id);
GO

CREATE INDEX IX_feedback_requests_subject_id ON dbo.feedback_requests(subject_id);
GO

CREATE INDEX IX_feedback_requests_status ON dbo.feedback_requests(status);
GO

PRINT 'Indexes created successfully.';
GO

-- ============================================
-- STEP 4: CREATE STORED PROCEDURES
-- ============================================

-- ============================================
-- SP: GetFeedbackRequestsForReviewer
-- Description: Get all feedback requests assigned to a reviewer (for employee view)
-- ============================================
CREATE PROCEDURE dbo.GetFeedbackRequestsForReviewer
    @ReviewerId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        fr.id,
        fr.requester_id,
        fr.reviewer_id,
        fr.subject_id,
        fr.evaluation_id,
        fr.appraisal_cycle_id,
        fr.external_email,
        fr.status,
        fr.due_date,
        fr.relationship_with_peer,
        fr.collaboration_rating,
        fr.communication_rating,
        fr.reliability_rating,
        fr.problem_solving_rating,
        fr.ownership_rating,
        fr.openness_to_feedback_rating,
        fr.conflict_handling_rating,
        fr.job_specific_competencies,
        fr.strengths,
        fr.development_areas,
        fr.overall_summary,
        fr.recommended_rating,
        fr.submitted_at,
        fr.created_at,
        fr.updated_at,
        -- Subject employee info
        s.first_name AS subject_first_name,
        s.last_name AS subject_last_name,
        s.email AS subject_email,
        s.profile_image_url AS subject_profile_image_url,
        -- Requester info
        r.first_name AS requester_first_name,
        r.last_name AS requester_last_name
    FROM dbo.feedback_requests fr
    LEFT JOIN dbo.users s ON fr.subject_id = s.id
    LEFT JOIN dbo.users r ON fr.requester_id = r.id
    WHERE fr.reviewer_id = @ReviewerId
    ORDER BY 
        CASE WHEN fr.status = 'pending' THEN 0 ELSE 1 END,
        fr.created_at DESC;
END
GO

PRINT 'Stored Procedure dbo.GetFeedbackRequestsForReviewer created successfully.';
GO

-- ============================================
-- SP: GetFeedbackRequestsForSubject
-- Description: Get all feedback requests for a subject employee (for manager view)
-- ============================================
CREATE PROCEDURE dbo.GetFeedbackRequestsForSubject
    @SubjectId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        fr.id,
        fr.requester_id,
        fr.reviewer_id,
        fr.subject_id,
        fr.evaluation_id,
        fr.appraisal_cycle_id,
        fr.external_email,
        fr.status,
        fr.due_date,
        fr.relationship_with_peer,
        fr.collaboration_rating,
        fr.communication_rating,
        fr.reliability_rating,
        fr.problem_solving_rating,
        fr.ownership_rating,
        fr.openness_to_feedback_rating,
        fr.conflict_handling_rating,
        fr.job_specific_competencies,
        fr.strengths,
        fr.development_areas,
        fr.overall_summary,
        fr.recommended_rating,
        fr.submitted_at,
        fr.created_at,
        fr.updated_at,
        -- Reviewer info
        rev.first_name AS reviewer_first_name,
        rev.last_name AS reviewer_last_name,
        rev.email AS reviewer_email,
        rev.profile_image_url AS reviewer_profile_image_url
    FROM dbo.feedback_requests fr
    LEFT JOIN dbo.users rev ON fr.reviewer_id = rev.id
    WHERE fr.subject_id = @SubjectId
    ORDER BY fr.created_at DESC;
END
GO

PRINT 'Stored Procedure dbo.GetFeedbackRequestsForSubject created successfully.';
GO

-- ============================================
-- SP: GetFeedbackRequest
-- Description: Get a single feedback request by ID with full details
-- ============================================
CREATE PROCEDURE dbo.GetFeedbackRequest
    @Id UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        fr.id,
        fr.requester_id,
        fr.reviewer_id,
        fr.subject_id,
        fr.evaluation_id,
        fr.appraisal_cycle_id,
        fr.external_email,
        fr.status,
        fr.due_date,
        fr.relationship_with_peer,
        fr.collaboration_rating,
        fr.communication_rating,
        fr.reliability_rating,
        fr.problem_solving_rating,
        fr.ownership_rating,
        fr.openness_to_feedback_rating,
        fr.conflict_handling_rating,
        fr.job_specific_competencies,
        fr.strengths,
        fr.development_areas,
        fr.overall_summary,
        fr.recommended_rating,
        fr.submitted_at,
        fr.created_at,
        fr.updated_at,
        -- Subject employee info
        s.first_name AS subject_first_name,
        s.last_name AS subject_last_name,
        s.email AS subject_email,
        s.profile_image_url AS subject_profile_image_url,
        s.designation AS subject_designation,
        -- Department and Grade
        d.code AS subject_department_code,
        d.description AS subject_department_name,
        g.code AS subject_grade_code,
        g.description AS subject_grade_name,
        -- Requester info
        r.first_name AS requester_first_name,
        r.last_name AS requester_last_name
    FROM dbo.feedback_requests fr
    LEFT JOIN dbo.users s ON fr.subject_id = s.id
    LEFT JOIN dbo.users r ON fr.requester_id = r.id
    LEFT JOIN dbo.departments d ON s.department = d.code
    LEFT JOIN dbo.grades g ON s.grade_id = g.id
    WHERE fr.id = @Id;
END
GO

PRINT 'Stored Procedure dbo.GetFeedbackRequest created successfully.';
GO

-- ============================================
-- SP: CreateFeedbackRequest
-- Description: Create a new feedback request
-- ============================================
CREATE PROCEDURE dbo.CreateFeedbackRequest
    @RequesterId UNIQUEIDENTIFIER,
    @ReviewerId UNIQUEIDENTIFIER = NULL,
    @SubjectId UNIQUEIDENTIFIER,
    @EvaluationId UNIQUEIDENTIFIER = NULL,
    @AppraisalCycleId UNIQUEIDENTIFIER = NULL,
    @ExternalEmail NVARCHAR(255) = NULL,
    @DueDate DATETIME2 = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @NewId UNIQUEIDENTIFIER = NEWID();
    
    -- Check for duplicate request
    IF EXISTS (
        SELECT 1 FROM dbo.feedback_requests 
        WHERE subject_id = @SubjectId
        AND (
            (reviewer_id = @ReviewerId AND @ReviewerId IS NOT NULL)
            OR (external_email = @ExternalEmail AND @ExternalEmail IS NOT NULL)
        )
        AND status NOT IN ('cancelled', 'expired')
        AND (evaluation_id = @EvaluationId OR (evaluation_id IS NULL AND @EvaluationId IS NULL))
    )
    BEGIN
        RAISERROR('A feedback request already exists for this reviewer.', 16, 1);
        RETURN;
    END
    
    INSERT INTO dbo.feedback_requests (
        id,
        requester_id,
        reviewer_id,
        subject_id,
        evaluation_id,
        appraisal_cycle_id,
        external_email,
        due_date,
        status,
        created_at,
        updated_at
    )
    VALUES (
        @NewId,
        @RequesterId,
        @ReviewerId,
        @SubjectId,
        @EvaluationId,
        @AppraisalCycleId,
        @ExternalEmail,
        @DueDate,
        'pending',
        SYSDATETIME(),
        SYSDATETIME()
    );
    
    -- Return the created record with related info
    SELECT 
        fr.*,
        s.first_name AS subject_first_name,
        s.last_name AS subject_last_name,
        s.email AS subject_email,
        rev.first_name AS reviewer_first_name,
        rev.last_name AS reviewer_last_name,
        rev.email AS reviewer_email
    FROM dbo.feedback_requests fr
    LEFT JOIN dbo.users s ON fr.subject_id = s.id
    LEFT JOIN dbo.users rev ON fr.reviewer_id = rev.id
    WHERE fr.id = @NewId;
END
GO

PRINT 'Stored Procedure dbo.CreateFeedbackRequest created successfully.';
GO

-- ============================================
-- SP: SubmitFeedbackRequest
-- Description: Submit feedback for a request
-- ============================================
CREATE PROCEDURE dbo.SubmitFeedbackRequest
    @Id UNIQUEIDENTIFIER,
    @ReviewerId UNIQUEIDENTIFIER,
    @RelationshipWithPeer NVARCHAR(MAX),
    @CollaborationRating NVARCHAR(50),
    @CommunicationRating NVARCHAR(50),
    @ReliabilityRating NVARCHAR(50),
    @ProblemSolvingRating NVARCHAR(50),
    @OwnershipRating NVARCHAR(50),
    @OpennessToFeedbackRating NVARCHAR(50),
    @ConflictHandlingRating NVARCHAR(50),
    @JobSpecificCompetencies NVARCHAR(MAX),
    @Strengths NVARCHAR(MAX),
    @DevelopmentAreas NVARCHAR(MAX),
    @OverallSummary NVARCHAR(MAX),
    @RecommendedRating INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Validate the request exists and belongs to this reviewer
    IF NOT EXISTS (
        SELECT 1 FROM dbo.feedback_requests 
        WHERE id = @Id 
        AND reviewer_id = @ReviewerId
    )
    BEGIN
        RAISERROR('Feedback request not found or not authorized.', 16, 1);
        RETURN;
    END
    
    -- Check if already submitted
    IF EXISTS (
        SELECT 1 FROM dbo.feedback_requests 
        WHERE id = @Id 
        AND status = 'submitted'
    )
    BEGIN
        RAISERROR('This feedback has already been submitted.', 16, 1);
        RETURN;
    END
    
    -- Validate recommended rating
    IF @RecommendedRating < 1 OR @RecommendedRating > 5
    BEGIN
        RAISERROR('Recommended rating must be between 1 and 5.', 16, 1);
        RETURN;
    END
    
    UPDATE dbo.feedback_requests
    SET 
        relationship_with_peer = @RelationshipWithPeer,
        collaboration_rating = @CollaborationRating,
        communication_rating = @CommunicationRating,
        reliability_rating = @ReliabilityRating,
        problem_solving_rating = @ProblemSolvingRating,
        ownership_rating = @OwnershipRating,
        openness_to_feedback_rating = @OpennessToFeedbackRating,
        conflict_handling_rating = @ConflictHandlingRating,
        job_specific_competencies = @JobSpecificCompetencies,
        strengths = @Strengths,
        development_areas = @DevelopmentAreas,
        overall_summary = @OverallSummary,
        recommended_rating = @RecommendedRating,
        status = 'submitted',
        submitted_at = SYSDATETIME(),
        updated_at = SYSDATETIME()
    WHERE id = @Id;
    
    -- Return the updated record
    SELECT * FROM dbo.feedback_requests WHERE id = @Id;
END
GO

PRINT 'Stored Procedure dbo.SubmitFeedbackRequest created successfully.';
GO

-- ============================================
-- SP: CancelFeedbackRequest
-- Description: Cancel a pending feedback request
-- ============================================
CREATE PROCEDURE dbo.CancelFeedbackRequest
    @Id UNIQUEIDENTIFIER,
    @RequesterId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Validate the request exists and belongs to this requester
    IF NOT EXISTS (
        SELECT 1 FROM dbo.feedback_requests 
        WHERE id = @Id 
        AND requester_id = @RequesterId
        AND status = 'pending'
    )
    BEGIN
        RAISERROR('Feedback request not found or cannot be cancelled.', 16, 1);
        RETURN;
    END
    
    UPDATE dbo.feedback_requests
    SET 
        status = 'cancelled',
        updated_at = SYSDATETIME()
    WHERE id = @Id;
    
    SELECT * FROM dbo.feedback_requests WHERE id = @Id;
END
GO

PRINT 'Stored Procedure dbo.CancelFeedbackRequest created successfully.';
GO

-- ============================================
-- SP: ExpireOverdueFeedbackRequests
-- Description: Mark overdue pending requests as expired (run as scheduled job)
-- ============================================
CREATE PROCEDURE dbo.ExpireOverdueFeedbackRequests
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE dbo.feedback_requests
    SET 
        status = 'expired',
        updated_at = SYSDATETIME()
    WHERE status = 'pending'
    AND due_date IS NOT NULL
    AND due_date < SYSDATETIME();
    
    SELECT @@ROWCOUNT AS ExpiredCount;
END
GO

PRINT 'Stored Procedure dbo.ExpireOverdueFeedbackRequests created successfully.';
GO

-- ============================================
-- SP: GetPeerEmployees
-- Description: Get employees for peer selection (excludes subject and already requested)
-- ============================================
CREATE PROCEDURE dbo.GetPeerEmployees
    @SubjectId UNIQUEIDENTIFIER,
    @CompanyId UNIQUEIDENTIFIER,
    @EvaluationId UNIQUEIDENTIFIER = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        u.designation,
        u.profile_image_url,
        d.description AS department_name,
        g.description AS grade_name
    FROM dbo.users u
    LEFT JOIN dbo.departments d ON u.department = d.code
    LEFT JOIN dbo.grades g ON u.grade_id = g.id
    WHERE u.company_id = @CompanyId
    AND u.id <> @SubjectId
    AND u.status = 'active'
    AND u.id NOT IN (
        SELECT fr.reviewer_id 
        FROM dbo.feedback_requests fr 
        WHERE fr.subject_id = @SubjectId
        AND fr.status NOT IN ('cancelled', 'expired')
        AND (fr.evaluation_id = @EvaluationId OR (@EvaluationId IS NULL AND fr.evaluation_id IS NULL))
        AND fr.reviewer_id IS NOT NULL
    )
    ORDER BY u.first_name, u.last_name;
END
GO

PRINT 'Stored Procedure dbo.GetPeerEmployees created successfully.';
GO

-- ============================================
-- SP: GetDirectReports
-- Description: Get direct reports of a manager for feedback selection
-- ============================================
CREATE PROCEDURE dbo.GetDirectReports
    @ManagerId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        u.designation,
        u.profile_image_url,
        d.description AS department_name,
        g.description AS grade_name
    FROM dbo.users u
    LEFT JOIN dbo.departments d ON u.department = d.code
    LEFT JOIN dbo.grades g ON u.grade_id = g.id
    WHERE u.reporting_manager_id = @ManagerId
    AND u.status = 'active'
    ORDER BY u.first_name, u.last_name;
END
GO

PRINT 'Stored Procedure dbo.GetDirectReports created successfully.';
GO

PRINT '';
PRINT '============================================';
PRINT '360 DEGREE FEEDBACK - Setup Complete';
PRINT '============================================';
PRINT 'Table Created: dbo.feedback_requests';
PRINT '';
PRINT 'Stored Procedures Created:';
PRINT '  - dbo.GetFeedbackRequestsForReviewer';
PRINT '  - dbo.GetFeedbackRequestsForSubject';
PRINT '  - dbo.GetFeedbackRequest';
PRINT '  - dbo.CreateFeedbackRequest';
PRINT '  - dbo.SubmitFeedbackRequest';
PRINT '  - dbo.CancelFeedbackRequest';
PRINT '  - dbo.ExpireOverdueFeedbackRequests';
PRINT '  - dbo.GetPeerEmployees';
PRINT '  - dbo.GetDirectReports';
PRINT '============================================';
GO
