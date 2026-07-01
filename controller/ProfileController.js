import fs from 'fs';
import multer from 'multer';
import Profile from '../model/ProfileModel.js';
import User from '../model/DataModel.js';
import mongoose from 'mongoose';
import path from 'path';
import hashPassword from '../utils/HashPassword.js';
import bcrypt from 'bcrypt';
import sendEmail from '../utils/sendEmail.js';
import { passwordResetConfirmationTemplate } from '../configue/mailFormat.js';
import { accrueLeaveBalance } from './LeaveController.js';

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

const normalizeManagerRef = async (value, companyName) => {
  if (!value) return null;
  if (mongoose.Types.ObjectId.isValid(value)) {
    const managerProfile = await Profile.findOne({ _id: value, companyName }).lean();
    return managerProfile?._id || null;
  }
  return null;
};

const populateManagerMeta = async (profile) => {
  if (!profile?.reportsTo) return profile;
  const managerProfile = await Profile.findById(profile.reportsTo).populate('user', 'userName').lean();
  if (!managerProfile) return profile;
  return {
    ...profile,
    managerName: managerProfile.user?.userName || managerProfile.managerName || '',
    managerDesignation: managerProfile.designation || managerProfile.role || '',
    managerEmployeeId: managerProfile.employeeId || '',
    managerUserId: managerProfile.user?._id || managerProfile.user || '',
  };
};

const getDefaultManagerId = async (targetRole, companyName, excludeProfileId = null) => {
  if (!targetRole || targetRole === 'companyOwner') return null;

  const managerRoles = ['companyOwner', 'admin', 'hrManager', 'hr'];
  const rolePriority = {
    companyOwner: 0,
    admin: 1,
    hrManager: 2,
    hr: 3,
  };
  const query = {
    companyName,
    role: { $in: managerRoles },
  };

  if (excludeProfileId) {
    query._id = { $ne: excludeProfileId };
  }

  const candidates = await Profile.find(query).populate('user', 'userName role').lean();
  if (!candidates?.length) return null;

  candidates.sort((a, b) => {
    const roleA = a.user?.role || a.role;
    const roleB = b.user?.role || b.role;
    return (rolePriority[roleA] ?? 99) - (rolePriority[roleB] ?? 99);
  });

  return candidates[0]?._id || null;
};

export const submitProfile = async (req, res) => {
  try {
    const {
      userName,
      mobileNo,
      employeeId,
      department,
      aadharNumber,
      panNumber,
      bloodGroup,
      city,
      state,
      pincode,
      emergencyContact,
      joiningDate,
      designation,
      experienceType = 'fresher',
      previousCompany,
      experienceYears,
      experienceMonths,
      reportsTo,
    } = req.body;
    const role = req.user.role;
    const isCompanyOwner = role === 'companyOwner';
    const displayName = userName?.trim() || req.user.userName || req.user.email;

    const existingProfile = await Profile.findOne({ user: req.user.id });
    if (existingProfile) {
      return res.status(400).json({ message: 'Profile already completed' });
    }

    if (isCompanyOwner && !mobileNo?.trim()) {
      return res.status(400).json({ message: 'Mobile number is required for company owner onboarding' });
    }

    const totalExperienceMonths = isCompanyOwner
      ? 0
      : experienceType === 'experienced'
        ? buildExperienceMonths(experienceYears, experienceMonths)
        : 0;

    const newEmployeeId = employeeId?.trim() || `EMP${Date.now()}`;
    const resolvedReportsTo = reportsTo
      ? await normalizeManagerRef(reportsTo, req.user.companyName)
      : await getDefaultManagerId(role, req.user.companyName);

    const documents = {
      salarySlips: req.files.salarySlips?.map((file) => file.path) || [],
      offerLetters: req.files.offerLetters?.map((file) => file.path) || [],
      relievingLetters: req.files.relievingLetters?.map((file) => file.path) || [],
    };

    const profile = new Profile({
      user: req.user.id,
      companyName: req.user.companyName,
      aadharNumber: isCompanyOwner ? '' : aadharNumber,
      panNumber: isCompanyOwner ? '' : panNumber,
      bloodGroup: isCompanyOwner ? '' : bloodGroup,
      address: {
        city: isCompanyOwner ? '' : city,
        state: isCompanyOwner ? '' : state,
        pincode: isCompanyOwner ? '' : pincode,
      },
      emergencyContact: emergencyContact?.trim() || '',
      employeeId: newEmployeeId,
      role,
      joiningDate: joiningDate ? new Date(joiningDate) : req.user.joiningDate || new Date(),
      department: isCompanyOwner ? 'Company Owner' : department,
      designation: designation?.trim() || '',
      experienceType: isCompanyOwner ? 'fresher' : experienceType,
      previousCompany: isCompanyOwner ? '' : (experienceType === 'experienced' ? previousCompany : ''),
      totalExperienceMonths,
      reportsTo: resolvedReportsTo,
      documents,
      leaveBalance: { sick: 0, casual: 0, maternity: 180 },
      leaveBalanceLastUpdated: joiningDate ? new Date(joiningDate) : new Date(),
    });
 
    await profile.save();
    await User.findByIdAndUpdate(req.user.id, {
      profileCompleted: true,
      isOnboarded: true,
      userName: displayName,
      mobileNo: mobileNo?.trim() || req.user.mobileNo,
    });

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

    await accrueLeaveBalance(profile);
    await profile.populate('user', 'userName email role companyName');
    const enrichedProfile = await populateManagerMeta(profile.toObject());
    res.status(200).json({ profile: enrichedProfile });
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


export const updateReportingManager = async (req, res) => {
  try {
    const { userId, reportsTo } = req.body;
    const targetUserId = userId || req.params.userId;
    if (!targetUserId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const targetProfile = await Profile.findOne({ user: targetUserId });
    if (!targetProfile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    if (targetProfile.companyName !== req.user.companyName) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const allowedRoles = ['companyOwner', 'admin', 'hr', 'hrManager'];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'You are not allowed to change reporting managers' });
    }

    if (reportsTo && reportsTo.toString() === targetProfile._id.toString()) {
      return res.status(400).json({ message: 'Circular reporting is not allowed' });
    }

    if (reportsTo) {
      const managerProfile = await Profile.findOne({ _id: reportsTo, companyName: req.user.companyName });
      if (!managerProfile) {
        return res.status(400).json({ message: 'Manager must belong to the same company' });
      }

      const visited = new Set([targetProfile._id.toString()]);
      let current = managerProfile;
      while (current?.reportsTo) {
        if (visited.has(current.reportsTo.toString())) {
          return res.status(400).json({ message: 'Circular reporting is not allowed' });
        }
        visited.add(current.reportsTo.toString());
        current = await Profile.findById(current.reportsTo);
      }
    }

    targetProfile.reportsTo = reportsTo ? mongoose.Types.ObjectId.createFromHexString(reportsTo) : null;
    await targetProfile.save();
    const updatedProfile = await Profile.findById(targetProfile._id).populate('user', 'userName').lean();
    res.status(200).json({ profile: updatedProfile });
  } catch (error) {
    console.error('Update reporting manager error:', error.message || error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getEmployeeHierarchy = async (req, res) => {
  try {
    const targetUserId = req.params.userId || req.user.id;
    const targetProfile = await Profile.findOne({ user: targetUserId }).lean();
    if (!targetProfile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    const allowedRoles = ['companyOwner', 'admin', 'hr', 'hrManager'];
    if (!allowedRoles.includes(req.user.role) && targetUserId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const companyProfiles = await Profile.find({ companyName: req.user.companyName })
      .populate('user', 'userName email role')
      .lean();

    res.status(200).json({ hierarchy: companyProfiles, profile: targetProfile });
  } catch (error) {
    console.error('Hierarchy fetch error:', error.message || error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getDirectReports = async (req, res) => {
  try {
    const targetUserId = req.params.userId || req.user.id;
    const profile = await Profile.findOne({ user: targetUserId }).lean();
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    const allowedRoles = ['companyOwner', 'admin', 'hr', 'hrManager'];
    if (!allowedRoles.includes(req.user.role) && targetUserId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const directReports = await Profile.find({ reportsTo: profile._id })
      .populate('user', 'userName email role')
      .lean();

    res.status(200).json({ directReports });
  } catch (error) {
    console.error('Direct reports fetch error:', error.message || error);
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
    user.isFirstLogin = false;
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