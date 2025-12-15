import { Router } from 'express';
import { CompanyController } from '../controllers/company.controller';
import { isAuthenticated, requireRoles } from '../middleware/auth.middleware';

const router = Router();
const controller = new CompanyController();

router.get('/', isAuthenticated, controller.getAllCompanies);
router.get('/:id', isAuthenticated, controller.getCompanyById);
router.post('/', requireRoles('super_admin', 'admin'), controller.createCompany);
router.put('/:id', requireRoles('super_admin', 'admin'), controller.updateCompany);
router.delete('/:id', requireRoles('super_admin'), controller.deleteCompany);

export default router;
