import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { uploadProfileDocs, resetPassword, submitProfile, getProfile, updateLeaveBalance } from '../controller/ProfileController.js';

const router = express.Router();

router.use(authMiddleware);
router.post('/complete', uploadProfileDocs, submitProfile);
router.put('/reset-password', resetPassword);
router.get('/me', getProfile);
router.put('/leave-balance', updateLeaveBalance);

export default router;
