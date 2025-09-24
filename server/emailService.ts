import nodemailer from 'nodemailer';
import { storage } from './storage';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  async initializeTransporter() {
    try {
      const config = await storage.getEmailConfig();
      if (!config) {
        throw new Error('Email configuration not found');
      }

      this.transporter = nodemailer.createTransport({
        host: config.smtpHost,
        port: config.smtpPort,
        secure: config.smtpPort === 465,
        auth: {
          user: config.smtpUsername,
          pass: config.smtpPassword,
        },
      });

      // Verify connection
      await this.transporter.verify();
      console.log('Email service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize email service:', error);
      throw error;
    }
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    if (!this.transporter) {
      await this.initializeTransporter();
    }

    if (!this.transporter) {
      throw new Error('Email transporter not initialized');
    }

    const config = await storage.getEmailConfig();
    if (!config) {
      throw new Error('Email configuration not found');
    }

    const mailOptions = {
      from: `"${config.fromName}" <${config.fromEmail}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Email sent successfully to ${options.to}`);
    } catch (error) {
      console.error('Failed to send email:', error);
      throw error;
    }
  }

  generateReviewInvitationEmail(employeeName: string, reviewCycleId: string): { subject: string; html: string } {
    const subject = 'Performance Review - Action Required';
    const reviewLink = `${process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost:5000'}/evaluations/${reviewCycleId}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Performance Review Invitation</h2>
        <p>Dear ${employeeName},</p>
        <p>You have been invited to complete your performance review. Please click the link below to access the review form:</p>
        <div style="text-align: center; margin: 20px 0;">
          <a href="${reviewLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Complete Review
          </a>
        </div>
        <p>If you have any questions, please contact your HR manager.</p>
        <p>Best regards,<br>HR Team</p>
      </div>
    `;

    return { subject, html };
  }

  generateReviewReminderEmail(employeeName: string, dueDate: string): { subject: string; html: string } {
    const subject = 'Performance Review Reminder - Due Soon';
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f59e0b;">Performance Review Reminder</h2>
        <p>Dear ${employeeName},</p>
        <p>This is a friendly reminder that your performance review is due on <strong>${dueDate}</strong>.</p>
        <p>Please complete your review as soon as possible to avoid any delays.</p>
        <p>Best regards,<br>HR Team</p>
      </div>
    `;

    return { subject, html };
  }

  generateReviewCompletionEmail(employeeName: string, managerName: string): { subject: string; html: string } {
    const subject = 'Performance Review Completed';
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">Performance Review Completed</h2>
        <p>Dear ${employeeName},</p>
        <p>Your performance review has been completed by ${managerName}. The review results are now available in your dashboard.</p>
        <p>Thank you for your participation in the review process.</p>
        <p>Best regards,<br>HR Team</p>
      </div>
    `;

    return { subject, html };
  }

  generateRegistrationNotificationEmail(name: string, companyName: string, designation: string, email: string, mobile: string): { subject: string; html: string } {
    const subject = 'New Performance Hub Registration Interest';
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">New Registration Interest - Performance Hub</h2>
        <p>A new company has expressed interest in Performance Hub SaaS platform:</p>
        
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #334155;">Contact Details</h3>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Company:</strong> ${companyName}</p>
          <p><strong>Designation:</strong> ${designation}</p>
          <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
          <p><strong>Mobile:</strong> ${mobile}</p>
        </div>
        
        <p><strong>Submitted on:</strong> ${new Date().toLocaleString()}</p>
        
        <div style="text-align: center; margin: 20px 0;">
          <a href="mailto:${email}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Contact ${name}
          </a>
        </div>
        
        <p>Please follow up with this potential customer to discuss their Performance Management needs and onboarding process.</p>
        
        <p style="color: #64748b; font-size: 14px;">
          This email was automatically generated by Performance Hub registration system.
        </p>
      </div>
    `;

    return { subject, html };
  }

  generateCalendarInvite(employeeName: string, managerName: string, meetingDate: Date): string {
    const startDate = meetingDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const endDate = new Date(meetingDate.getTime() + 60 * 60 * 1000).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    
    return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Performance Review System//EN
BEGIN:VEVENT
UID:${Date.now()}@performance-review.com
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTSTART:${startDate}
DTEND:${endDate}
SUMMARY:Performance Review Meeting - ${employeeName}
DESCRIPTION:One-on-one performance review meeting between ${employeeName} and ${managerName}
ATTENDEE;CN=${employeeName}:mailto:employee@company.com
ATTENDEE;CN=${managerName}:mailto:manager@company.com
END:VEVENT
END:VCALENDAR`;
  }
}

const emailService = new EmailService();

export async function sendEmail(options: EmailOptions): Promise<void> {
  return emailService.sendEmail(options);
}

export async function sendReviewInvitation(employeeEmail: string, employeeName: string, reviewCycleId: string): Promise<void> {
  const { subject, html } = emailService.generateReviewInvitationEmail(employeeName, reviewCycleId);
  return emailService.sendEmail({
    to: employeeEmail,
    subject,
    html,
  });
}

export async function sendReviewReminder(employeeEmail: string, employeeName: string, dueDate: string): Promise<void> {
  const { subject, html } = emailService.generateReviewReminderEmail(employeeName, dueDate);
  return emailService.sendEmail({
    to: employeeEmail,
    subject,
    html,
  });
}

export async function sendReviewCompletion(employeeEmail: string, employeeName: string, managerName: string): Promise<void> {
  const { subject, html } = emailService.generateReviewCompletionEmail(employeeName, managerName);
  return emailService.sendEmail({
    to: employeeEmail,
    subject,
    html,
  });
}

export async function sendCalendarInvite(employeeEmail: string, managerEmail: string, employeeName: string, managerName: string, meetingDate: Date): Promise<void> {
  const icsContent = emailService.generateCalendarInvite(employeeName, managerName, meetingDate);
  
  const subject = `Meeting Invitation: Performance Review - ${employeeName}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Meeting Invitation</h2>
      <p>You have been invited to a performance review meeting.</p>
      <p><strong>Date:</strong> ${meetingDate.toLocaleDateString()}</p>
      <p><strong>Time:</strong> ${meetingDate.toLocaleTimeString()}</p>
      <p><strong>Participants:</strong> ${employeeName}, ${managerName}</p>
    </div>
  `;

  // Send to both employee and manager
  await emailService.sendEmail({
    to: employeeEmail,
    subject,
    html,
  });

  await emailService.sendEmail({
    to: managerEmail,
    subject,
    html,
  });
}

export function generateRegistrationNotificationEmail(name: string, companyName: string, designation: string, email: string, mobile: string): { subject: string; html: string } {
  return emailService.generateRegistrationNotificationEmail(name, companyName, designation, email, mobile);
}
