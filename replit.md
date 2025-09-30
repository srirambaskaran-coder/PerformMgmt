# Employee Performance Evaluation System

## Overview

This is a comprehensive employee performance evaluation and review management system built with React, Node.js, and PostgreSQL. The application facilitates structured performance reviews with role-based access control, supporting five distinct user roles: Super Administrator, Administrator, HR Manager, Employee, and Manager. The system provides end-to-end workflow management from questionnaire creation to evaluation completion with approval processes and automated email notifications.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **Routing**: Wouter for client-side routing with role-based route protection
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query for server state management and caching
- **Form Handling**: React Hook Form with Zod validation schemas
- **File Uploads**: Uppy integration with Google Cloud Storage for document uploads

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Database ORM**: Drizzle ORM with PostgreSQL as the primary database
- **Authentication**: Replit Authentication with session-based auth using express-session
- **Email Service**: Nodemailer for sending notifications and calendar invites
- **File Storage**: Google Cloud Storage integration for document and file management
- **API Design**: RESTful API with role-based access control middleware

### Database Schema Design
- **User Management**: Comprehensive user table with role-based permissions (super_admin, admin, hr_manager, employee, manager)
- **Company Structure**: Multi-tenant support with company, location, and user relationship management
- **Performance Reviews**: Flexible questionnaire template system with dynamic question types
- **Evaluation Workflow**: Complete evaluation lifecycle from creation to finalization with approval tracking
- **Session Management**: PostgreSQL-based session storage for authentication persistence

### Role-Based Access Control
- **Super Administrator**: Full system access including company management and user role assignments
- **Administrator**: User management, location setup, questionnaire template configuration, and email service setup
- **HR Manager**: Review cycle initiation, progress monitoring, and employee evaluation oversight
- **Employee**: Self-evaluation completion, document export capabilities, and meeting scheduling
- **Manager**: Team member evaluation, review approval, meeting coordination, and final evaluation completion

### Email Integration
- **Service Configuration**: Configurable SMTP settings for organizational email integration
- **Automated Notifications**: Performance review invitations, reminders, and completion notifications
- **Calendar Integration**: Meeting scheduling with calendar invite generation for one-on-one discussions

### File Management System
- **Object Storage**: Google Cloud Storage integration with ACL-based access control
- **Document Export**: PDF/DOCX generation for completed evaluations
- **Company Assets**: Logo upload and management for organizational branding

## External Dependencies

### Database Services
- **Neon Database**: PostgreSQL-compatible serverless database with connection pooling
- **Session Storage**: PostgreSQL-based session management for authentication persistence

### Cloud Services
- **Google Cloud Storage**: Object storage for file uploads, document storage, and company assets
- **Replit Authentication**: OAuth-based authentication service integration

### Email Services
- **Nodemailer**: SMTP client for email delivery with configurable transport settings
- **Email Templates**: HTML email template system for various notification types

### UI and Styling
- **shadcn/ui**: Pre-built accessible component library based on Radix UI
- **Tailwind CSS**: Utility-first CSS framework with custom design system
- **Radix UI**: Low-level UI primitives for accessible component development

### File Upload and Processing
- **Uppy**: File upload library with dashboard interface and progress tracking
- **File Export**: Document generation capabilities for evaluation reports

### Development Tools
- **TypeScript**: Type safety across frontend and backend with shared schema definitions
- **Drizzle Kit**: Database migration and schema management tools
- **Vite**: Fast build tool with hot module replacement for development

## Recent Progress Tracking Implementation

### Current State (Production Ready)
The progress tracking feature is now fully implemented with production-ready accuracy:

- **Review Appraisal Page**: Fully functional UI with filtering, expandable progress cards, and employee details
- **Accurate Progress Calculation**: Uses foreign key relationships for precise per-cycle metrics
- **API Integration**: `/api/initiated-appraisals` returns accurate progress data with proper cross-cycle isolation
- **Frontend Display**: Real-time progress bars, status badges, and functional Send Reminder capabilities
- **Schema Enhancement**: Direct foreign key relationship between evaluations and initiated appraisals

### Architecture Improvements Completed
All identified limitations have been successfully resolved:

1. ✅ **Schema Enhancement**: Added `initiatedAppraisalId VARCHAR` foreign key column to evaluations table
2. ✅ **Cross-Cycle Isolation**: Eliminated contamination by replacing date-based heuristics with foreign key relationships
3. ✅ **Evaluation Linking**: New API route `/api/initiated-appraisals/:appraisalId/generate-evaluations` for proper evaluation creation
4. ✅ **Storage Interface**: Added `getEvaluationsByInitiatedAppraisal` method for accurate progress calculation
5. ✅ **Testing Coverage**: End-to-end tests confirm accurate progress tracking across overlapping cycles

### Production-Ready Features
- ✅ Multi-filter capabilities (Group, Employee, Location, Department, Level, Grade, Manager)
- ✅ Expandable appraisal cards with detailed employee progress tables
- ✅ Status-based badge coloring (completed, in_progress, not_started, overdue)
- ✅ Functional Send Reminder buttons with email integration for non-completed evaluations
- ✅ Real-time progress percentages and completion counters with cross-cycle accuracy
- ✅ Clean UI/UX with proper loading states and error handling
- ✅ Foreign key-based progress calculation for production accuracy

### Technical Implementation Details
- **Database Schema**: `initiated_appraisal_id VARCHAR` column added to evaluations table
- **Progress Calculation**: Uses `eq(evaluations.initiatedAppraisalId, appraisalId)` instead of date filtering
- **Evaluation Creation**: HR managers can generate evaluations linked to specific initiated appraisals
- **Cross-Cycle Protection**: Evaluations are now properly scoped to their initiated appraisal cycle
- **Email Integration**: Send Reminder functionality implemented with proper authorization checks

## Appraisal Initiation with Email Notifications

### Overview
The Initiate Appraisal Cycle feature now supports two publishing modes with automated email notifications:
1. **Publish Now**: Immediately creates evaluations and sends email notifications to all employees
2. **Publish As Per Calendar**: Schedules evaluations based on frequency calendar periods with automated processing

### Publishing Modes

#### Publish Now (Immediate)
- Creates evaluation records for all active members of the appraisal group
- Sends immediate email notifications to each employee with:
  - Appraisal type information
  - Due date calculated from daysToClose setting
  - Direct link to employee evaluation dashboard
- Updates appraisal status to 'active' automatically
- Provides real-time feedback on evaluations created and emails sent

#### Publish As Per Calendar (Scheduled)
- Creates scheduled tasks for each calendar detail period
- Stores tasks in `scheduled_appraisal_tasks` table with:
  - Calculated scheduled date (period start + daysToInitiate)
  - Link to initiated appraisal and calendar detail
  - Status tracking (pending, completed, failed)
- Tasks are processed via `/api/process-scheduled-tasks` endpoint
- Email notifications sent automatically when scheduled date arrives

### Email Service Integration
- **Template**: `sendAppraisalInitiationEmail` in emailService.ts
- **Content**: Professional HTML email with appraisal details and action link
- **Error Handling**: Individual email failures don't block evaluation creation
- **Configuration**: Uses existing SMTP settings from email_config table

### Database Schema
New table: `scheduled_appraisal_tasks`
- `id`: Primary key (UUID)
- `initiated_appraisal_id`: Foreign key to initiated appraisals
- `frequency_calendar_detail_id`: Link to calendar period
- `scheduled_date`: When to process the task
- `status`: pending, completed, or failed
- `executed_at`: Timestamp of task execution
- `error`: Error message if task failed

### Security
- Email sending includes proper error handling and logging
- Scheduled task processing protected by authentication (super_admin, admin, hr_manager roles)
- Individual failures logged without blocking batch operations
- No sensitive data exposed in email templates

### Technical Flow
1. HR Manager initiates appraisal with selected publish type
2. If "Publish Now": Immediate evaluation creation + email sending
3. If "As Per Calendar": Scheduled task creation for each period
4. Background processor (authenticated) checks for pending tasks
5. On scheduled date: Creates evaluations + sends emails automatically
6. Task status updated with results and any error messages