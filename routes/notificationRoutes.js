import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../controller/NotificationController.js';

const router = express.Router();
router.use(authMiddleware);
router.get('/', getNotifications);
router.put('/:id/read', markNotificationRead);
router.put('/read-all', markAllNotificationsRead);

export default router;
