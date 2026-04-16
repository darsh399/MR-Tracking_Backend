import { createUser,userStatusUpdate, getUserById,deleteUser, logoutUser, getAllUsers, updateUser, loginUser, getCurrentUser } from "../controller/DataController.js";
import UserSchema from "../schemas/userSchemas.js";
import express from 'express';
import validate from "../middleware/Validate.js";
import authMiddleware from "../middleware/authMiddleware.js";
const router = express.Router();

const UpdateUserSchema = UserSchema.partial();
router.get('/user/:id', authMiddleware, getUserById);
router.post('/register', validate(UserSchema), createUser);
router.get('/me',authMiddleware, getCurrentUser);
router.put('/user/:id',authMiddleware, validate(UpdateUserSchema), updateUser);
router.post('/login', loginUser);
router.put('/user/:id/status', authMiddleware, userStatusUpdate);
router.get('/users', authMiddleware, getAllUsers);
router.post('/logout', authMiddleware, logoutUser);
router.delete('/user/:id', authMiddleware, deleteUser);
export default router; 