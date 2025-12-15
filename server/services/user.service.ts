import { UserRepository } from '../repositories/user.repository';
import { SafeUser } from '@shared/schema';
import { AppError } from '../middleware/error.middleware';
import { logger } from '../utils/logger';

export class UserService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async getAllUsers(companyId?: string): Promise<SafeUser[]> {
    try {
      return await this.userRepository.findAll(companyId);
    } catch (error) {
      logger.error('Failed to get users', { companyId, error });
      throw new AppError('Failed to retrieve users', 500);
    }
  }

  async getUserById(id: string): Promise<SafeUser> {
    try {
      const user = await this.userRepository.findById(id);
      
      if (!user) {
        throw new AppError('User not found', 404);
      }

      return user;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Failed to get user', { id, error });
      throw new AppError('Failed to retrieve user', 500);
    }
  }

  async createUser(userData: any): Promise<SafeUser> {
    try {
      // Check if user already exists
      const existingUser = await this.userRepository.findByEmail(userData.email);
      
      if (existingUser) {
        throw new AppError('User with this email already exists', 409);
      }

      const user = await this.userRepository.create(userData);
      
      logger.info('User created successfully', { userId: user.id, email: user.email });
      
      return user;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Failed to create user', { email: userData.email, error });
      throw new AppError('Failed to create user', 500);
    }
  }

  async updateUser(id: string, userData: any): Promise<SafeUser> {
    try {
      // Check if user exists
      const existingUser = await this.userRepository.findById(id);
      
      if (!existingUser) {
        throw new AppError('User not found', 404);
      }

      // If email is being changed, check if new email is already in use
      if (userData.email && userData.email !== existingUser.email) {
        const emailExists = await this.userRepository.findByEmail(userData.email);
        if (emailExists) {
          throw new AppError('Email already in use', 409);
        }
      }

      const user = await this.userRepository.update(id, userData);
      
      logger.info('User updated successfully', { userId: id });
      
      return user;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Failed to update user', { id, error });
      throw new AppError('Failed to update user', 500);
    }
  }

  async deleteUser(id: string): Promise<void> {
    try {
      const user = await this.userRepository.findById(id);
      
      if (!user) {
        throw new AppError('User not found', 404);
      }

      await this.userRepository.delete(id);
      
      logger.info('User deleted successfully', { userId: id });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Failed to delete user', { id, error });
      throw new AppError('Failed to delete user', 500);
    }
  }
}
