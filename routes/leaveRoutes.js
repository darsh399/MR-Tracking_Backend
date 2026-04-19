import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { permit } from '../middleware/roleMiddleware.js';
import { requestLeave, getLeaveRequests, updateLeaveRequest } from '../controller/LeaveController.js';

const router = express.Router();

router.use(authMiddleware);
router.post('/request', requestLeave);
router.get('/my-requests', getLeaveRequests);
router.put('/request/:id', permit('admin'), updateLeaveRequest);

export default router;
