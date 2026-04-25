import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { permit } from '../middleware/roleMiddleware.js';
import {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  approveUser,
  getAllUsers,
  toggleUserStatus,
  deleteUser,
  getUserById,
  updateUser
} from '../controller/AuthController.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.get('/me', authMiddleware, getCurrentUser);
router.patch('/update-user',authMiddleware, updateUser);
router.get('/user/:id', authMiddleware, permit('admin'), getUserById);
router.get('/users', authMiddleware, permit('admin'), getAllUsers);
router.put('/approve/:id', authMiddleware, permit('admin'), approveUser);
router.put('/user/:id/status', authMiddleware, permit('admin'), toggleUserStatus);
router.delete('/user/:id', authMiddleware, deleteUser);

export default router;
