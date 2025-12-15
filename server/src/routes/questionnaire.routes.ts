import { Router } from 'express';
import { QuestionnaireController } from '../controllers/questionnaire.controller';
import { isAuthenticated, requireRoles } from '../middleware/auth.middleware';

const router = Router();
const controller = new QuestionnaireController();

router.get('/', isAuthenticated, controller.getAllQuestionnaires);
router.get('/published', isAuthenticated, controller.getPublishedQuestionnaires);
router.get('/:id', isAuthenticated, controller.getQuestionnaireById);
router.post('/', requireRoles('admin', 'super_admin', 'hr_manager'), controller.createQuestionnaire);
router.post('/publish', requireRoles('admin', 'super_admin', 'hr_manager'), controller.publishQuestionnaire);
router.put('/:id', requireRoles('admin', 'super_admin', 'hr_manager'), controller.updateQuestionnaire);
router.delete('/:id', requireRoles('admin', 'super_admin'), controller.deleteQuestionnaire);

export default router;
