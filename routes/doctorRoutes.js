import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import companyMiddleware from '../middleware/companyMiddleware.js';
import { enforceOnboardingComplete } from '../middleware/onboardingMiddleware.js';
import { permit } from '../middleware/roleMiddleware.js';
import {
  addDoctor,
  getDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor,
} from '../controller/DoctorController.js';

const router = express.Router();

router.use(authMiddleware, companyMiddleware);
router.get('/', getDoctors);
router.get('/:id', getDoctorById);
router.post('/', enforceOnboardingComplete, permit('mr', 'admin', 'employee'), addDoctor);
router.put('/:id', enforceOnboardingComplete, permit('mr', 'admin'), updateDoctor);
router.delete('/:id', enforceOnboardingComplete, permit('mr', 'admin'), deleteDoctor);

export default router;
