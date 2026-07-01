import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import companyMiddleware from '../middleware/companyMiddleware.js';
import { permit } from '../middleware/roleMiddleware.js';
import { getDashboardStats, getAdminVisits, sendCompanyEmailToAll } from '../controller/AdminController.js';
import { deleteUser } from '../controller/AuthController.js';
const router = express.Router();

router.use(authMiddleware, companyMiddleware, permit('admin', 'companyOwner', 'hr', 'hrManager'));
router.get('/dashboard', getDashboardStats);
router.get('/visits', getAdminVisits);
router.post('/send-mail-all', sendCompanyEmailToAll);
router.delete('/user/:id', deleteUser);

export default router;
