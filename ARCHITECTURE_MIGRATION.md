# Backend Architecture Migration Guide

## Overview

The backend has been refactored from a monolithic structure to a proper **Layered Architecture** with:
- ✅ Controllers for HTTP handling
- ✅ Services for business logic
- ✅ Repositories for data access
- ✅ Middleware for cross-cutting concerns
- ✅ Utilities for common functions

## What Changed

### New Directory Structure

```
server/
├── app.ts                      # NEW: Main application entry
├── controllers/                # NEW: HTTP request handlers
├── services/                   # NEW: Business logic
├── repositories/               # NEW: Data access layer
├── middleware/                 # NEW: Middleware functions
├── routes/                     # UPDATED: Modular route files
├── utils/                      # NEW: Utility functions
├── config/                     # EXISTING: Config files (updated)
└── index.ts                    # LEGACY: Old entry point
```

### New Files Created

#### Core Application
- `server/app.ts` - New application entry point with proper middleware setup

#### Middleware
- `server/middleware/auth.middleware.ts` - Authentication & authorization
- `server/middleware/error.middleware.ts` - Centralized error handling
- `server/middleware/validation.middleware.ts` - Request validation

#### Utilities
- `server/utils/logger.ts` - Structured logging
- `server/utils/response.ts` - Consistent API responses

#### Repositories
- `server/repositories/base.repository.ts` - Base class for all repositories
- `server/repositories/user.repository.ts` - User data access

#### Services
- `server/services/auth.service.ts` - Authentication business logic
- `server/services/user.service.ts` - User management business logic

#### Controllers
- `server/controllers/auth.controller.ts` - Auth endpoints
- `server/controllers/user.controller.ts` - User endpoints

#### Routes
- `server/routes/index.ts` - Main router
- `server/routes/auth.routes.ts` - Auth routes
- `server/routes/user.routes.ts` - User routes

## How to Use

### 1. Start the Server

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

The new entry point is `server/app.ts`.

### 2. API Endpoints

All endpoints are now under `/api`:

#### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user
- `GET /api/auth/check` - Check authentication status

#### Users
- `GET /api/users` - Get all users (requires auth)
- `GET /api/users/:id` - Get user by ID (requires auth)
- `POST /api/users` - Create user (requires admin role)
- `PUT /api/users/:id` - Update user (requires admin role)
- `DELETE /api/users/:id` - Delete user (requires super_admin role)

#### Health Check
- `GET /api/health` - Server health status

### 3. Response Format

All responses follow this structure:

**Success Response:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error description",
  "errors": [ ... ] // Optional validation errors
}
```

### 4. Error Handling

Errors are automatically caught and formatted:

```typescript
// In service:
throw new AppError('User not found', 404);

// Response:
{
  "success": false,
  "message": "User not found"
}
```

### 5. Logging

Use the logger utility:

```typescript
import { logger } from './utils/logger';

logger.info('User created', { userId: user.id });
logger.error('Failed to create user', { error });
logger.debug('Debug info', { data });
```

## Adding New Features

### Example: Adding Company Management

#### 1. Create Repository

```typescript
// server/repositories/company.repository.ts
import { BaseRepository } from './base.repository';

export class CompanyRepository extends BaseRepository {
  async findAll(): Promise<Company[]> {
    return await this.executeProcedure<Company>('sp_GetAllCompanies');
  }

  async findById(id: string): Promise<Company | null> {
    const result = await this.executeProcedure<Company>('sp_GetCompanyById', { 
      CompanyId: id 
    });
    return result.length > 0 ? result[0] : null;
  }

  async create(companyData: any): Promise<Company> {
    const result = await this.executeProcedure<Company>('sp_CreateCompany', companyData);
    return result[0];
  }
}
```

#### 2. Create Service

```typescript
// server/services/company.service.ts
import { CompanyRepository } from '../repositories/company.repository';
import { AppError } from '../middleware/error.middleware';

export class CompanyService {
  private companyRepository: CompanyRepository;

  constructor() {
    this.companyRepository = new CompanyRepository();
  }

  async getAllCompanies(): Promise<Company[]> {
    return await this.companyRepository.findAll();
  }

  async getCompanyById(id: string): Promise<Company> {
    const company = await this.companyRepository.findById(id);
    if (!company) {
      throw new AppError('Company not found', 404);
    }
    return company;
  }

  async createCompany(companyData: any): Promise<Company> {
    return await this.companyRepository.create(companyData);
  }
}
```

#### 3. Create Controller

```typescript
// server/controllers/company.controller.ts
import { Request, Response } from 'express';
import { CompanyService } from '../services/company.service';
import { ApiResponse } from '../utils/response';
import { asyncHandler } from '../middleware/error.middleware';

export class CompanyController {
  private companyService: CompanyService;

  constructor() {
    this.companyService = new CompanyService();
  }

  getAllCompanies = asyncHandler(async (req: Request, res: Response) => {
    const companies = await this.companyService.getAllCompanies();
    return ApiResponse.success(res, { companies });
  });

  getCompanyById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const company = await this.companyService.getCompanyById(id);
    return ApiResponse.success(res, { company });
  });

  createCompany = asyncHandler(async (req: Request, res: Response) => {
    const company = await this.companyService.createCompany(req.body);
    return ApiResponse.created(res, { company });
  });
}
```

#### 4. Create Routes

```typescript
// server/routes/company.routes.ts
import { Router } from 'express';
import { CompanyController } from '../controllers/company.controller';
import { isAuthenticated, requireRoles } from '../middleware/auth.middleware';

const router = Router();
const controller = new CompanyController();

router.get('/', isAuthenticated, controller.getAllCompanies);
router.get('/:id', isAuthenticated, controller.getCompanyById);
router.post('/', requireRoles('super_admin'), controller.createCompany);

export default router;
```

#### 5. Register Routes

```typescript
// server/routes/index.ts
import companyRoutes from './company.routes';

router.use('/companies', companyRoutes);
```

## Migrating Old Routes

The old `routes.ts` file contains all logic. Here's how to migrate each endpoint:

### Example: Migrate User Creation

**Before (old routes.ts):**
```typescript
app.post("/api/users", async (req: any, res) => {
  try {
    const user = await storage.createUser(req.body);
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
```

**After (new structure):**

1. **Repository** (`repositories/user.repository.ts`):
```typescript
async create(userData: any): Promise<SafeUser> {
  const result = await this.executeProcedure('sp_CreateUser', userData);
  return this.mapToSafeUser(result[0]);
}
```

2. **Service** (`services/user.service.ts`):
```typescript
async createUser(userData: any): Promise<SafeUser> {
  const existingUser = await this.userRepository.findByEmail(userData.email);
  if (existingUser) {
    throw new AppError('User already exists', 409);
  }
  return await this.userRepository.create(userData);
}
```

3. **Controller** (`controllers/user.controller.ts`):
```typescript
createUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await this.userService.createUser(req.body);
  return ApiResponse.created(res, { user });
});
```

4. **Route** (`routes/user.routes.ts`):
```typescript
router.post('/', 
  requireRoles('super_admin', 'admin'),
  validateBody(insertUserSchema),
  userController.createUser
);
```

## Testing

### Test the New Structure

```bash
# 1. Start the server
npm run dev

# 2. Test authentication
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'

# 3. Test user endpoints
curl http://localhost:3000/api/users \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE"

# 4. Test health check
curl http://localhost:3000/api/health
```

## Benefits of New Architecture

1. **Clear Separation of Concerns**
   - Each layer has a specific responsibility
   - Easy to understand and maintain

2. **Better Error Handling**
   - Centralized error handling
   - Consistent error responses

3. **Improved Testability**
   - Each layer can be tested independently
   - Easy to mock dependencies

4. **Scalability**
   - Easy to add new features
   - Reusable components

5. **Type Safety**
   - TypeScript interfaces for all layers
   - Compile-time error checking

6. **Logging**
   - Structured logging throughout
   - Easy to debug issues

## Next Steps

1. ✅ Architecture implemented
2. ⏳ Migrate remaining routes from old `routes.ts`
3. ⏳ Create repositories for all entities
4. ⏳ Create services for all business logic
5. ⏳ Add comprehensive validation
6. ⏳ Add unit tests
7. ⏳ Add API documentation

## Need Help?

- See `ARCHITECTURE.md` for detailed architecture documentation
- Check existing controllers/services for examples
- Follow the "Adding New Features" guide above

---

**Migration Status**: ✅ Core architecture complete - Ready for feature migration
