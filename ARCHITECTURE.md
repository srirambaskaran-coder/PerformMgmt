# Backend Code Architecture

## Architecture Overview

The backend follows a **Layered Architecture** pattern with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────┐
│                    Client Request                        │
└────────────────────┬────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────┐
│                  Routes Layer                            │
│  - Route definitions                                     │
│  - Request validation                                    │
│  - Authentication/Authorization checks                   │
└────────────────────┬────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────┐
│                Controllers Layer                         │
│  - Handle HTTP requests/responses                        │
│  - Input validation                                      │
│  - Call services                                         │
│  - Format responses                                      │
└────────────────────┬────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────┐
│                 Services Layer                           │
│  - Business logic                                        │
│  - Data transformation                                   │
│  - Orchestrate repository calls                         │
│  - Error handling                                        │
└────────────────────┬────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────┐
│               Repositories Layer                         │
│  - Database access                                       │
│  - Data mapping                                          │
│  - Query execution                                       │
│  - Stored procedures                                     │
└────────────────────┬────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────┐
│                   Database (MSSQL)                       │
└─────────────────────────────────────────────────────────┘
```

## Directory Structure

```
server/
├── app.ts                      # Application entry point
├── index.ts                    # Server startup (legacy, use app.ts)
├── config/                     # Configuration files
│   ├── cors.config.ts         # CORS settings per environment
│   └── database.config.ts     # Database configuration
├── controllers/                # HTTP request handlers
│   ├── auth.controller.ts     # Authentication endpoints
│   ├── user.controller.ts     # User management endpoints
│   └── ...                    # Other controllers
├── services/                   # Business logic layer
│   ├── auth.service.ts        # Authentication logic
│   ├── user.service.ts        # User management logic
│   └── ...                    # Other services
├── repositories/               # Data access layer
│   ├── base.repository.ts     # Base repository with common methods
│   ├── user.repository.ts     # User data access
│   └── ...                    # Other repositories
├── middleware/                 # Express middleware
│   ├── auth.middleware.ts     # Authentication/authorization
│   ├── error.middleware.ts    # Error handling
│   └── validation.middleware.ts # Request validation
├── routes/                     # Route definitions
│   ├── index.ts               # Main router
│   ├── auth.routes.ts         # Auth routes
│   ├── user.routes.ts         # User routes
│   └── ...                    # Other routes
├── utils/                      # Utility functions
│   ├── logger.ts              # Logging utility
│   └── response.ts            # API response helper
└── validators/                 # Custom validators
```

## Layer Responsibilities

### 1. Routes Layer (`routes/`)
**Purpose**: Define API endpoints and apply middleware

**Responsibilities**:
- Define route paths
- Apply authentication middleware
- Apply authorization middleware
- Apply validation middleware
- Map routes to controllers

**Example**:
```typescript
router.post(
  '/login',
  validateBody(loginSchema),
  authController.login
);
```

### 2. Controllers Layer (`controllers/`)
**Purpose**: Handle HTTP requests and responses

**Responsibilities**:
- Receive HTTP requests
- Extract data from request (body, params, query)
- Call appropriate service methods
- Format and send responses
- Handle HTTP-specific logic

**Example**:
```typescript
export class UserController {
  private userService: UserService;

  createUser = asyncHandler(async (req: Request, res: Response) => {
    const userData = req.body;
    const user = await this.userService.createUser(userData);
    return ApiResponse.created(res, { user }, 'User created successfully');
  });
}
```

### 3. Services Layer (`services/`)
**Purpose**: Implement business logic

**Responsibilities**:
- Business rules and validation
- Data transformation
- Orchestrate multiple repository calls
- Transaction management
- Error handling and logging

**Example**:
```typescript
export class UserService {
  private userRepository: UserRepository;

  async createUser(userData: any): Promise<SafeUser> {
    // Check if user exists
    const existingUser = await this.userRepository.findByEmail(userData.email);
    if (existingUser) {
      throw new AppError('User already exists', 409);
    }

    // Create user
    const user = await this.userRepository.create(userData);
    logger.info('User created', { userId: user.id });
    
    return user;
  }
}
```

### 4. Repositories Layer (`repositories/`)
**Purpose**: Data access and persistence

**Responsibilities**:
- Database queries
- Stored procedure calls
- Data mapping (DB ↔ Application models)
- Connection management

**Example**:
```typescript
export class UserRepository extends BaseRepository {
  async findByEmail(email: string): Promise<SafeUser | null> {
    const result = await this.executeProcedure<any>('sp_GetUserByEmail', { 
      Email: email 
    });
    return result.length > 0 ? this.mapToSafeUser(result[0]) : null;
  }
}
```

### 5. Middleware Layer (`middleware/`)
**Purpose**: Request/response processing

**Types**:
- **Authentication**: Verify user identity
- **Authorization**: Check permissions
- **Validation**: Validate request data
- **Error Handling**: Catch and format errors
- **Logging**: Log requests and responses

### 6. Utils Layer (`utils/`)
**Purpose**: Reusable utility functions

**Contents**:
- Logger
- Response formatter
- Date/time helpers
- String utilities
- etc.

## Key Design Patterns

### 1. Dependency Injection
Services are injected into controllers:
```typescript
export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }
}
```

### 2. Repository Pattern
Data access is abstracted through repositories:
```typescript
export class BaseRepository {
  protected async executeQuery<T>(query: string): Promise<T[]> {
    // Database access logic
  }
}
```

### 3. Service Layer Pattern
Business logic is separated from controllers:
```typescript
// Controller: HTTP handling
export class UserController {
  createUser = async (req, res) => {
    const user = await this.userService.createUser(req.body);
    return ApiResponse.created(res, { user });
  };
}

// Service: Business logic
export class UserService {
  async createUser(userData) {
    // Validation, business rules, etc.
    return await this.userRepository.create(userData);
  }
}
```

### 4. Error Handling Pattern
Centralized error handling:
```typescript
// Custom error class
export class AppError extends Error {
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

// Async wrapper
export const asyncHandler = (fn: Function) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Error middleware
export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({ message: err.message });
};
```

## Best Practices

### 1. Single Responsibility
Each layer has one specific job:
- Routes: Define endpoints
- Controllers: Handle HTTP
- Services: Business logic
- Repositories: Data access

### 2. Dependency Direction
Dependencies flow downward:
```
Routes → Controllers → Services → Repositories → Database
```

### 3. Error Handling
- Use `AppError` for expected errors
- Use `asyncHandler` to catch async errors
- Let error middleware handle all errors

### 4. Validation
- Validate at route level using middleware
- Re-validate in services for business rules
- Use Zod schemas for type-safe validation

### 5. Logging
- Log important operations in services
- Log errors with context
- Use structured logging

### 6. Response Format
Use consistent response format:
```typescript
{
  success: true,
  message: "Operation successful",
  data: { ... }
}
```

## Adding New Features

### To add a new entity (e.g., Company):

1. **Create Repository** (`repositories/company.repository.ts`):
```typescript
export class CompanyRepository extends BaseRepository {
  async findAll(): Promise<Company[]> {
    return await this.executeProcedure('sp_GetAllCompanies');
  }
}
```

2. **Create Service** (`services/company.service.ts`):
```typescript
export class CompanyService {
  private companyRepository: CompanyRepository;

  async getAllCompanies(): Promise<Company[]> {
    return await this.companyRepository.findAll();
  }
}
```

3. **Create Controller** (`controllers/company.controller.ts`):
```typescript
export class CompanyController {
  private companyService: CompanyService;

  getAllCompanies = asyncHandler(async (req, res) => {
    const companies = await this.companyService.getAllCompanies();
    return ApiResponse.success(res, { companies });
  });
}
```

4. **Create Routes** (`routes/company.routes.ts`):
```typescript
const router = Router();
const controller = new CompanyController();

router.get('/', isAuthenticated, controller.getAllCompanies);

export default router;
```

5. **Register Routes** (`routes/index.ts`):
```typescript
import companyRoutes from './company.routes';
router.use('/companies', companyRoutes);
```

## Migration from Old Code

The old `routes.ts` contains all logic in one file. To migrate:

1. **Extract route handlers** → Move to controllers
2. **Extract business logic** → Move to services
3. **Extract database calls** → Move to repositories
4. **Update routes** → Use new structure

Example migration:
```typescript
// Old (routes.ts)
app.post("/api/users", async (req, res) => {
  const user = await storage.createUser(req.body);
  res.json(user);
});

// New structure:
// routes/user.routes.ts
router.post('/', validateBody(schema), userController.createUser);

// controllers/user.controller.ts
createUser = asyncHandler(async (req, res) => {
  const user = await this.userService.createUser(req.body);
  return ApiResponse.created(res, { user });
});

// services/user.service.ts
async createUser(userData) {
  return await this.userRepository.create(userData);
}

// repositories/user.repository.ts
async create(userData) {
  return await this.executeProcedure('sp_CreateUser', userData);
}
```

## Benefits of This Architecture

1. **Maintainability**: Easy to find and fix bugs
2. **Testability**: Each layer can be tested independently
3. **Scalability**: Easy to add new features
4. **Reusability**: Services and repositories can be reused
5. **Clarity**: Clear separation of concerns
6. **Flexibility**: Easy to swap implementations

## Next Steps

1. Migrate remaining routes from old `routes.ts` to new structure
2. Create repositories for all entities
3. Create services for all business logic
4. Create controllers for all endpoints
5. Add comprehensive error handling
6. Add input validation
7. Add unit tests for each layer
