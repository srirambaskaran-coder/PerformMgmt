# Employee Performance Evaluation System

## Overview

This is a comprehensive employee performance evaluation and review management system built with React, Node.js, and PostgreSQL. The application facilitates structured performance reviews with role-based access control, supporting five distinct user roles: Super Administrator, Administrator, HR Manager, Employee, and Manager. The system provides end-to-end workflow management from questionnaire creation to evaluation completion with approval processes and automated email notifications, including advanced progress tracking and flexible appraisal initiation with scheduled and immediate publishing modes.

## User Preferences

Preferred communication style: Simple, everyday language.

## Test Credentials

For testing HR Manager functionality:
- **Company**: hfactor
- **Username**: kirankshetty@yahoo.com
- **Password**: password123

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite
- **Routing**: Wouter for client-side routing with role-based protection
- **UI Components**: shadcn/ui built on Radix UI
- **Styling**: Tailwind CSS with CSS variables
- **State Management**: TanStack Query
- **Form Handling**: React Hook Form with Zod validation
- **File Uploads**: Uppy integration with Google Cloud Storage

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Database ORM**: Drizzle ORM with PostgreSQL
- **Authentication**: Replit Authentication with session-based auth
- **Email Service**: Nodemailer for notifications and calendar invites
- **File Storage**: Google Cloud Storage
- **API Design**: RESTful API with role-based access control middleware

### Database Schema Design
- **User Management**: Role-based permissions (super_admin, admin, hr_manager, employee, manager)
- **Company Structure**: Multi-tenant support (company, location, user relationships)
- **Performance Reviews**: Flexible questionnaire template system with dynamic question types
- **Evaluation Workflow**: Complete evaluation lifecycle with approval tracking
- **Session Management**: PostgreSQL-based session storage
- **Scheduled Tasks**: `scheduled_appraisal_tasks` table for managing timed appraisal initiations.

### Role-Based Access Control
- **Super Administrator**: Full system access, company management, user role assignments.
- **Administrator**: User management, location setup, questionnaire configuration, email service setup.
- **HR Manager**: Review cycle initiation, progress monitoring, evaluation oversight.
- **Employee**: Self-evaluation, document export, meeting scheduling.
- **Manager**: Team member evaluation, review approval, meeting coordination.

### Key Features
- **Email Integration**: Configurable SMTP, automated notifications (invitations, reminders, completion), calendar invite generation.
- **File Management System**: Google Cloud Storage integration, PDF/DOCX generation for evaluations, company asset management.
- **Progress Tracking**: Accurate, real-time tracking of evaluation progress with comprehensive filtering (Appraisal Cycle, Frequency Calendar, Frequency Calendar Details, Group, Employee, Location, Department, Level, Grade, Manager) and different view modes (Card, Table). The Appraisal Cycle filter displays actual cycles in "code - description" format (e.g., "FY 2025-26 - Annual Appraisal from April 2025 to March 2026"). Includes functional "Send Reminder" capabilities. Excel export includes Location, Member Rating, and Final Manager Rating columns with proper handling of 0 ratings.
- **Appraisal Initiation**: Supports "Publish Now" for immediate evaluation creation and email notifications, and "Publish As Per Calendar" for scheduled initiation based on frequency calendar periods.
- **Multi-Select Period Selection**: HR Managers can selectively choose specific calendar periods for appraisal initiation, preserving per-period timing configurations.
- **Password Management**: All user roles (HR Manager, Employee, Manager, Administrator, Super Administrator) can change their own passwords through the Settings page with secure validation and current password verification.

## External Dependencies

### Database Services
- **Neon Database**: PostgreSQL-compatible serverless database.
- **PostgreSQL**: Primary database for application data and session storage.

### Cloud Services
- **Google Cloud Storage**: Object storage for files, documents, and assets.
- **Replit Authentication**: OAuth-based authentication service.

### Email Services
- **Nodemailer**: SMTP client for email delivery and templates.

### UI and Styling
- **shadcn/ui**: Accessible component library based on Radix UI.
- **Tailwind CSS**: Utility-first CSS framework.

### File Upload and Processing
- **Uppy**: File upload library.

### Development Tools
- **TypeScript**: Type safety for frontend and backend.
- **Drizzle Kit**: Database migration and schema management.
- **Vite**: Fast build tool.