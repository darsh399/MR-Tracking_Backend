import bcrypt from 'bcrypt';
import User from '../model/DataModel.js';
import Company from '../model/CompanyModel.js';
import hashPassword from '../utils/HashPassword.js';
import createToken from '../utils/createToken.js';
import sendEmail from '../utils/sendEmail.js';
import Profile from '../model/ProfileModel.js';
import Visit from '../model/VisitModel.js';
import Doctor from '../model/DoctorModel.js';
import Leave from '../model/LeaveModel.js';

import { activationConfirmationTemplate, activateUserTemplate } from '../configue/mailFormat.js';
export const registerUser = async (req, res) => {
  try {
    const { userName, email, mobileNo, password, role = 'mr', companyName } = req.body;

    if (!userName || !email || !mobileNo || !password || !companyName) {
      return res.status(400).json({ message: 'All fields including company name are required' });
    }

    if (role === 'admin' && !companyName.trim()) {
      return res.status(400).json({ message: 'Company name is required for admin registration' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'User with this email already exists' });
    }

    const normalizedRole = role === 'admin' ? 'admin' : 'mr';
    const requiresApproval = normalizedRole === 'mr';

    let company = await Company.findOne({ name: companyName.trim() });
    if (!company) {
      if (normalizedRole === 'admin') {
        company = new Company({ name: companyName.trim() });
        await company.save();
      } else {
        return res.status(400).json({ message: 'Company does not exist. Please contact admin.' });
      }
    }
    const adminCount = await User.countDocuments({ role: 'admin' });
    const approved = normalizedRole === 'admin' && adminCount === 0 ? true : !requiresApproval;

    const hashedPassword = await hashPassword(password);
    const newUser = new User({
      userName,
      email,
      mobileNo,
      password: hashedPassword,
      role: normalizedRole,
      company: company._id,
      companyName: companyName.trim(),
      approved,
      isActive: true,
    });

    await newUser.save();

    if (normalizedRole === 'admin' && !company.admin) {
      company.admin = newUser._id;
      await company.save();
    }

    const message = normalizedRole === 'mr'
      ? 'MR registration submitted. Await admin approval.'
      : 'Admin account created successfully.';

    res.status(201).json({
      message,
      user: {
        id: newUser._id,
        userName: newUser.userName,
        email: newUser.email,
        role: newUser.role,
        companyName: newUser.companyName,
        approved: newUser.approved,
        isActive: newUser.isActive,
      },
    });
  } catch (error) {
    console.error('Registration error:', error.message || error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (!user.approved) {
      return res.status(403).json({ message: 'Your account is awaiting admin approval' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Your account is deactivated. Contact your administrator.' });
    }

    const token = await createToken(user);

    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user._id,
        userName: user.userName,
        email: user.email,
        role: user.role,
        companyName: user.companyName,
        mobileNo: user.mobileNo,
        profileCompleted: user.profileCompleted,
        approved: user.approved,
        isActive: user.isActive,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error.message || error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user?.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    console.log('Current user fetched:', {
      id: user._id,
      userName: user.userName,
      email: user.email,
      role: user.role,
      companyName: user.companyName,

      profileCompleted: user.profileCompleted,
      approved: user.approved,
      isActive: user.isActive,
      mobileNo: user.mobileNo,
    });
    res.status(200).json({
      user: {
        id: user._id,
        userName: user.userName,
        email: user.email,
        role: user.role,
        companyName: user.companyName,
        mobileNo: user.mobileNo,
        profileCompleted: user.profileCompleted,
        approved: user.approved,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error('Fetch current user error:', error.message || error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const approveUser = async (req, res) => {
  console.log('Approve user request received for user ID:', req.params.id);
  try {
    const userId = req.params.id;
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { approved: true },
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    sendEmail(updatedUser.email, 'Account Activation Notice', activateUserTemplate(updatedUser.userName));
    res.status(200).json({ message: 'User approved successfully', user: updatedUser });
  } catch (error) {
    console.error('Approve user error:', error.message || error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const logoutUser = async (req, res) => {
  try {
    res.clearCookie('token', {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      path: '/',
    });
    res.status(200).json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error.message || error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const companyFilter = req.user.companyName ? { companyName: req.user.companyName } : {};
    const users = await User.find(companyFilter).select('-password');
    res.status(200).json(users);
  } catch (error) {
    console.error('Fetch users error:', error.message || error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const toggleUserStatus = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    user.isActive = !user.isActive;
    await user.save();
    if(!user.isActive) {
      sendEmail(user.email, 'Account Deactivation Notice', activationConfirmationTemplate(user.userName));
    }
    
    res.status(200).json({ message: 'User status updated', user });
  } catch (error) {
    console.error('Toggle user status error:', error.message || error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const deletedUser = await User.findByIdAndDelete(userId);
    if (!deletedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error.message || error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


// export const getUserById = async (req, res) => {
//   try {
//     const userId = req.params.id;
//     const user = await User.findById(userId).select('-password');
//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }
//     if (req.user.companyName && user.companyName !== req.user.companyName) {
//       return res.status(403).json({ message: 'Access denied for this user' });
//     }
//     res.status(200).json(user);
//   } catch (error) {
//     console.error('Error fetching user by ID:', error.message || error);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// };


export const getUserById = async (req, res) => {
  try {
    const userId = req.params.id;

    // ✅ 1. Get user
    const user = await User.findById(userId).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // ✅ 2. Company security check
    if (req.user.companyName && user.companyName !== req.user.companyName) {
      return res.status(403).json({ message: 'Access denied for this user' });
    }

    // ✅ 3. Fetch ALL related data (parallel 🚀)
    const [profile, leaves, visits, doctors] = await Promise.all([
      Profile.findOne({ user: userId }),
      Leave.find({ user: userId }).sort({ createdAt: -1 }),
      Visit.find({ mr: userId }).sort({ createdAt: -1 }),
      Doctor.find({ mr: userId }).sort({ createdAt: -1 }),
    ]);

    // ✅ 4. Final response
    res.status(200).json({
      user,
      profile,
      leaves,
      visits,
      doctors,
    });

  } catch (error) {
    console.error('Error fetching full user data:', error.message || error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


export const updateUser = async (req, res) => {
  try {
    console.log(req.body)
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }


    const { userName, email, mobileNo, companyName, password } = req.body;
    if(!password){
      return res.status(400).json({ message: 'Current password is required' });
    }
    const verifiedUser =await bcrypt.compare(password, user.password);
      if (!verifiedUser) {
      return res.status(400).json({
        message: 'Password not matched, please enter correct password',
      });
    }
    
    if (userName) user.userName = userName;
    if (email) user.email = email;
    if (mobileNo) user.mobileNo = mobileNo;
    if (companyName) user.companyName = companyName;

    await user.save();
    res.status(200).json({ message: 'User updated successfully', user: user.toObject({ getters: true, virtuals: false }) });
  } catch (error) {
    console.error('Update user error:', error.message || error);
    res.status(500).json({ message: 'Internal server error' });
  }
}