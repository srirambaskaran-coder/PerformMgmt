-- Direct SQL method to create users
USE [PMS_DB];
GO

-- Create admin user directly
DECLARE @AdminId UNIQUEIDENTIFIER = NEWID();
DECLARE @CompanyId UNIQUEIDENTIFIER = NEWID();

-- Insert company first
INSERT INTO dbo.companies (id, name, email, status, created_at, updated_at)
VALUES (@CompanyId, 'My Company', 'info@mycompany.com', 'active', SYSDATETIME(), SYSDATETIME());

-- Insert admin user (password hash for 'Admin123!')
INSERT INTO dbo.users (
    id, email, first_name, last_name, role, status, code, 
    password_hash, company_id, created_at, updated_at
)
VALUES (
    @AdminId,
    'admin@mycompany.com',
    'System',
    'Administrator', 
    'super_admin',
    'active',
    'ADMIN001',
    '$2b$10$YourHashedPasswordHere', -- You'll need to generate this
    @CompanyId,
    SYSDATETIME(),
    SYSDATETIME()
);

-- Verify the user was created
SELECT 
    email,
    first_name,
    last_name,
    role,
    status,
    code
FROM dbo.users 
WHERE email = 'admin@mycompany.com';

PRINT 'Admin user created successfully!';
PRINT 'Email: admin@mycompany.com';
PRINT 'You will need to set a password through the application.';