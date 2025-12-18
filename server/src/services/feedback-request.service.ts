import { storage } from '../lib/storage';
import { AppError } from '../middleware/error.middleware';
import { logger } from '../utils/logger';
import type { SubmitFeedback, FeedbackRequest } from '@shared/schema';

export class FeedbackRequestService {
  /**
   * Get all feedback requests assigned to a reviewer
   */
  async getFeedbackRequestsForReviewer(reviewerId: string): Promise<any[]> {
    try {
      const requests = await storage.getFeedbackRequestsForReviewer(reviewerId);
      
      // Enrich with subject and requester details
      const enrichedRequests = await Promise.all(
        requests.map(async (request) => {
          const subject = await storage.getUser(request.subjectId);
          const requester = await storage.getUser(request.requesterId);
          const subjectManager = subject?.reportingManagerId 
            ? await storage.getUser(subject.reportingManagerId) 
            : null;
          const subjectLocation = subject?.locationId 
            ? await storage.getLocation(subject.locationId) 
            : null;

          return {
            ...request,
            subject: subject ? {
              id: subject.id,
              firstName: subject.firstName,
              lastName: subject.lastName,
              email: subject.email,
              department: subject.department,
              designation: subject.designation,
              locationName: subjectLocation?.name || null,
              managerName: subjectManager 
                ? `${subjectManager.firstName} ${subjectManager.lastName}` 
                : null,
            } : null,
            requester: requester ? {
              id: requester.id,
              firstName: requester.firstName,
              lastName: requester.lastName,
              email: requester.email,
            } : null,
          };
        })
      );
      
      return enrichedRequests;
    } catch (error) {
      logger.error('Failed to get feedback requests for reviewer', { reviewerId, error });
      throw new AppError('Failed to retrieve feedback requests', 500);
    }
  }

  /**
   * Get available peer employees for 360 feedback selection
   */
  async getPeerEmployees(managerId: string): Promise<any[]> {
    try {
      const allUsers = await storage.getUsers({}, managerId);
      
      // Return all active employees with basic details for peer selection
      return allUsers
        .filter(u => u.status === 'active' && u.role !== 'super_admin')
        .map(u => ({
          id: u.id,
          firstName: u.firstName,
          lastName: u.lastName,
          email: u.email,
          code: u.code,
          department: u.department,
          designation: u.designation,
          locationId: u.locationId,
          levelId: u.levelId,
          gradeId: u.gradeId,
        }));
    } catch (error) {
      logger.error('Failed to get peer employees', { managerId, error });
      throw new AppError('Failed to retrieve employees', 500);
    }
  }

  /**
   * Get feedback requests for a specific subject (team member)
   */
  async getFeedbackRequestsForSubject(subjectId: string, managerId: string): Promise<any[]> {
    try {
      // Get manager to verify company scope
      const manager = await storage.getUser(managerId);
      if (!manager?.companyId) {
        throw new AppError('Access denied. Manager must belong to a company.', 403);
      }
      
      // Verify the subject is a team member of this manager AND in the same company
      const subject = await storage.getUser(subjectId);
      if (!subject || subject.reportingManagerId !== managerId || subject.companyId !== manager.companyId) {
        throw new AppError('Access denied. You can only view feedback for your team members.', 403);
      }
      
      const requests = await storage.getFeedbackRequestsForSubject(subjectId);
      
      // Enrich with reviewer details and construct feedbackResponse object
      const enrichedRequests = await Promise.all(
        requests.map(async (request) => {
          const reviewer = request.reviewerId 
            ? await storage.getUser(request.reviewerId) 
            : null;

          // Construct feedbackResponse object from individual columns for submitted requests
          const feedbackResponse = request.status === 'submitted' ? {
            collaborationRating: request.collaborationRating,
            communicationRating: request.communicationRating,
            reliabilityRating: request.reliabilityRating,
            problemSolvingRating: request.problemSolvingRating,
            ownershipRating: request.ownershipRating,
            opennessToFeedbackRating: request.opennessToFeedbackRating,
            conflictHandlingRating: request.conflictHandlingRating,
            jobSpecificCompetencies: request.jobSpecificCompetencies,
            strengths: request.strengths,
            areasForImprovement: request.developmentAreas,
            additionalComments: request.overallSummary,
            recommendedRating: request.recommendedRating,
            relationshipWithPeer: request.relationshipWithPeer,
          } : null;

          return {
            ...request,
            feedbackResponse,
            reviewer: reviewer ? {
              id: reviewer.id,
              firstName: reviewer.firstName,
              lastName: reviewer.lastName,
              email: reviewer.email,
              department: reviewer.department,
              designation: reviewer.designation,
            } : null,
            reviewerDisplay: reviewer 
              ? `${reviewer.firstName} ${reviewer.lastName}` 
              : request.externalEmail || 'External Reviewer',
          };
        })
      );
      
      return enrichedRequests;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Failed to get feedback requests for subject', { subjectId, managerId, error });
      throw new AppError('Failed to retrieve feedback requests', 500);
    }
  }

  /**
   * Get a single feedback request by ID
   */
  async getFeedbackRequestById(id: string, reviewerId: string): Promise<any> {
    try {
      const request = await storage.getFeedbackRequest(id);
      if (!request) {
        throw new AppError('Feedback request not found', 404);
      }
      
      // Verify the current user is the reviewer
      if (request.reviewerId !== reviewerId) {
        throw new AppError('Access denied', 403);
      }
      
      // Enrich with subject and requester details
      const subject = await storage.getUser(request.subjectId);
      const requester = await storage.getUser(request.requesterId);
      const subjectManager = subject?.reportingManagerId 
        ? await storage.getUser(subject.reportingManagerId) 
        : null;
      const subjectLocation = subject?.locationId 
        ? await storage.getLocation(subject.locationId) 
        : null;
      
      return {
        ...request,
        subject: subject ? {
          id: subject.id,
          firstName: subject.firstName,
          lastName: subject.lastName,
          email: subject.email,
          department: subject.department,
          designation: subject.designation,
          locationName: subjectLocation?.name || null,
          managerName: subjectManager 
            ? `${subjectManager.firstName} ${subjectManager.lastName}` 
            : null,
        } : null,
        requester: requester ? {
          id: requester.id,
          firstName: requester.firstName,
          lastName: requester.lastName,
          email: requester.email,
        } : null,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Failed to get feedback request', { id, reviewerId, error });
      throw new AppError('Failed to retrieve feedback request', 500);
    }
  }

  /**
   * Submit feedback for a request
   */
  async submitFeedback(id: string, reviewerId: string, feedback: SubmitFeedback): Promise<FeedbackRequest> {
    try {
      const result = await storage.submitFeedbackRequest(id, reviewerId, feedback);
      return result;
    } catch (error: any) {
      logger.error('Failed to submit feedback', { id, reviewerId, error });
      if (error.message?.includes('not found')) {
        throw new AppError('Feedback request not found', 404);
      }
      if (error.message?.includes('authorized')) {
        throw new AppError('You are not authorized to submit this feedback', 403);
      }
      throw new AppError(error.message || 'Failed to submit feedback', 500);
    }
  }

  /**
   * Generate PDF for feedback
   */
  async generateFeedbackPdf(id: string, managerId: string): Promise<Buffer> {
    try {
      const feedbackRequest = await storage.getFeedbackRequest(id);
      if (!feedbackRequest) {
        throw new AppError('Feedback request not found', 404);
      }
      
      // Verify manager access - must be the requester or manager of the subject
      const manager = await storage.getUser(managerId);
      const subject = await storage.getUser(feedbackRequest.subjectId);
      
      if (!manager?.companyId || !subject || 
          (feedbackRequest.requesterId !== managerId && subject.reportingManagerId !== managerId) ||
          subject.companyId !== manager.companyId) {
        throw new AppError('Access denied', 403);
      }
      
      if (feedbackRequest.status !== 'submitted') {
        throw new AppError('Feedback has not been submitted yet', 400);
      }
      
      // Get reviewer details
      const reviewer = feedbackRequest.reviewerId 
        ? await storage.getUser(feedbackRequest.reviewerId) 
        : null;
      const reviewerName = reviewer 
        ? `${reviewer.firstName} ${reviewer.lastName}` 
        : feedbackRequest.externalEmail || 'External Reviewer';
      
      // Use pdfkit if available, otherwise return a simple text buffer
      try {
        const PDFDocument = require('pdfkit');
        const doc = new PDFDocument({ margin: 50 });
        const chunks: Buffer[] = [];
        
        return new Promise((resolve, reject) => {
          doc.on('data', (chunk: Buffer) => chunks.push(chunk));
          doc.on('end', () => resolve(Buffer.concat(chunks)));
          doc.on('error', reject);
          
          // Header
          doc.fontSize(20).font('Helvetica-Bold').text('360 Degree Feedback Report', { align: 'center' });
          doc.moveDown();
          
          // Subject Info
          doc.fontSize(12).font('Helvetica-Bold').text('Employee:');
          doc.fontSize(11).font('Helvetica').text(`${subject.firstName} ${subject.lastName}`);
          doc.text(`${subject.designation || ''} - ${subject.department || ''}`);
          doc.moveDown(0.5);
          
          // Reviewer Info
          doc.fontSize(12).font('Helvetica-Bold').text('Feedback Provided By:');
          doc.fontSize(11).font('Helvetica').text(reviewerName);
          if (reviewer?.designation) {
            doc.text(`${reviewer.designation}`);
          }
          doc.moveDown(0.5);
          
          // Relationship
          if (feedbackRequest.relationshipWithPeer) {
            doc.fontSize(12).font('Helvetica-Bold').text('Relationship:');
            doc.fontSize(11).font('Helvetica').text(feedbackRequest.relationshipWithPeer);
          }
          doc.moveDown(0.5);
          
          // Submission Date
          if (feedbackRequest.submittedAt) {
            doc.fontSize(12).font('Helvetica-Bold').text('Submitted On:');
            doc.fontSize(11).font('Helvetica').text(new Date(feedbackRequest.submittedAt).toLocaleDateString());
          }
          doc.moveDown();
          
          // Ratings Section
          doc.fontSize(14).font('Helvetica-Bold').text('Performance Ratings', { underline: true });
          doc.moveDown(0.5);
          
          const formatRating = (rating: string | null) => rating ? rating.replace('_', ' ').toUpperCase() : 'N/A';
          
          const ratings = [
            ['Collaboration', feedbackRequest.collaborationRating],
            ['Communication', feedbackRequest.communicationRating],
            ['Reliability', feedbackRequest.reliabilityRating],
            ['Problem Solving', feedbackRequest.problemSolvingRating],
            ['Ownership', feedbackRequest.ownershipRating],
            ['Openness to Feedback', feedbackRequest.opennessToFeedbackRating],
            ['Conflict Handling', feedbackRequest.conflictHandlingRating],
          ];
          
          ratings.forEach(([label, rating]) => {
            doc.fontSize(11).font('Helvetica-Bold').text(`${label}: `, { continued: true });
            doc.font('Helvetica').text(formatRating(rating as string | null));
          });
          
          if (feedbackRequest.recommendedRating) {
            doc.fontSize(11).font('Helvetica-Bold').text('Recommended Rating: ', { continued: true });
            doc.font('Helvetica').text(`${feedbackRequest.recommendedRating}/5`);
          }
          doc.moveDown();
          
          // Written Feedback Section
          doc.fontSize(14).font('Helvetica-Bold').text('Written Feedback', { underline: true });
          doc.moveDown(0.5);
          
          if (feedbackRequest.jobSpecificCompetencies) {
            doc.fontSize(12).font('Helvetica-Bold').text('Job-Specific Competencies:');
            doc.fontSize(11).font('Helvetica').text(feedbackRequest.jobSpecificCompetencies);
            doc.moveDown(0.5);
          }
          
          if (feedbackRequest.strengths) {
            doc.fontSize(12).font('Helvetica-Bold').text('Strengths:');
            doc.fontSize(11).font('Helvetica').text(feedbackRequest.strengths);
            doc.moveDown(0.5);
          }
          
          if (feedbackRequest.developmentAreas) {
            doc.fontSize(12).font('Helvetica-Bold').text('Areas for Improvement:');
            doc.fontSize(11).font('Helvetica').text(feedbackRequest.developmentAreas);
            doc.moveDown(0.5);
          }
          
          if (feedbackRequest.overallSummary) {
            doc.fontSize(12).font('Helvetica-Bold').text('Overall Summary:');
            doc.fontSize(11).font('Helvetica').text(feedbackRequest.overallSummary);
          }
          
          doc.end();
        });
      } catch (pdfError) {
        // If pdfkit is not available, return a simple text representation
        logger.warn('PDFKit not available, returning text format', { pdfError });
        const textContent = `
360 Degree Feedback Report
==========================

Employee: ${subject.firstName} ${subject.lastName}
Department: ${subject.department || 'N/A'}
Designation: ${subject.designation || 'N/A'}

Feedback Provided By: ${reviewerName}
Submitted On: ${feedbackRequest.submittedAt ? new Date(feedbackRequest.submittedAt).toLocaleDateString() : 'N/A'}

Performance Ratings:
- Collaboration: ${feedbackRequest.collaborationRating || 'N/A'}
- Communication: ${feedbackRequest.communicationRating || 'N/A'}
- Reliability: ${feedbackRequest.reliabilityRating || 'N/A'}
- Problem Solving: ${feedbackRequest.problemSolvingRating || 'N/A'}
- Ownership: ${feedbackRequest.ownershipRating || 'N/A'}
- Openness to Feedback: ${feedbackRequest.opennessToFeedbackRating || 'N/A'}
- Conflict Handling: ${feedbackRequest.conflictHandlingRating || 'N/A'}
- Recommended Rating: ${feedbackRequest.recommendedRating || 'N/A'}/5

Written Feedback:
Job-Specific Competencies: ${feedbackRequest.jobSpecificCompetencies || 'N/A'}
Strengths: ${feedbackRequest.strengths || 'N/A'}
Areas for Improvement: ${feedbackRequest.developmentAreas || 'N/A'}
Overall Summary: ${feedbackRequest.overallSummary || 'N/A'}
`;
        return Buffer.from(textContent, 'utf-8');
      }
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Failed to generate feedback PDF', { id, managerId, error });
      throw new AppError('Failed to generate PDF', 500);
    }
  }

  /**
   * Create feedback requests for team member
   */
  async createFeedbackRequestsForTeamMember(
    managerId: string,
    subjectId: string,
    reviewerIds: string[],
    externalEmails: string[],
    evaluationId?: string,
    appraisalCycleId?: string
  ): Promise<{ createdRequests: any[]; failedRequests: any[]; emailsSent: string[] }> {
    try {
      // Verify the subject is in the manager's team
      const subject = await storage.getUser(subjectId);
      if (!subject) {
        throw new AppError('Subject employee not found', 404);
      }
      if (subject.reportingManagerId !== managerId) {
        throw new AppError('You can only request feedback for your direct reports', 403);
      }
      
      const createdRequests: any[] = [];
      const failedRequests: any[] = [];
      const emailsSent: string[] = [];
      
      // Create feedback requests for each reviewer
      for (const reviewerId of reviewerIds) {
        try {
          const feedbackRequest = await storage.createFeedbackRequest({
            requesterId: managerId,
            reviewerId,
            subjectId,
            evaluationId: evaluationId || null,
            appraisalCycleId: appraisalCycleId || null,
          });
          createdRequests.push(feedbackRequest);

          // Send email notification to reviewer
          const reviewer = await storage.getUser(reviewerId);
          if (reviewer?.email) {
            try {
              const { EmailService } = await import('./email.service');
              const emailService = new EmailService();
              await emailService.sendFeedbackRequestEmail(
                reviewer.email,
                `${reviewer.firstName} ${reviewer.lastName}`,
                `${subject.firstName} ${subject.lastName}`,
                managerId
              );
              emailsSent.push(reviewer.email);
            } catch (emailError) {
              logger.warn(`Failed to send feedback request email to ${reviewer.email}`, { emailError });
            }
          }
        } catch (createError) {
          logger.error(`Failed to create feedback request for reviewer ${reviewerId}`, { createError });
          failedRequests.push({ reviewerId, error: (createError as Error).message });
        }
      }
      
      // Handle external email recipients
      for (const externalEmail of externalEmails) {
        try {
          // Create a feedback request for external reviewer (with null reviewerId)
          const feedbackRequest = await storage.createFeedbackRequest({
            requesterId: managerId,
            reviewerId: null,
            subjectId,
            evaluationId: evaluationId || null,
            appraisalCycleId: appraisalCycleId || null,
            externalEmail,
          });
          createdRequests.push(feedbackRequest);

          // Send email notification to external reviewer
          try {
            const { EmailService } = await import('./email.service');
            const emailService = new EmailService();
            await emailService.sendFeedbackRequestEmail(
              externalEmail,
              externalEmail.split('@')[0],
              `${subject.firstName} ${subject.lastName}`,
              managerId
            );
            emailsSent.push(externalEmail);
          } catch (emailError) {
            logger.warn(`Failed to send feedback request email to ${externalEmail}`, { emailError });
          }
        } catch (createError) {
          logger.error(`Failed to create feedback request for external ${externalEmail}`, { createError });
          failedRequests.push({ externalEmail, error: (createError as Error).message });
        }
      }
      
      return { createdRequests, failedRequests, emailsSent };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Failed to create feedback requests', { managerId, subjectId, error });
      throw new AppError('Failed to create feedback requests', 500);
    }
  }
}
