import { BaseRepository } from './base.repository';
import { SafeUser } from '@shared/schema';
import bcrypt from 'bcrypt';

export class UserRepository extends BaseRepository {
  async findByEmail(email: string): Promise<SafeUser | null> {
    const result = await this.executeProcedure<any>('sp_GetUserByEmail', { 
      Email: email 
    });
    
    return result.length > 0 ? this.mapToSafeUser(result[0]) : null;
  }

  async findById(id: string): Promise<SafeUser | null> {
    const result = await this.executeProcedure<any>('sp_GetUserById', { 
      UserId: id 
    });
    
    return result.length > 0 ? this.mapToSafeUser(result[0]) : null;
  }

  async findAll(companyId?: string): Promise<SafeUser[]> {
    const result = await this.executeProcedure<any>('sp_GetAllUsers', {
      CompanyId: companyId || null
    });
    
    return result.map(user => this.mapToSafeUser(user));
  }

  async create(userData: any): Promise<SafeUser> {
    // Hash password before storing
    if (userData.password) {
      const salt = await bcrypt.genSalt(10);
      userData.password = await bcrypt.hash(userData.password, salt);
    }

    const result = await this.executeProcedure<any>('sp_CreateUser', {
      Email: userData.email,
      Password: userData.password,
      FirstName: userData.firstName,
      LastName: userData.lastName,
      Role: userData.role,
      CompanyId: userData.companyId,
      DepartmentId: userData.departmentId,
      LocationId: userData.locationId,
      ManagerId: userData.managerId,
    });

    return this.mapToSafeUser(result[0]);
  }

  async update(id: string, userData: any): Promise<SafeUser> {
    // Hash password if it's being updated
    if (userData.password) {
      const salt = await bcrypt.genSalt(10);
      userData.password = await bcrypt.hash(userData.password, salt);
    }

    const result = await this.executeProcedure<any>('sp_UpdateUser', {
      UserId: id,
      Email: userData.email,
      FirstName: userData.firstName,
      LastName: userData.lastName,
      Role: userData.role,
      DepartmentId: userData.departmentId,
      LocationId: userData.locationId,
      ManagerId: userData.managerId,
      ...(userData.password && { Password: userData.password }),
    });

    return this.mapToSafeUser(result[0]);
  }

  async delete(id: string): Promise<void> {
    await this.executeProcedure('sp_DeleteUser', { UserId: id });
  }

  async verifyPassword(email: string, password: string): Promise<boolean> {
    const result = await this.executeQuery<{ password: string }>(
      'SELECT password FROM users WHERE email = @email',
      { email }
    );

    if (result.length === 0) {
      return false;
    }

    return bcrypt.compare(password, result[0].password);
  }

  private mapToSafeUser(dbUser: any): SafeUser {
    return {
      id: dbUser.id,
      email: dbUser.email,
      firstName: dbUser.firstName,
      lastName: dbUser.lastName,
      role: dbUser.role,
      roles: dbUser.roles ? JSON.parse(dbUser.roles) : [dbUser.role],
      companyId: dbUser.companyId,
      departmentId: dbUser.departmentId,
      locationId: dbUser.locationId,
      managerId: dbUser.managerId,
      status: dbUser.status,
      createdAt: dbUser.createdAt,
      updatedAt: dbUser.updatedAt,
    };
  }
}
