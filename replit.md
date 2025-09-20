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