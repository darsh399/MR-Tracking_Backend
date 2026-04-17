import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { permit } from '../middleware/roleMiddleware.js';
import { addVisit, getVisitHistory } from '../controller/VisitController.js';

const router = express.Router();

router.use(authMiddleware);
router.post('/', permit('mr'), addVisit);
router.get('/history', permit('mr', 'admin'), getVisitHistory);

export default router;
