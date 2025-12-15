# Server Source Code Structure

This directory contains all the source code for the Performance Management System backend, organized following Node.js/Express best practices.

## Directory Structure

```
src/
├── config/              # Application configuration
│   ├── cors.config.ts       # CORS settings (dev, QC, prod)
│   └── database.config.ts   # Database connection configs
│
├── controllers/         # HTTP request handlers
│   ├── analytics.controller.ts
│   ├── appraisal.controller.ts
│   ├── auth.controller.ts
│   ├── company.controller.ts
│   ├── dashboard.controller.ts
│   ├── department.controller.ts
│   ├── development-goal.controller.ts
│   ├── email.controller.ts
│   ├── evaluation.controller.ts
│   ├── grade.controller.ts
│   ├── level.controller.ts
│   ├── location.controller.ts
│   ├── questionnaire.controller.ts
│   ├── review-cycle.controller.ts
│   ├── settings.controller.ts
│   └── user.controller.ts
│
├── services/            # Business logic layer
│   ├── analytics.service.ts
│   ├── appraisal.service.ts
│   ├── auth.service.ts
│   ├── company.service.ts
│   ├── dashboard.service.ts
│   ├── department.service.ts
│   ├── development-goal.service.ts
│   ├── email.service.ts
│   ├── evaluation.service.ts
│   ├── grade.service.ts
│   ├── level.service.ts
│   ├── location.service.ts
│   ├── questionnaire.service.ts
│   ├── review-cycle.service.ts
│   ├── settings.service.ts
│   └── user.service.ts
│
├── repositories/        # Data access layer
│   ├── base.repository.ts   # Base repository class
│   └── user.repository.ts   # User data access
│
├── routes/              # API route definitions
│   ├── index.ts                     # Main router (registers all routes)
│   ├── analytics.routes.ts
│   ├── appraisal.routes.ts
│   ├── auth.routes.ts
│   ├── company.routes.ts
│   ├── dashboard.routes.ts
│   ├── department.routes.ts
│   ├── development-goal.routes.ts
│   ├── email.routes.ts
│   ├── evaluation.routes.ts
│   ├── grade.routes.ts
│   ├── level.routes.ts
│   ├── location.routes.ts
│   ├── questionnaire.routes.ts
│   ├── review-cycle.routes.ts
│   ├── settings.routes.ts
│   └── user.routes.ts
│
├── middleware/          # Express middleware
│   ├── auth.middleware.ts       # Authentication & authorization
│   ├── error.middleware.ts      # Error handling
│   └── validation.middleware.ts # Request validation
│
├── utils/               # Utility functions
│   ├── logger.ts            # Winston logger
│   └── response.ts          # API response helpers
│
├── lib/                 # Core libraries and legacy code
│   ├── auth.ts                  # Session authentication setup
│   ├── augmentationStore.ts     # Augmentation data
│   ├── calendarService.ts       # Calendar utilities
│   ├── db.ts                    # Database connection (legacy)
│   ├── emailService.ts          # Email sending service
│   ├── mssql.ts                 # MSSQL connection pool
│   ├── objectAcl.ts             # Object access control
│   ├── objectStorage.ts         # File storage service
│   ├── replitAuth.ts            # Replit authentication (legacy)
│   ├── seedUsers.ts             # User seeding
│   ├── storage.ts               # Main data access layer (MSSQL SPs)
│   ├── storage_sp_template.ts   # Storage procedure templates
│   └── vite.ts                  # Vite integration
│
├── models/              # Database models (future use)
│
├── types/               # TypeScript type definitions
│   └── types.d.ts           # Global type declarations
│
├── app.ts               # Express app configuration
└── routes.ts            # Legacy monolithic routes (being phased out)
```

## Architecture Layers

### 1. Routes Layer (`routes/`)
- Defines API endpoints
- Applies middleware (authentication, validation)
- Maps HTTP methods to controller actions
- Example: `GET /api/users` → `UserController.getAllUsers()`

### 2. Controllers Layer (`controllers/`)
- Handles HTTP request/response
- Validates request data
- Calls service layer methods
- Formats responses using `ApiResponse` helper
- No business logic - delegates to services

### 3. Services Layer (`services/`)
- Contains all business logic
- Orchestrates data operations
- Handles complex workflows
- Independent of HTTP concerns
- Calls repositories/storage for data

### 4. Repositories Layer (`repositories/`)
- Data access abstraction
- Executes stored procedures
- Maps database results to domain models
- Currently uses `storage.ts` for most operations

### 5. Library Layer (`lib/`)
- Core shared libraries
- Legacy monolithic code
- Database connections
- Email service
- File storage
- Authentication setup

## Import Patterns

### Services import from lib/
```typescript
import { storage } from '../lib/storage';
import { emailService } from '../lib/emailService';
```

### Controllers import services
```typescript
import { UserService } from '../services/user.service';
```

### Routes import controllers
```typescript
import { UserController } from '../controllers/user.controller';
```

### All layers use utilities
```typescript
import { logger } from '../utils/logger';
import { ApiResponse } from '../utils/response';
```

## Configuration

### Environment-Based Config
- **Development**: Local database, localhost CORS
- **QC**: QC database, QC URL CORS
- **Production**: Production database, production URL CORS

Config files in `config/` handle environment detection.

## Migration Status

✅ **New Architecture**: All major modules have services, controllers, and routes
⚠️ **Legacy Code**: `routes.ts` still contains original monolithic routes
🔄 **Transition**: Both architectures coexist; gradually phasing out legacy

## Best Practices

1. **Keep layers separate**: Routes → Controllers → Services → Repositories
2. **Use dependency injection**: Pass services to controllers via constructor
3. **Error handling**: Use `AppError` and `asyncHandler` wrapper
4. **Logging**: Use Winston logger, not console.log
5. **Validation**: Validate requests in controllers or middleware
6. **Type safety**: Use TypeScript types from `@shared/schema`

## Adding New Features

1. Create service in `services/[feature].service.ts`
2. Create controller in `controllers/[feature].controller.ts`
3. Create routes in `routes/[feature].routes.ts`
4. Register routes in `routes/index.ts`
5. Add types if needed in `types/`

## Testing

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

## Documentation

See the `docs/` directory in the project root for:
- Architecture documentation
- API documentation
- Deployment guides
- Migration guides
