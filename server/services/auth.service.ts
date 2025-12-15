import { UserRepository } from '../repositories/user.repository';
import { SafeUser } from '@shared/schema';
import { AppError } from '../middleware/error.middleware';
import { logger } from '../utils/logger';

export class AuthService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async login(email: string, password: string): Promise<SafeUser> {
    try {
      // Validate input
      if (!email || !password) {
        throw new AppError('Email and password are required', 400);
      }

      // Find user by email
      const user = await this.userRepository.findByEmail(email);
      
      if (!user) {
        throw new AppError('Invalid credentials', 401);
      }

      // Verify password
      const isPasswordValid = await this.userRepository.verifyPassword(email, password);
      
      if (!isPasswordValid) {
        throw new AppError('Invalid credentials', 401);
      }

      // Check if user is active
      if (user.status !== 'active') {
        throw new AppError('Account is not active', 403);
      }

      logger.info('User logged in successfully', { userId: user.id, email: user.email });
      
      return user;
    } catch (error) {
      logger.error('Login failed', { email, error });
      throw error;
    }
  }

  async getCurrentUser(userId: string): Promise<SafeUser> {
    try {
      const user = await this.userRepository.findById(userId);
      
      if (!user) {
        throw new AppError('User not found', 404);
      }

      return user;
    } catch (error) {
      logger.error('Failed to get current user', { userId, error });
      throw error;
    }
  }

  async logout(userId: string): Promise<void> {
    logger.info('User logged out', { userId });
  }
}
