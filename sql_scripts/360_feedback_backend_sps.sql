-- ============================================
-- 360 DEGREE FEEDBACK - MSSQL Database Scripts (Backend Compatible)
-- ============================================
-- Execute these scripts in your MSSQL database to support 360-degree feedback functionality
-- These stored procedures are compatible with the PMS_backend implementation
-- ============================================

-- ============================================
-- 1. CREATE FEEDBACK_REQUESTS TABLE
-- ============================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='FeedbackRequests' AND xtype='U')
BEGIN
    CREATE TABLE FeedbackRequests (
        Id NVARCHAR(255) PRIMARY KEY DEFAULT NEWID(),
        RequesterId NVARCHAR(255) NOT NULL,
        ReviewerId NVARCHAR(255) NULL,
        SubjectId NVARCHAR(255) NOT NULL,
        EvaluationId NVARCHAR(255) NULL,
        AppraisalCycleId NVARCHAR(255) NULL,
        ExternalEmail NVARCHAR(255) NULL,
        Status NVARCHAR(50) NOT NULL DEFAULT 'pending',
        DueDate DATETIME NULL,
        
        -- Feedback Response Fields
        RelationshipWithPeer NVARCHAR(MAX) NULL,
        CollaborationRating NVARCHAR(50) NULL,
        CommunicationRating NVARCHAR(50) NULL,
        ReliabilityRating NVARCHAR(50) NULL,
        ProblemSolvingRating NVARCHAR(50) NULL,
        OwnershipRating NVARCHAR(50) NULL,
        OpennessToFeedbackRating NVARCHAR(50) NULL,
        ConflictHandlingRating NVARCHAR(50) NULL,
        JobSpecificCompetencies NVARCHAR(MAX) NULL,
        Strengths NVARCHAR(MAX) NULL,
        DevelopmentAreas NVARCHAR(MAX) NULL,
        OverallSummary NVARCHAR(MAX) NULL,
        RecommendedRating INT NULL,
        
        -- Timestamps
        SubmittedAt DATETIME NULL,
        CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
        UpdatedAt DATETIME NOT NULL DEFAULT GETDATE(),
        
        -- Constraints
        CONSTRAINT CHK_FeedbackRequests_Status CHECK (Status IN ('pending', 'submitted', 'expired', 'cancelled')),
        CONSTRAINT CHK_FeedbackRequests_RecommendedRating CHECK (
            RecommendedRating IS NULL OR (RecommendedRating >= 1 AND RecommendedRating <= 5)
        )
    );
    
    PRINT 'Table FeedbackRequests created successfully.';
END
ELSE
BEGIN
    PRINT 'Table FeedbackRequests already exists.';
END
GO

-- Create indexes for better query performance
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_FeedbackRequests_RequesterId')
BEGIN
    CREATE INDEX IX_FeedbackRequests_RequesterId ON FeedbackRequests(RequesterId);
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_FeedbackRequests_ReviewerId')
BEGIN
    CREATE INDEX IX_FeedbackRequests_ReviewerId ON FeedbackRequests(ReviewerId);
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_FeedbackRequests_SubjectId')
BEGIN
    CREATE INDEX IX_FeedbackRequests_SubjectId ON FeedbackRequests(SubjectId);
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_FeedbackRequests_Status')
BEGIN
    CREATE INDEX IX_FeedbackRequests_Status ON FeedbackRequests(Status);
END
GO

-- ============================================
-- 2. STORED PROCEDURES (dbo schema)
-- ============================================

-- ============================================
-- SP: GetFeedbackRequestsForReviewer
-- Description: Get all feedback requests assigned to a reviewer (for employee view)
-- ============================================
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND SCHEMA_NAME(schema_id) = 'dbo' AND name = 'GetFeedbackRequestsForReviewer')
    DROP PROCEDURE dbo.GetFeedbackRequestsForReviewer;
GO

CREATE PROCEDURE dbo.GetFeedbackRequestsForReviewer
    @ReviewerId NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        fr.Id,
        fr.RequesterId,
        fr.ReviewerId,
        fr.SubjectId,
        fr.EvaluationId,
        fr.AppraisalCycleId,
        fr.ExternalEmail,
        fr.Status,
        fr.DueDate,
        fr.RelationshipWithPeer,
        fr.CollaborationRating,
        fr.CommunicationRating,
        fr.ReliabilityRating,
        fr.ProblemSolvingRating,
        fr.OwnershipRating,
        fr.OpennessToFeedbackRating,
        fr.ConflictHandlingRating,
        fr.JobSpecificCompetencies,
        fr.Strengths,
        fr.DevelopmentAreas,
        fr.OverallSummary,
        fr.RecommendedRating,
        fr.SubmittedAt,
        fr.CreatedAt,
        fr.UpdatedAt
    FROM FeedbackRequests fr
    WHERE fr.ReviewerId = @ReviewerId
    ORDER BY 
        CASE WHEN fr.Status = 'pending' THEN 0 ELSE 1 END,
        fr.CreatedAt DESC;
END
GO

PRINT 'Stored Procedure dbo.GetFeedbackRequestsForReviewer created successfully.';
GO

-- ============================================
-- SP: GetFeedbackRequestsForSubject
-- Description: Get all feedback requests for a subject employee (for manager view)
-- ============================================
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND SCHEMA_NAME(schema_id) = 'dbo' AND name = 'GetFeedbackRequestsForSubject')
    DROP PROCEDURE dbo.GetFeedbackRequestsForSubject;
GO

CREATE PROCEDURE dbo.GetFeedbackRequestsForSubject
    @SubjectId NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        fr.Id,
        fr.RequesterId,
        fr.ReviewerId,
        fr.SubjectId,
        fr.EvaluationId,
        fr.AppraisalCycleId,
        fr.ExternalEmail,
        fr.Status,
        fr.DueDate,
        fr.RelationshipWithPeer,
        fr.CollaborationRating,
        fr.CommunicationRating,
        fr.ReliabilityRating,
        fr.ProblemSolvingRating,
        fr.OwnershipRating,
        fr.OpennessToFeedbackRating,
        fr.ConflictHandlingRating,
        fr.JobSpecificCompetencies,
        fr.Strengths,
        fr.DevelopmentAreas,
        fr.OverallSummary,
        fr.RecommendedRating,
        fr.SubmittedAt,
        fr.CreatedAt,
        fr.UpdatedAt
    FROM FeedbackRequests fr
    WHERE fr.SubjectId = @SubjectId
    ORDER BY fr.CreatedAt DESC;
END
GO

PRINT 'Stored Procedure dbo.GetFeedbackRequestsForSubject created successfully.';
GO

-- ============================================
-- SP: GetFeedbackRequest
-- Description: Get a single feedback request by ID
-- ============================================
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND SCHEMA_NAME(schema_id) = 'dbo' AND name = 'GetFeedbackRequest')
    DROP PROCEDURE dbo.GetFeedbackRequest;
GO

CREATE PROCEDURE dbo.GetFeedbackRequest
    @Id NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        fr.Id,
        fr.RequesterId,
        fr.ReviewerId,
        fr.SubjectId,
        fr.EvaluationId,
        fr.AppraisalCycleId,
        fr.ExternalEmail,
        fr.Status,
        fr.DueDate,
        fr.RelationshipWithPeer,
        fr.CollaborationRating,
        fr.CommunicationRating,
        fr.ReliabilityRating,
        fr.ProblemSolvingRating,
        fr.OwnershipRating,
        fr.OpennessToFeedbackRating,
        fr.ConflictHandlingRating,
        fr.JobSpecificCompetencies,
        fr.Strengths,
        fr.DevelopmentAreas,
        fr.OverallSummary,
        fr.RecommendedRating,
        fr.SubmittedAt,
        fr.CreatedAt,
        fr.UpdatedAt
    FROM FeedbackRequests fr
    WHERE fr.Id = @Id;
END
GO

PRINT 'Stored Procedure dbo.GetFeedbackRequest created successfully.';
GO

-- ============================================
-- SP: CreateFeedbackRequest
-- Description: Create a new feedback request
-- ============================================
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND SCHEMA_NAME(schema_id) = 'dbo' AND name = 'CreateFeedbackRequest')
    DROP PROCEDURE dbo.CreateFeedbackRequest;
GO

CREATE PROCEDURE dbo.CreateFeedbackRequest
    @RequesterId NVARCHAR(255),
    @ReviewerId NVARCHAR(255) = NULL,
    @SubjectId NVARCHAR(255),
    @EvaluationId NVARCHAR(255) = NULL,
    @AppraisalCycleId NVARCHAR(255) = NULL,
    @ExternalEmail NVARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @NewId NVARCHAR(255) = NEWID();
    
    -- Check for duplicate request
    IF EXISTS (
        SELECT 1 FROM FeedbackRequests 
        WHERE SubjectId = @SubjectId
        AND (
            (ReviewerId = @ReviewerId AND @ReviewerId IS NOT NULL)
            OR (ExternalEmail = @ExternalEmail AND @ExternalEmail IS NOT NULL)
        )
        AND Status NOT IN ('cancelled', 'expired')
        AND (EvaluationId = @EvaluationId OR (EvaluationId IS NULL AND @EvaluationId IS NULL))
    )
    BEGIN
        RAISERROR('A feedback request already exists for this reviewer.', 16, 1);
        RETURN;
    END
    
    INSERT INTO FeedbackRequests (
        Id,
        RequesterId,
        ReviewerId,
        SubjectId,
        EvaluationId,
        AppraisalCycleId,
        ExternalEmail,
        Status,
        CreatedAt,
        UpdatedAt
    )
    VALUES (
        @NewId,
        @RequesterId,
        @ReviewerId,
        @SubjectId,
        @EvaluationId,
        @AppraisalCycleId,
        @ExternalEmail,
        'pending',
        GETDATE(),
        GETDATE()
    );
    
    -- Return the created record
    SELECT * FROM FeedbackRequests WHERE Id = @NewId;
END
GO

PRINT 'Stored Procedure dbo.CreateFeedbackRequest created successfully.';
GO

-- ============================================
-- SP: SubmitFeedbackRequest
-- Description: Submit feedback for a request
-- ============================================
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND SCHEMA_NAME(schema_id) = 'dbo' AND name = 'SubmitFeedbackRequest')
    DROP PROCEDURE dbo.SubmitFeedbackRequest;
GO

CREATE PROCEDURE dbo.SubmitFeedbackRequest
    @Id NVARCHAR(255),
    @ReviewerId NVARCHAR(255),
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
        SELECT 1 FROM FeedbackRequests 
        WHERE Id = @Id 
        AND ReviewerId = @ReviewerId
    )
    BEGIN
        RAISERROR('Feedback request not found or not authorized.', 16, 1);
        RETURN;
    END
    
    -- Check if already submitted
    IF EXISTS (
        SELECT 1 FROM FeedbackRequests 
        WHERE Id = @Id 
        AND Status = 'submitted'
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
    
    UPDATE FeedbackRequests
    SET 
        RelationshipWithPeer = @RelationshipWithPeer,
        CollaborationRating = @CollaborationRating,
        CommunicationRating = @CommunicationRating,
        ReliabilityRating = @ReliabilityRating,
        ProblemSolvingRating = @ProblemSolvingRating,
        OwnershipRating = @OwnershipRating,
        OpennessToFeedbackRating = @OpennessToFeedbackRating,
        ConflictHandlingRating = @ConflictHandlingRating,
        JobSpecificCompetencies = @JobSpecificCompetencies,
        Strengths = @Strengths,
        DevelopmentAreas = @DevelopmentAreas,
        OverallSummary = @OverallSummary,
        RecommendedRating = @RecommendedRating,
        Status = 'submitted',
        SubmittedAt = GETDATE(),
        UpdatedAt = GETDATE()
    WHERE Id = @Id;
    
    -- Return the updated record
    SELECT * FROM FeedbackRequests WHERE Id = @Id;
END
GO

PRINT 'Stored Procedure dbo.SubmitFeedbackRequest created successfully.';
GO

-- ============================================
-- SP: CancelFeedbackRequest
-- Description: Cancel a pending feedback request
-- ============================================
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND SCHEMA_NAME(schema_id) = 'dbo' AND name = 'CancelFeedbackRequest')
    DROP PROCEDURE dbo.CancelFeedbackRequest;
GO

CREATE PROCEDURE dbo.CancelFeedbackRequest
    @Id NVARCHAR(255),
    @RequesterId NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Validate the request exists and belongs to this requester
    IF NOT EXISTS (
        SELECT 1 FROM FeedbackRequests 
        WHERE Id = @Id 
        AND RequesterId = @RequesterId
        AND Status = 'pending'
    )
    BEGIN
        RAISERROR('Feedback request not found or cannot be cancelled.', 16, 1);
        RETURN;
    END
    
    UPDATE FeedbackRequests
    SET 
        Status = 'cancelled',
        UpdatedAt = GETDATE()
    WHERE Id = @Id;
    
    SELECT * FROM FeedbackRequests WHERE Id = @Id;
END
GO

PRINT 'Stored Procedure dbo.CancelFeedbackRequest created successfully.';
GO

-- ============================================
-- SP: ExpireOverdueFeedbackRequests
-- Description: Mark overdue pending requests as expired (run as scheduled job)
-- ============================================
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND SCHEMA_NAME(schema_id) = 'dbo' AND name = 'ExpireOverdueFeedbackRequests')
    DROP PROCEDURE dbo.ExpireOverdueFeedbackRequests;
GO

CREATE PROCEDURE dbo.ExpireOverdueFeedbackRequests
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE FeedbackRequests
    SET 
        Status = 'expired',
        UpdatedAt = GETDATE()
    WHERE Status = 'pending'
    AND DueDate IS NOT NULL
    AND DueDate < GETDATE();
    
    SELECT @@ROWCOUNT AS ExpiredCount;
END
GO

PRINT 'Stored Procedure dbo.ExpireOverdueFeedbackRequests created successfully.';
GO

PRINT '';
PRINT '============================================';
PRINT '360 DEGREE FEEDBACK - MSSQL Scripts Complete';
PRINT '============================================';
PRINT 'Table Created: FeedbackRequests';
PRINT 'Stored Procedures Created (dbo schema):';
PRINT '  - dbo.GetFeedbackRequestsForReviewer';
PRINT '  - dbo.GetFeedbackRequestsForSubject';
PRINT '  - dbo.GetFeedbackRequest';
PRINT '  - dbo.CreateFeedbackRequest';
PRINT '  - dbo.SubmitFeedbackRequest';
PRINT '  - dbo.CancelFeedbackRequest';
PRINT '  - dbo.ExpireOverdueFeedbackRequests';
PRINT '============================================';
GO
