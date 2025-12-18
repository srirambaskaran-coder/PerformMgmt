import { Request, Response } from 'express';
import { FeedbackRequestService } from '../services/feedback-request.service';
import { ApiResponse } from '../utils/response';
import { asyncHandler } from '../middleware/error.middleware';
import { z } from 'zod';

const submitFeedbackSchema = z.object({
  relationshipWithPeer: z.string().min(1, "Relationship description is required"),
  collaborationRating: z.enum(['excellent', 'good', 'average', 'needs_improvement', 'poor']),
  communicationRating: z.enum(['excellent', 'good', 'average', 'needs_improvement', 'poor']),
  reliabilityRating: z.enum(['excellent', 'good', 'average', 'needs_improvement', 'poor']),
  problemSolvingRating: z.enum(['excellent', 'good', 'average', 'needs_improvement', 'poor']),
  ownershipRating: z.enum(['excellent', 'good', 'average', 'needs_improvement', 'poor', 'not_applicable']),
  opennessToFeedbackRating: z.enum(['excellent', 'good', 'average', 'needs_improvement', 'poor']),
  conflictHandlingRating: z.enum(['excellent', 'good', 'average', 'needs_improvement', 'poor', 'not_applicable']),
  jobSpecificCompetencies: z.string().min(1, "Job specific competencies is required"),
  strengths: z.string().min(1, "Strengths is required"),
  developmentAreas: z.string().min(1, "Development areas is required"),
  overallSummary: z.string().min(1, "Overall summary is required"),
  recommendedRating: z.number().min(1).max(5),
});

const createFeedbackRequestsSchema = z.object({
  subjectId: z.string().min(1, "Subject employee ID is required"),
  evaluationId: z.string().optional(),
  appraisalCycleId: z.string().optional(),
  reviewerIds: z.array(z.string()).default([]),
  externalEmails: z.array(z.string().email()).optional(),
}).refine(
  (data) => data.reviewerIds.length > 0 || (data.externalEmails && data.externalEmails.length > 0),
  { message: "At least one reviewer or external email is required" }
);

export class FeedbackRequestController {
  private feedbackRequestService: FeedbackRequestService;

  constructor() {
    this.feedbackRequestService = new FeedbackRequestService();
  }

  /**
   * Get feedback requests assigned to the current user (as reviewer)
   */
  getMyFeedbackRequests = asyncHandler(async (req: Request, res: Response) => {
    const reviewerId = (req as any).user?.id || (req as any).user?.claims?.sub;
    const requests = await this.feedbackRequestService.getFeedbackRequestsForReviewer(reviewerId);
    return ApiResponse.success(res, requests);
  });

  /**
   * Get available peer employees for 360 feedback selection
   */
  getPeerEmployees = asyncHandler(async (req: Request, res: Response) => {
    const managerId = (req as any).user?.id || (req as any).user?.claims?.sub;
    const employees = await this.feedbackRequestService.getPeerEmployees(managerId);
    return ApiResponse.success(res, employees);
  });

  /**
   * Get feedback requests for a specific subject (team member)
   */
  getSubjectFeedbackRequests = asyncHandler(async (req: Request, res: Response) => {
    const managerId = (req as any).user?.id || (req as any).user?.claims?.sub;
    const { subjectId } = req.params;
    const requests = await this.feedbackRequestService.getFeedbackRequestsForSubject(subjectId, managerId);
    return ApiResponse.success(res, requests);
  });

  /**
   * Get a single feedback request by ID
   */
  getFeedbackRequestById = asyncHandler(async (req: Request, res: Response) => {
    const reviewerId = (req as any).user?.id || (req as any).user?.claims?.sub;
    const { id } = req.params;
    const request = await this.feedbackRequestService.getFeedbackRequestById(id, reviewerId);
    return ApiResponse.success(res, request);
  });

  /**
   * Submit feedback for a request
   */
  submitFeedback = asyncHandler(async (req: Request, res: Response) => {
    const reviewerId = (req as any).user?.id || (req as any).user?.claims?.sub;
    const { id } = req.params;
    
    const validatedData = submitFeedbackSchema.parse(req.body);
    const result = await this.feedbackRequestService.submitFeedback(id, reviewerId, validatedData);
    return ApiResponse.success(res, result, 'Feedback submitted successfully');
  });

  /**
   * Download feedback as PDF
   */
  downloadPdf = asyncHandler(async (req: Request, res: Response) => {
    const managerId = (req as any).user?.id || (req as any).user?.claims?.sub;
    const { id } = req.params;
    
    const pdfBuffer = await this.feedbackRequestService.generateFeedbackPdf(id, managerId);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="360-feedback-${id}.pdf"`);
    res.send(pdfBuffer);
  });

  /**
   * Create feedback requests for team member (360 degree feedback)
   */
  createForTeamMember = asyncHandler(async (req: Request, res: Response) => {
    const managerId = (req as any).user?.id || (req as any).user?.claims?.sub;
    
    const validatedData = createFeedbackRequestsSchema.parse(req.body);
    const result = await this.feedbackRequestService.createFeedbackRequestsForTeamMember(
      managerId,
      validatedData.subjectId,
      validatedData.reviewerIds,
      validatedData.externalEmails || [],
      validatedData.evaluationId,
      validatedData.appraisalCycleId
    );
    
    return ApiResponse.success(res, result, `Created ${result.createdRequests.length} feedback request(s)`);
  });
}
