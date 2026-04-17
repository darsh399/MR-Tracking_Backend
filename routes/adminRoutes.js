import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { permit } from '../middleware/roleMiddleware.js';
import { getDashboardStats, getAdminVisits } from '../controller/AdminController.js';

const router = express.Router();

router.use(authMiddleware, permit('admin'));
router.get('/dashboard', getDashboardStats);
router.get('/visits', getAdminVisits);

export default router;
