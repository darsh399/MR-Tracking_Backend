import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { permit } from '../middleware/roleMiddleware.js';
import {
  addDoctor,
  getDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor,
} from '../controller/DoctorController.js';

const router = express.Router();

router.use(authMiddleware);
router.get('/', getDoctors);
router.get('/:id', getDoctorById);
router.post('/', permit('mr', 'admin'), addDoctor);
router.put('/:id', permit('mr', 'admin'), updateDoctor);
router.delete('/:id', permit('mr', 'admin'), deleteDoctor);

export default router;
