import { Router } from 'express';
import { LocationController } from '../controllers/location.controller';
import { isAuthenticated, requireRoles } from '../middleware/auth.middleware';

const router = Router();
const controller = new LocationController();

router.get('/', isAuthenticated, controller.getAllLocations);
router.get('/:id', isAuthenticated, controller.getLocationById);
router.post('/', requireRoles('admin', 'super_admin'), controller.createLocation);
router.put('/:id', requireRoles('admin', 'super_admin'), controller.updateLocation);
router.delete('/:id', requireRoles('admin', 'super_admin'), controller.deleteLocation);

export default router;
