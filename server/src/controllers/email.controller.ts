import { Request, Response } from 'express';
import { EmailService } from '../services/email.service';
import { ApiResponse } from '../utils/response';
import { asyncHandler } from '../middleware/error.middleware';

export class EmailController {
  private emailService: EmailService;

  constructor() {
    this.emailService = new EmailService();
  }

  sendEmail = asyncHandler(async (req: Request, res: Response) => {
    const { to, subject, body } = req.body;
    await this.emailService.sendEmail(to, subject, body);
    return ApiResponse.success(res, null, 'Email sent successfully');
  });

  getEmailTemplates = asyncHandler(async (req: Request, res: Response) => {
    const companyId = req.query.companyId as string | undefined;
    const templates = await this.emailService.getEmailTemplates(companyId);
    return ApiResponse.success(res, templates);
  });

  getEmailTemplateById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const template = await this.emailService.getEmailTemplateById(id);
    return ApiResponse.success(res, template);
  });

  createEmailTemplate = asyncHandler(async (req: Request, res: Response) => {
    const template = await this.emailService.createEmailTemplate(req.body);
    return ApiResponse.created(res, template, 'Email template created successfully');
  });

  updateEmailTemplate = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const template = await this.emailService.updateEmailTemplate(id, req.body);
    return ApiResponse.success(res, template, 'Email template updated successfully');
  });

  deleteEmailTemplate = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await this.emailService.deleteEmailTemplate(id);
    return ApiResponse.success(res, null, 'Email template deleted successfully');
  });

  getEmailConfig = asyncHandler(async (req: Request, res: Response) => {
    const companyId = req.query.companyId as string | undefined;
    const config = await this.emailService.getEmailConfig(companyId);
    return ApiResponse.success(res, config);
  });

  updateEmailConfig = asyncHandler(async (req: Request, res: Response) => {
    const config = await this.emailService.updateEmailConfig(req.body);
    return ApiResponse.success(res, config, 'Email configuration updated successfully');
  });
}
