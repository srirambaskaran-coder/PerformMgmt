import { storage } from './storage';

// Test users for each role
const testUsers = [
  {
    id: 'super-admin-test',
    email: 'superadmin@example.com',
    firstName: 'Super',
    lastName: 'Admin',
    role: 'super_admin' as const,
    code: 'SA001',
    designation: 'System Administrator',
    department: 'IT',
    status: 'active' as const,
  },
  {
    id: 'admin-test',
    email: 'admin@example.com',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin' as const,
    code: 'AD001',
    designation: 'Administrator',
    department: 'Management',
    status: 'active' as const,
  },
  {
    id: 'hr-manager-test',
    email: 'hrmanager@example.com',
    firstName: 'HR',
    lastName: 'Manager',
    role: 'hr_manager' as const,
    code: 'HR001',
    designation: 'HR Manager',
    department: 'Human Resources',
    status: 'active' as const,
  },
  {
    id: 'manager-test',
    email: 'manager@example.com',
    firstName: 'Team',
    lastName: 'Manager',
    role: 'manager' as const,
    code: 'MG001',
    designation: 'Team Lead',
    department: 'Engineering',
    status: 'active' as const,
  },
  {
    id: 'employee-test',
    email: 'employee@example.com',
    firstName: 'Regular',
    lastName: 'Employee',
    role: 'employee' as const,
    code: 'EMP001',
    designation: 'Software Developer',
    department: 'Engineering',
    reportingManagerId: 'manager-test',
    status: 'active' as const,
  }
];

export async function seedTestUsers() {
  console.log('🌱 Seeding test users...');
  
  for (const user of testUsers) {
    try {
      // Check if user already exists
      const existingUser = await storage.getUser(user.id);
      if (existingUser) {
        console.log(`✓ User ${user.email} already exists`);
        continue;
      }
      
      // Create new user
      await storage.upsertUser(user);
      console.log(`✓ Created ${user.role}: ${user.email}`);
    } catch (error) {
      console.error(`✗ Failed to create user ${user.email}:`, error);
    }
  }
  
  console.log('🎉 User seeding completed!');
  console.log('\n📝 Test Accounts Created:');
  testUsers.forEach(user => {
    console.log(`   ${user.role.toUpperCase()}: ${user.email} (${user.firstName} ${user.lastName})`);
  });
}

// Export test users for reference
export { testUsers };