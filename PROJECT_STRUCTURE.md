# Performance Management System - Project Structure

## Complete Project Organization

```
PMS-codeSplit/
├── PerformMgmt/                    # Main application directory
│   │
│   ├── server/                     # Backend (Node.js/Express/TypeScript)
│   │   ├── src/                    # Source code
│   │   │   ├── config/             # Configuration files
│   │   │   ├── controllers/        # HTTP request handlers (16 modules)
│   │   │   ├── services/           # Business logic layer (16 modules)
│   │   │   ├── repositories/       # Data access layer
│   │   │   ├── routes/             # API route definitions (17 files)
│   │   │   ├── middleware/         # Express middleware
│   │   │   ├── utils/              # Utility functions
│   │   │   ├── lib/                # Core libraries & legacy code
│   │   │   ├── models/             # Database models (future)
│   │   │   ├── types/              # TypeScript type definitions
│   │   │   ├── app.ts              # Express app setup
│   │   │   ├── routes.ts           # Legacy routes (being phased out)
│   │   │   └── README.md           # Source code documentation
│   │   │
│   │   ├── index.ts                # Application entry point
│   │   └── storage.ts.backup       # Backup file
│   │
│   ├── shared/                     # Shared code between frontend/backend
│   │   └── schema/                 # Zod schemas and types
│   │
│   ├── database/                   # Database scripts
│   │   ├── migrations/             # Database migrations
│   │   └── stored-procedures/      # SQL stored procedures
│   │
│   ├── deploy/                     # Deployment configurations
│   │
│   ├── scripts/                    # Utility scripts
│   │   ├── *.cjs                   # CommonJS scripts (DB operations)
│   │   ├── *.ps1                   # PowerShell scripts (automation)
│   │   └── *.sql                   # SQL scripts
│   │
│   ├── docs/                       # Documentation
│   │   ├── ARCHITECTURE.md
│   │   ├── ARCHITECTURE_MIGRATION.md
│   │   ├── ARCHITECTURE_SUMMARY.md
│   │   ├── BACKEND_README.md
│   │   ├── DEPLOYMENT_GUIDE.md
│   │   ├── FINAL_REPORT.md
│   │   ├── MIGRATION_COMPLETE.md
│   │   └── ROUTES_EXPLANATION.md
│   │
│   ├── .env                        # Environment variables (dev)
│   ├── backend.env.production      # Production environment
│   ├── backend.env.qc              # QC environment
│   ├── .gitignore
│   ├── .replit
│   ├── package.json                # Backend dependencies
│   ├── package-lock.json
│   ├── tsconfig.json               # TypeScript configuration
│   └── drizzle.config.ts           # Drizzle ORM config
│
└── README.md                       # Project overview

```

## Backend Architecture (server/src/)

### Layered Architecture Pattern

```
┌─────────────────────────────────────────────────────────┐
│                  HTTP Layer (Routes)                    │
│              server/src/routes/*.routes.ts              │
│  • Define endpoints                                     │
│  • Apply middleware (auth, validation)                  │
│  • Map to controller methods                            │
└────────────────────┬────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────┐
│              Controller Layer                           │
│           server/src/controllers/*.controller.ts        │
│  • Handle HTTP request/response                         │
│  • Validate input                                       │
│  • Call service methods                                 │
│  • Format API responses                                 │
└────────────────────┬────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────┐
│               Service Layer                             │
│            server/src/services/*.service.ts             │
│  • Business logic                                       │
│  • Workflow orchestration                               │
│  • Complex operations                                   │
│  • Independent of HTTP                                  │
└────────────────────┬────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────┐
│            Repository/Storage Layer                     │
│     server/src/repositories/ & server/src/lib/          │
│  • Data access                                          │
│  • Execute stored procedures                            │
│  • Map DB results to models                             │
│  • Database abstraction                                 │
└────────────────────┬────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────┐
│                Database Layer (MSSQL)                   │
│  • PMS_DB_DEV (Development)                             │
│  • PMS_DB_QC (Quality Control)                          │
│  • PMS_DB (Production)                                  │
└─────────────────────────────────────────────────────────┘
```

## Module Organization (16 Complete Modules)

Each module follows the same pattern:

### Example: User Module
```
src/
├── services/user.service.ts          # Business logic
├── controllers/user.controller.ts    # HTTP handlers
└── routes/user.routes.ts             # API endpoints
```

### Complete Module List
1. **auth** - Authentication (login, logout, register)
2. **user** - User management
3. **company** - Company CRUD
4. **dashboard** - Role-based dashboards
5. **location** - Office locations
6. **department** - Departments
7. **level** - Job levels
8. **grade** - Salary grades
9. **review-cycle** - Performance review cycles
10. **evaluation** - Employee evaluations & calibration
11. **questionnaire** - Templates & publishing
12. **appraisal** - Appraisals, cycles, groups
13. **development-goal** - Development goals
14. **analytics** - Performance analytics
15. **email** - Email templates & config
16. **settings** - System settings & preferences

## Technology Stack

### Backend
- **Runtime**: Node.js v20+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: Microsoft SQL Server (MSSQL)
- **ORM/Query**: Stored Procedures + Drizzle
- **Validation**: Zod
- **Authentication**: express-session
- **Logging**: Winston
- **Email**: Nodemailer

### Development Tools
- **Build**: TypeScript Compiler (tsc)
- **Package Manager**: npm
- **Version Control**: Git

## Environment Configuration

### Three Environments

1. **Development** (`NODE_ENV=development`)
   - Database: `PMS_DB_DEV`
   - CORS: `http://localhost:*`
   - Session: Non-secure cookies

2. **QC** (`NODE_ENV=qc`)
   - Database: `PMS_DB_QC`
   - CORS: QC URL
   - Session: Secure cookies

3. **Production** (`NODE_ENV=production`)
   - Database: `PMS_DB`
   - CORS: Production URL
   - Session: Secure cookies

## API Structure

All endpoints prefixed with `/api`:

```
/api
├── /auth               # Authentication
├── /users              # User management
├── /companies          # Company management
├── /dashboard          # Dashboards (role-specific)
├── /locations          # Locations
├── /departments        # Departments
├── /levels             # Job levels
├── /grades             # Salary grades
├── /review-cycles      # Review cycles
├── /evaluations        # Evaluations & calibration
├── /questionnaires     # Questionnaire templates
├── /appraisals         # Appraisals
├── /development-goals  # Development goals
├── /analytics          # Analytics & reports
├── /email              # Email management
└── /settings           # System settings
```

## Key Features

### 1. Role-Based Access Control
- Super Admin
- Admin
- HR Manager
- Manager
- Employee

### 2. Multi-Environment Support
- Separate databases per environment
- Environment-specific CORS
- Configurable session management

### 3. Clean Architecture
- Separation of concerns
- Dependency injection
- Testable components
- Type-safe throughout

### 4. Error Handling
- Centralized error middleware
- Custom `AppError` class
- Async error wrapper
- Consistent error responses

### 5. Logging
- Winston-based logging
- Request/response tracking
- Error logging
- Environment-based log levels

## File Naming Conventions

### TypeScript Files
- **Services**: `[entity].service.ts` (e.g., `user.service.ts`)
- **Controllers**: `[entity].controller.ts` (e.g., `user.controller.ts`)
- **Routes**: `[entity].routes.ts` (e.g., `user.routes.ts`)
- **Middleware**: `[name].middleware.ts` (e.g., `auth.middleware.ts`)
- **Config**: `[name].config.ts` (e.g., `database.config.ts`)

### Scripts
- **Database**: `*.cjs` (CommonJS)
- **Automation**: `*.ps1` (PowerShell)
- **SQL**: `*.sql`

### Documentation
- **Markdown**: `*.md` in `docs/` directory

## Development Workflow

1. **Setup**
   ```bash
   cd PerformMgmt
   npm install
   ```

2. **Configure Environment**
   - Copy `.env.example` to `.env`
   - Set database credentials
   - Set session secret

3. **Run Development Server**
   ```bash
   npm run dev
   ```

4. **Build for Production**
   ```bash
   npm run build
   ```

5. **Run Production**
   ```bash
   npm start
   ```

## Migration Status

### ✅ Completed
- Created proper folder structure
- Organized all files into `src/` directory
- Separated concerns into layers
- Created 16 complete modules
- Updated all import paths
- Environment-based configuration
- Documentation complete

### 🔄 In Progress
- Phasing out legacy `routes.ts`
- Adding comprehensive tests
- API documentation (Swagger)

### 📋 Future Enhancements
- GraphQL API option
- WebSocket support
- Caching layer (Redis)
- Message queue integration
- Microservices architecture

## Contributing

1. Follow the established folder structure
2. Use the layered architecture pattern
3. Write TypeScript with strict types
4. Add tests for new features
5. Document complex logic
6. Use conventional commits

## Resources

- **Documentation**: `docs/` directory
- **Scripts**: `scripts/` directory
- **Database**: `database/` directory
- **API Endpoints**: See individual route files in `src/routes/`

---

Last Updated: December 15, 2025
