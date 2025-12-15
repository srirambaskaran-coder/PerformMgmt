import { storage } from '../lib/storage';
import { AppError } from '../middleware/error.middleware';
import { logger } from '../utils/logger';

export class LocationService {
  async getAllLocations(companyId?: string) {
    try {
      return await storage.getAllLocations(companyId);
    } catch (error) {
      logger.error('Failed to get locations', { companyId, error });
      throw new AppError('Failed to retrieve locations', 500);
    }
  }

  async getLocationById(locationId: string) {
    try {
      const location = await storage.getLocationById(locationId);
      if (!location) {
        throw new AppError('Location not found', 404);
      }
      return location;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Failed to get location', { locationId, error });
      throw new AppError('Failed to retrieve location', 500);
    }
  }

  async createLocation(data: any) {
    try {
      return await storage.createLocation(data);
    } catch (error) {
      logger.error('Failed to create location', { data, error });
      throw new AppError('Failed to create location', 500);
    }
  }

  async updateLocation(locationId: string, data: any) {
    try {
      await this.getLocationById(locationId); // Check exists
      return await storage.updateLocation(locationId, data);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Failed to update location', { locationId, data, error });
      throw new AppError('Failed to update location', 500);
    }
  }

  async deleteLocation(locationId: string) {
    try {
      await this.getLocationById(locationId); // Check exists
      return await storage.deleteLocation(locationId);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Failed to delete location', { locationId, error });
      throw new AppError('Failed to delete location', 500);
    }
  }
}
