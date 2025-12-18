-- ============================================
-- 360 DEGREE FEEDBACK - MSSQL Database Scripts
-- ============================================
-- Execute these scripts in your MSSQL database to support 360-degree feedback functionality
-- ============================================

-- ============================================
-- 1. CREATE FEEDBACK_REQUESTS TABLE
-- ============================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='FeedbackRequests' AND xtype='U')
BEGIN
    CREATE TABLE FeedbackRequests (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        AppraisalId INT NOT NULL,
        RequesterId NVARCHAR(255) NOT NULL,
        SubjectEmployeeId NVARCHAR(255) NOT NULL,
        RespondentEmployeeId NVARCHAR(255) NULL,
        ExternalEmail NVARCHAR(255) NULL,
        Status NVARCHAR(50) NOT NULL DEFAULT 'pending',
        DueDate DATETIME NOT NULL,
        
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
        CONSTRAINT CHK_FeedbackRequests_Ratings CHECK (
            CollaborationRating IS NULL OR CollaborationRating IN ('excellent', 'good', 'average', 'needs_improvement', 'poor')
        ),
        CONSTRAINT CHK_FeedbackRequests_RecommendedRating CHECK (
            RecommendedRating IS NULL OR (RecommendedRating >= 1 AND RecommendedRating <= 5)
        ),
        -- Either RespondentEmployeeId OR ExternalEmail must be provided, not both
        CONSTRAINT CHK_FeedbackRequests_Respondent CHECK (
            (RespondentEmployeeId IS NOT NULL AND ExternalEmail IS NULL) OR
            (RespondentEmployeeId IS NULL AND ExternalEmail IS NOT NULL)
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
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_FeedbackRequests_AppraisalId')
BEGIN
    CREATE INDEX IX_FeedbackRequests_AppraisalId ON FeedbackRequests(AppraisalId);
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_FeedbackRequests_SubjectEmployeeId')
BEGIN
    CREATE INDEX IX_FeedbackRequests_SubjectEmployeeId ON FeedbackRequests(SubjectEmployeeId);
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_FeedbackRequests_RespondentEmployeeId')
BEGIN
    CREATE INDEX IX_FeedbackRequests_RespondentEmployeeId ON FeedbackRequests(RespondentEmployeeId);
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_FeedbackRequests_Status')
BEGIN
    CREATE INDEX IX_FeedbackRequests_Status ON FeedbackRequests(Status);
END
GO

-- ============================================
-- 2. STORED PROCEDURES
-- ============================================

-- ============================================
-- SP: GetFeedbackRequestsByRespondent
-- Description: Get all feedback requests assigned to a respondent (for employee view)
-- ============================================
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_GetFeedbackRequestsByRespondent')
    DROP PROCEDURE sp_GetFeedbackRequestsByRespondent;
GO

CREATE PROCEDURE sp_GetFeedbackRequestsByRespondent
    @RespondentEmployeeId NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        fr.Id,
        fr.AppraisalId,
        fr.RequesterId,
        fr.SubjectEmployeeId,
        fr.RespondentEmployeeId,
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
        fr.UpdatedAt,
        -- Include subject employee info
        se.FirstName AS SubjectFirstName,
        se.LastName AS SubjectLastName,
        se.Email AS SubjectEmail,
        se.ProfileImageUrl AS SubjectProfileImageUrl,
        -- Include requester info
        re.FirstName AS RequesterFirstName,
        re.LastName AS RequesterLastName
    FROM FeedbackRequests fr
    LEFT JOIN Users se ON fr.SubjectEmployeeId = se.Id
    LEFT JOIN Users re ON fr.RequesterId = re.Id
    WHERE fr.RespondentEmployeeId = @RespondentEmployeeId
    ORDER BY 
        CASE WHEN fr.Status = 'pending' THEN 0 ELSE 1 END,
        fr.DueDate ASC;
END
GO

PRINT 'Stored Procedure sp_GetFeedbackRequestsByRespondent created successfully.';
GO

-- ============================================
-- SP: GetFeedbackRequestById
-- Description: Get a single feedback request by ID
-- ============================================
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_GetFeedbackRequestById')
    DROP PROCEDURE sp_GetFeedbackRequestById;
GO

CREATE PROCEDURE sp_GetFeedbackRequestById
    @Id INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        fr.Id,
        fr.AppraisalId,
        fr.RequesterId,
        fr.SubjectEmployeeId,
        fr.RespondentEmployeeId,
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
        fr.UpdatedAt,
        -- Include subject employee info
        se.FirstName AS SubjectFirstName,
        se.LastName AS SubjectLastName,
        se.Email AS SubjectEmail,
        se.ProfileImageUrl AS SubjectProfileImageUrl,
        se.Code AS SubjectCode,
        d.Name AS SubjectDepartment,
        g.Name AS SubjectGrade
    FROM FeedbackRequests fr
    LEFT JOIN Users se ON fr.SubjectEmployeeId = se.Id
    LEFT JOIN Departments d ON se.DepartmentId = d.Id
    LEFT JOIN Grades g ON se.GradeId = g.Id
    WHERE fr.Id = @Id;
END
GO

PRINT 'Stored Procedure sp_GetFeedbackRequestById created successfully.';
GO

-- ============================================
-- SP: GetFeedbackRequestsBySubject
-- Description: Get all feedback requests for a subject employee (for manager view)
-- ============================================
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_GetFeedbackRequestsBySubject')
    DROP PROCEDURE sp_GetFeedbackRequestsBySubject;
GO

CREATE PROCEDURE sp_GetFeedbackRequestsBySubject
    @SubjectEmployeeId NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        fr.Id,
        fr.AppraisalId,
        fr.RequesterId,
        fr.SubjectEmployeeId,
        fr.RespondentEmployeeId,
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
        fr.UpdatedAt,
        -- Include respondent info (anonymous for submitted feedback)
        CASE 
            WHEN fr.Status = 'submitted' THEN 'Anonymous Respondent'
            ELSE CONCAT(re.FirstName, ' ', re.LastName)
        END AS RespondentName,
        fr.ExternalEmail AS ExternalRespondentEmail
    FROM FeedbackRequests fr
    LEFT JOIN Users re ON fr.RespondentEmployeeId = re.Id
    WHERE fr.SubjectEmployeeId = @SubjectEmployeeId
    ORDER BY fr.CreatedAt DESC;
END
GO

PRINT 'Stored Procedure sp_GetFeedbackRequestsBySubject created successfully.';
GO

-- ============================================
-- SP: CreateFeedbackRequest
-- Description: Create a new feedback request
-- ============================================
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_CreateFeedbackRequest')
    DROP PROCEDURE sp_CreateFeedbackRequest;
GO

CREATE PROCEDURE sp_CreateFeedbackRequest
    @AppraisalId INT,
    @RequesterId NVARCHAR(255),
    @SubjectEmployeeId NVARCHAR(255),
    @RespondentEmployeeId NVARCHAR(255) = NULL,
    @ExternalEmail NVARCHAR(255) = NULL,
    @DueDate DATETIME,
    @NewId INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Validate that either RespondentEmployeeId or ExternalEmail is provided
    IF (@RespondentEmployeeId IS NULL AND @ExternalEmail IS NULL)
    BEGIN
        RAISERROR('Either RespondentEmployeeId or ExternalEmail must be provided.', 16, 1);
        RETURN;
    END
    
    IF (@RespondentEmployeeId IS NOT NULL AND @ExternalEmail IS NOT NULL)
    BEGIN
        RAISERROR('Cannot provide both RespondentEmployeeId and ExternalEmail.', 16, 1);
        RETURN;
    END
    
    -- Check for duplicate request
    IF EXISTS (
        SELECT 1 FROM FeedbackRequests 
        WHERE AppraisalId = @AppraisalId 
        AND SubjectEmployeeId = @SubjectEmployeeId
        AND (
            (RespondentEmployeeId = @RespondentEmployeeId AND @RespondentEmployeeId IS NOT NULL)
            OR (ExternalEmail = @ExternalEmail AND @ExternalEmail IS NOT NULL)
        )
        AND Status != 'cancelled'
    )
    BEGIN
        RAISERROR('A feedback request already exists for this respondent.', 16, 1);
        RETURN;
    END
    
    INSERT INTO FeedbackRequests (
        AppraisalId,
        RequesterId,
        SubjectEmployeeId,
        RespondentEmployeeId,
        ExternalEmail,
        DueDate,
        Status,
        CreatedAt,
        UpdatedAt
    )
    VALUES (
        @AppraisalId,
        @RequesterId,
        @SubjectEmployeeId,
        @RespondentEmployeeId,
        @ExternalEmail,
        @DueDate,
        'pending',
        GETDATE(),
        GETDATE()
    );
    
    SET @NewId = SCOPE_IDENTITY();
END
GO

PRINT 'Stored Procedure sp_CreateFeedbackRequest created successfully.';
GO

-- ============================================
-- SP: SubmitFeedback
-- Description: Submit feedback for a request
-- ============================================
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_SubmitFeedback')
    DROP PROCEDURE sp_SubmitFeedback;
GO

CREATE PROCEDURE sp_SubmitFeedback
    @Id INT,
    @RespondentId NVARCHAR(255), -- For validation
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
    
    -- Validate the request exists and belongs to this respondent
    IF NOT EXISTS (
        SELECT 1 FROM FeedbackRequests 
        WHERE Id = @Id 
        AND RespondentEmployeeId = @RespondentId
        AND Status = 'pending'
    )
    BEGIN
        RAISERROR('Feedback request not found or not authorized.', 16, 1);
        RETURN;
    END
    
    -- Validate ratings
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
    
    SELECT * FROM FeedbackRequests WHERE Id = @Id;
END
GO

PRINT 'Stored Procedure sp_SubmitFeedback created successfully.';
GO

-- ============================================
-- SP: GetPeerEmployeesForFeedback
-- Description: Get potential peer employees for 360 feedback (excludes subject and already requested)
-- ============================================
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_GetPeerEmployeesForFeedback')
    DROP PROCEDURE sp_GetPeerEmployeesForFeedback;
GO

CREATE PROCEDURE sp_GetPeerEmployeesForFeedback
    @AppraisalId INT,
    @SubjectEmployeeId NVARCHAR(255),
    @CompanyId INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        u.Id,
        u.FirstName,
        u.LastName,
        u.Email,
        u.ProfileImageUrl,
        u.Code,
        d.Name AS DepartmentName,
        g.Name AS GradeName
    FROM Users u
    LEFT JOIN Departments d ON u.DepartmentId = d.Id
    LEFT JOIN Grades g ON u.GradeId = g.Id
    WHERE u.Id != @SubjectEmployeeId
    AND u.Role = 'employee'
    AND (@CompanyId IS NULL OR u.CompanyId = @CompanyId)
    AND u.Id NOT IN (
        SELECT RespondentEmployeeId 
        FROM FeedbackRequests 
        WHERE AppraisalId = @AppraisalId 
        AND SubjectEmployeeId = @SubjectEmployeeId
        AND RespondentEmployeeId IS NOT NULL
        AND Status != 'cancelled'
    )
    ORDER BY u.FirstName, u.LastName;
END
GO

PRINT 'Stored Procedure sp_GetPeerEmployeesForFeedback created successfully.';
GO

-- ============================================
-- SP: GetReporteesForFeedback
-- Description: Get reportees of an employee for 360 feedback
-- ============================================
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_GetReporteesForFeedback')
    DROP PROCEDURE sp_GetReporteesForFeedback;
GO

CREATE PROCEDURE sp_GetReporteesForFeedback
    @SubjectEmployeeId NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        u.Id,
        u.FirstName,
        u.LastName,
        u.Email,
        u.ProfileImageUrl,
        u.Code,
        d.Name AS DepartmentName,
        g.Name AS GradeName
    FROM Users u
    LEFT JOIN Departments d ON u.DepartmentId = d.Id
    LEFT JOIN Grades g ON u.GradeId = g.Id
    WHERE u.ManagerId = @SubjectEmployeeId
    AND u.Role = 'employee'
    ORDER BY u.FirstName, u.LastName;
END
GO

PRINT 'Stored Procedure sp_GetReporteesForFeedback created successfully.';
GO

-- ============================================
-- SP: CancelFeedbackRequest
-- Description: Cancel a pending feedback request
-- ============================================
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_CancelFeedbackRequest')
    DROP PROCEDURE sp_CancelFeedbackRequest;
GO

CREATE PROCEDURE sp_CancelFeedbackRequest
    @Id INT,
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

PRINT 'Stored Procedure sp_CancelFeedbackRequest created successfully.';
GO

-- ============================================
-- SP: ExpireOverdueFeedbackRequests
-- Description: Mark overdue pending requests as expired (run as scheduled job)
-- ============================================
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_ExpireOverdueFeedbackRequests')
    DROP PROCEDURE sp_ExpireOverdueFeedbackRequests;
GO

CREATE PROCEDURE sp_ExpireOverdueFeedbackRequests
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE FeedbackRequests
    SET 
        Status = 'expired',
        UpdatedAt = GETDATE()
    WHERE Status = 'pending'
    AND DueDate < GETDATE();
    
    SELECT @@ROWCOUNT AS ExpiredCount;
END
GO

PRINT 'Stored Procedure sp_ExpireOverdueFeedbackRequests created successfully.';
GO

-- ============================================
-- SP: GetFeedbackAnalytics
-- Description: Get aggregated analytics for 360 feedback
-- ============================================
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_GetFeedbackAnalytics')
    DROP PROCEDURE sp_GetFeedbackAnalytics;
GO

CREATE PROCEDURE sp_GetFeedbackAnalytics
    @CompanyId INT = NULL,
    @StartDate DATETIME = NULL,
    @EndDate DATETIME = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Default date range to last 12 months if not provided
    SET @StartDate = ISNULL(@StartDate, DATEADD(MONTH, -12, GETDATE()));
    SET @EndDate = ISNULL(@EndDate, GETDATE());
    
    -- Overall Statistics
    SELECT 
        COUNT(*) AS TotalRequests,
        SUM(CASE WHEN Status = 'submitted' THEN 1 ELSE 0 END) AS SubmittedCount,
        SUM(CASE WHEN Status = 'pending' THEN 1 ELSE 0 END) AS PendingCount,
        SUM(CASE WHEN Status = 'expired' THEN 1 ELSE 0 END) AS ExpiredCount,
        SUM(CASE WHEN Status = 'cancelled' THEN 1 ELSE 0 END) AS CancelledCount,
        AVG(CAST(RecommendedRating AS FLOAT)) AS AverageRecommendedRating,
        CAST(SUM(CASE WHEN Status = 'submitted' THEN 1 ELSE 0 END) AS FLOAT) / 
            NULLIF(COUNT(*), 0) * 100 AS ResponseRate
    FROM FeedbackRequests fr
    LEFT JOIN Users u ON fr.SubjectEmployeeId = u.Id
    WHERE (@CompanyId IS NULL OR u.CompanyId = @CompanyId)
    AND fr.CreatedAt BETWEEN @StartDate AND @EndDate;
    
    -- Rating Distribution
    SELECT 
        'Collaboration' AS Category,
        SUM(CASE WHEN CollaborationRating = 'excellent' THEN 1 ELSE 0 END) AS Excellent,
        SUM(CASE WHEN CollaborationRating = 'good' THEN 1 ELSE 0 END) AS Good,
        SUM(CASE WHEN CollaborationRating = 'average' THEN 1 ELSE 0 END) AS Average,
        SUM(CASE WHEN CollaborationRating = 'needs_improvement' THEN 1 ELSE 0 END) AS NeedsImprovement,
        SUM(CASE WHEN CollaborationRating = 'poor' THEN 1 ELSE 0 END) AS Poor
    FROM FeedbackRequests fr
    LEFT JOIN Users u ON fr.SubjectEmployeeId = u.Id
    WHERE Status = 'submitted'
    AND (@CompanyId IS NULL OR u.CompanyId = @CompanyId)
    AND fr.CreatedAt BETWEEN @StartDate AND @EndDate
    
    UNION ALL
    
    SELECT 
        'Communication' AS Category,
        SUM(CASE WHEN CommunicationRating = 'excellent' THEN 1 ELSE 0 END) AS Excellent,
        SUM(CASE WHEN CommunicationRating = 'good' THEN 1 ELSE 0 END) AS Good,
        SUM(CASE WHEN CommunicationRating = 'average' THEN 1 ELSE 0 END) AS Average,
        SUM(CASE WHEN CommunicationRating = 'needs_improvement' THEN 1 ELSE 0 END) AS NeedsImprovement,
        SUM(CASE WHEN CommunicationRating = 'poor' THEN 1 ELSE 0 END) AS Poor
    FROM FeedbackRequests fr
    LEFT JOIN Users u ON fr.SubjectEmployeeId = u.Id
    WHERE Status = 'submitted'
    AND (@CompanyId IS NULL OR u.CompanyId = @CompanyId)
    AND fr.CreatedAt BETWEEN @StartDate AND @EndDate
    
    UNION ALL
    
    SELECT 
        'Reliability' AS Category,
        SUM(CASE WHEN ReliabilityRating = 'excellent' THEN 1 ELSE 0 END) AS Excellent,
        SUM(CASE WHEN ReliabilityRating = 'good' THEN 1 ELSE 0 END) AS Good,
        SUM(CASE WHEN ReliabilityRating = 'average' THEN 1 ELSE 0 END) AS Average,
        SUM(CASE WHEN ReliabilityRating = 'needs_improvement' THEN 1 ELSE 0 END) AS NeedsImprovement,
        SUM(CASE WHEN ReliabilityRating = 'poor' THEN 1 ELSE 0 END) AS Poor
    FROM FeedbackRequests fr
    LEFT JOIN Users u ON fr.SubjectEmployeeId = u.Id
    WHERE Status = 'submitted'
    AND (@CompanyId IS NULL OR u.CompanyId = @CompanyId)
    AND fr.CreatedAt BETWEEN @StartDate AND @EndDate;
END
GO

PRINT 'Stored Procedure sp_GetFeedbackAnalytics created successfully.';
GO

-- ============================================
-- 3. SAMPLE DATA (Optional - for testing)
-- ============================================
/*
-- Uncomment to insert sample data for testing

DECLARE @NewId INT;

EXEC sp_CreateFeedbackRequest 
    @AppraisalId = 1,
    @RequesterId = 'manager-1',
    @SubjectEmployeeId = 'employee-1',
    @RespondentEmployeeId = 'employee-2',
    @DueDate = '2025-02-28',
    @NewId = @NewId OUTPUT;

PRINT 'Created feedback request with ID: ' + CAST(@NewId AS NVARCHAR(10));
*/

PRINT '';
PRINT '============================================';
PRINT '360 DEGREE FEEDBACK - MSSQL Scripts Complete';
PRINT '============================================';
PRINT 'Tables Created: FeedbackRequests';
PRINT 'Stored Procedures Created:';
PRINT '  - sp_GetFeedbackRequestsByRespondent';
PRINT '  - sp_GetFeedbackRequestById';
PRINT '  - sp_GetFeedbackRequestsBySubject';
PRINT '  - sp_CreateFeedbackRequest';
PRINT '  - sp_SubmitFeedback';
PRINT '  - sp_GetPeerEmployeesForFeedback';
PRINT '  - sp_GetReporteesForFeedback';
PRINT '  - sp_CancelFeedbackRequest';
PRINT '  - sp_ExpireOverdueFeedbackRequests';
PRINT '  - sp_GetFeedbackAnalytics';
PRINT '============================================';
GO
