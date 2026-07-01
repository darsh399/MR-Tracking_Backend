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
  updateUser,
  requestPasswordReset,
  resetPasswordWithToken,
  resetPasswordWithOtp,
  verifyOtp,
  resendOtp,
  resendPasswordResetOtp,
} from '../controller/AuthController.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/invite', authMiddleware, permit('admin', 'companyOwner', 'hr', 'hrManager', 'projectManager'), registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.get('/me', authMiddleware, getCurrentUser);
router.patch('/update-user', authMiddleware, updateUser);
router.get('/user/:id', authMiddleware, permit('admin', 'companyOwner', 'hr', 'hrManager', 'projectManager', 'mr', 'employee'), getUserById);
router.get('/users', authMiddleware, permit('admin', 'companyOwner', 'hr', 'hrManager', 'projectManager', 'mr', 'employee'), getAllUsers);
router.put('/approve/:id', authMiddleware, permit('admin', 'companyOwner', 'hr', 'hrManager'), approveUser);
router.put('/user/:id/status', authMiddleware, permit('admin', 'companyOwner', 'hr', 'hrManager'), toggleUserStatus);
router.delete('/user/:id', authMiddleware, deleteUser);
router.post('/password-reset', requestPasswordReset);
router.post('/password-reset/confirm', resetPasswordWithToken);
router.post('/password-reset/confirm-otp', resetPasswordWithOtp);
router.post('/password-reset/resend-otp', resendPasswordResetOtp);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);

export default router;
