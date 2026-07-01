import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import companyMiddleware from '../middleware/companyMiddleware.js';
import { enforceOnboardingComplete } from '../middleware/onboardingMiddleware.js';
import { permit } from '../middleware/roleMiddleware.js';
import { addVisit, getVisitHistory } from '../controller/VisitController.js';

const router = express.Router();

router.use(authMiddleware, companyMiddleware);
router.post(
  '/',
  enforceOnboardingComplete,
  permit('mr', 'admin', 'companyOwner', 'hr', 'hrManager', 'projectManager', 'employee'),
  addVisit
);
router.get('/history', permit('mr', 'admin', 'companyOwner', 'hr', 'hrManager', 'projectManager', 'employee'), getVisitHistory);

export default router;
