import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import companyMiddleware from '../middleware/companyMiddleware.js';
import { permit } from '../middleware/roleMiddleware.js';
import { requestLeave, getLeaveRequests, updateLeaveRequest, downloadAttachment } from '../controller/LeaveController.js';
import upload from '../configue/multer.js';

const router = express.Router();

router.use(authMiddleware, companyMiddleware);
router.post('/request', upload.array('attachment', 10), requestLeave);
router.get('/my-requests', getLeaveRequests);
router.put('/request/:id', permit('admin'), updateLeaveRequest);
router.get('/download/:leaveRequestId/:attachmentIndex', downloadAttachment);

export default router;
