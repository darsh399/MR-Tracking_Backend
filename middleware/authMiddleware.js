import jwt from 'jsonwebtoken';
import User from '../model/DataModel.js';

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1] || req.cookies?.token;
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decodedToken.id).lean();

    if (!user) {
      return res.status(401).json({ message: 'Invalid token: user not found' });
    }

    if (!user.approved) {
      return res.status(403).json({ message: 'Account awaiting admin approval' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Account is deactivated' });
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
      isAdmin: user.isAdmin,
      name: user.userName,
      mobileNo: user.mobileNo,
      role: user.role,
      companyName: user.companyName,
      profileCompleted: user.profileCompleted,
      approved: user.approved,
      isActive: user.isActive,
    };
    next();
  } catch (error) {
    console.error('Authentication error:', error.message || error);
    res.status(401).json({ message: 'Unauthorized' });
  }
};

export default authMiddleware;