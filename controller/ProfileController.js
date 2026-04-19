import fs from 'fs';
import multer from 'multer';
import Profile from '../model/ProfileModel.js';
import User from '../model/DataModel.js';
import path from 'path';
import hashPassword from '../utils/HashPassword.js';
import bcrypt from 'bcrypt';
import sendEmail from '../utils/sendEmail.js';
import { passwordResetConfirmationTemplate } from '../configue/mailFormat.js';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/profiles';
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${req.user.id}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    cb(null, allowedTypes.includes(file.mimetype));
  },
}).fields([
  { name: 'salarySlips', maxCount: 4 },
  { name: 'offerLetters', maxCount: 2 },
  { name: 'relievingLetters', maxCount: 2 },
]);

export const uploadProfileDocs = (req, res, next) => {
  upload(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message || 'File upload failed' });
    }
    next();
  });
};

const buildExperienceMonths = (years, months) => {
  const parsedYears = Number(years) || 0;
  const parsedMonths = Number(months) || 0;
  return parsedYears * 12 + parsedMonths;
};

export const submitProfile = async (req, res) => {
  try {
    const {
      aadharNumber,
      panNumber,
      bloodGroup,
      city,
      state,
      pincode,
      emergencyContact,
      joiningDate,
      department,
      experienceType,
      previousCompany,
      experienceYears,
      experienceMonths,
    } = req.body;
    const role = req.user.role;

    const existingProfile = await Profile.findOne({ user: req.user.id });
    if (existingProfile) {
      return res.status(400).json({ message: 'Profile already completed' });
    }

    const totalExperienceMonths = experienceType === 'experienced'
      ? buildExperienceMonths(experienceYears, experienceMonths)
      : 0;

    const employeeId = `EMP${Date.now()}`;

    const documents = {
      salarySlips: req.files.salarySlips?.map((file) => file.path) || [],
      offerLetters: req.files.offerLetters?.map((file) => file.path) || [],
      relievingLetters: req.files.relievingLetters?.map((file) => file.path) || [],
    };

    const profile = new Profile({
      user: req.user.id,
      aadharNumber,
      panNumber,
      bloodGroup,
      address: { city, state, pincode },
      emergencyContact,
      employeeId,
      role,
      joiningDate,
      department,
      experienceType,
      previousCompany: experienceType === 'experienced' ? previousCompany : '',
      totalExperienceMonths,
      documents,
      leaveBalance: { sick: 12, casual: 10, maternity: role === 'admin' ? 180 : 180 },
      leaveBalanceLastUpdated: new Date(),
    });

    await profile.save();
    await User.findByIdAndUpdate(req.user.id, { profileCompleted: true });

    res.status(201).json({ message: 'Profile completed successfully', profile });
  } catch (error) {
    console.error('Submit profile error:', error.message || error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getProfile = async (req, res) => {
  try {
    let profile = await Profile.findOne({ user: req.user.id });
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    await profile.populate('user', 'userName email role companyName');
    res.status(200).json({ profile });
  } catch (error) {
    console.error('Fetch profile error:', error.message || error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateLeaveBalance = async (req, res) => {
  try {
    const { sick, casual, maternity } = req.body;
    const profile = await Profile.findOne({ user: req.user.id });
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    profile.leaveBalance = {
      sick: sick ?? profile.leaveBalance.sick,
      casual: casual ?? profile.leaveBalance.casual,
      maternity: maternity ?? profile.leaveBalance.maternity,
    };
    await profile.save();
    res.status(200).json({ profile });
  } catch (error) {
    console.error('Update leave balance error:', error.message || error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


export const resetPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

   
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

   
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({ message: 'New password must be different from current password' });
    }

    user.password = await hashPassword(newPassword);
    await user.save();

   
    sendEmail(
      user.email,
      "Security Alert: Your password was changed",
      passwordResetConfirmationTemplate(user.userName)
    ).catch(err => console.error("Email error:", err));

    res.status(200).json({ message: 'Password reset successful' });

  } catch (error) {
    console.error('Reset password error:', error.message || error);
    res.status(500).json({ message: 'Internal server error' });
  }
};