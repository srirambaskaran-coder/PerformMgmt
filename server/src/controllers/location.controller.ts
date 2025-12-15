import { Request, Response } from 'express';
import { LocationService } from '../services/location.service';
import { ApiResponse } from '../utils/response';
import { asyncHandler } from '../middleware/error.middleware';

export class LocationController {
  private locationService: LocationService;

  constructor() {
    this.locationService = new LocationService();
  }

  getAllLocations = asyncHandler(async (req: Request, res: Response) => {
    const companyId = req.query.companyId as string | undefined;
    const locations = await this.locationService.getAllLocations(companyId);
    return ApiResponse.success(res, locations);
  });

  getLocationById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const location = await this.locationService.getLocationById(id);
    return ApiResponse.success(res, location);
  });

  createLocation = asyncHandler(async (req: Request, res: Response) => {
    const location = await this.locationService.createLocation(req.body);
    return ApiResponse.created(res, location, 'Location created successfully');
  });

  updateLocation = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const location = await this.locationService.updateLocation(id, req.body);
    return ApiResponse.success(res, location, 'Location updated successfully');
  });

  deleteLocation = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await this.locationService.deleteLocation(id);
    return ApiResponse.success(res, null, 'Location deleted successfully');
  });
}
