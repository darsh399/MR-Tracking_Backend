import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import companyMiddleware from '../middleware/companyMiddleware.js';
import { permit } from '../middleware/roleMiddleware.js';
import { addVisit, getVisitHistory } from '../controller/VisitController.js';

const router = express.Router();

router.use(authMiddleware, companyMiddleware);
router.post('/', permit('mr'), addVisit);
router.get('/history', permit('mr', 'admin'), getVisitHistory);

export default router;
