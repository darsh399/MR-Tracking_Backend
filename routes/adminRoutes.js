import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import companyMiddleware from '../middleware/companyMiddleware.js';
import { permit } from '../middleware/roleMiddleware.js';
import { getDashboardStats, getAdminVisits, sendCompanyEmailToAll } from '../controller/AdminController.js';

const router = express.Router();

router.use(authMiddleware, companyMiddleware, permit('admin'));
router.get('/dashboard', getDashboardStats);
router.get('/visits', getAdminVisits);
router.post('/send-mail-all', sendCompanyEmailToAll);

export default router;
