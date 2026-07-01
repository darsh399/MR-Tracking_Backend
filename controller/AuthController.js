import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import User from '../model/DataModel.js';
import Company from '../model/CompanyModel.js';
import hashPassword from '../utils/HashPassword.js';
import createToken from '../utils/createToken.js';
import sendEmail from '../utils/sendEmail.js';
import Profile from '../model/ProfileModel.js';
import Visit from '../model/VisitModel.js';
import Doctor from '../model/DoctorModel.js';
import Leave from '../model/LeaveModel.js';
import {
  sendInvitationEmail,
  sendApprovalPendingEmail,
  sendApprovalGrantedEmail,
  sendOtpVerificationEmail,
  sendPasswordResetEmail,
  sendPasswordResetOtpEmail,
  sendPasswordResetConfirmationEmail,
} from '../utils/emailService.js';

const createEmailFromNameAndCompany = async (firstName, lastName, companyName) => {
  const normalize = (value) => value.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  const localName = `${normalize(firstName)}.${normalize(lastName)}`;
  const domainName = normalize(companyName) || 'example';
  let emailCandidate = `${localName}@${domainName}.com`;
  let suffix = 1;
  while (await User.findOne({ email: emailCandidate })) {
    emailCandidate = `${localName}${suffix}@${domainName}.com`;
    suffix += 1;
  }
  return emailCandidate;
};

export const registerUser = async (req, res) => {
  try {
    const { userName, firstName, lastName, contactEmail, joiningDate, role = 'mr', companyId, companyName, password } = req.body;
    const normalizedContactEmail = contactEmail?.trim().toLowerCase();

    if (!firstName?.trim() || !lastName?.trim()) {
      return res.status(400).json({ message: 'First name and last name are required' });
    }
    if (!normalizedContactEmail) {
      return res.status(400).json({ message: 'Current email address is required to send the invitation' });
    }
    if (!role || (!companyId && !companyName)) {
      return res.status(400).json({ message: 'Role and company information are required' });
    }

    const existingContact = await User.findOne({ contactEmail: normalizedContactEmail });
    if (existingContact) {
      return res.status(409).json({ message: 'A user has already been invited to that email address' });
    }

    const rawRole = role?.trim();
    const allowedRoles = ['admin', 'companyOwner', 'hr', 'hrManager', 'projectManager', 'mr', 'employee'];
    const normalizedRole = rawRole === 'CEO' ? 'companyOwner' : (allowedRoles.includes(rawRole) ? rawRole : 'employee');

    const userCount = await User.countDocuments();
    const bootstrapAdmin = userCount === 0 && normalizedRole === 'admin';
    const isCompanyOwnerSignup = normalizedRole === 'companyOwner';
    const token = req.headers.authorization?.split(' ')[1] || req.cookies?.token;
    const isPublicSignup = !token;
    let actingUser = null;

    if (isPublicSignup && normalizedRole === 'admin' && !bootstrapAdmin) {
      return res.status(403).json({
        message: 'Public signup only supports company owner and team roles. Use the protected invite route for admin users.',
      });
    }

    if (!bootstrapAdmin && token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        actingUser = await User.findById(decoded.id).lean();
      } catch (authError) {
        return res.status(403).json({ message: 'Invalid token or insufficient permissions' });
      }
      if (!actingUser || !['admin', 'companyOwner', 'hr', 'hrManager', 'projectManager'].includes(actingUser.role)) {
        return res.status(403).json({ message: 'Only Company Owner, HR, HR Manager, Project Manager, or Admin can create users' });
      }
    }

    let company = null;
    if (companyId) {
      company = await Company.findById(companyId);
    }
    if (!company && companyName) {
      company = await Company.findOne({ name: companyName.trim() });
    }

    if (!company) {
      if ((bootstrapAdmin || isCompanyOwnerSignup) && companyName) {
        company = new Company({ name: companyName.trim() });
        await company.save();
      } else {
        return res.status(400).json({ message: 'Company not found. Please provide a valid company ID or name.' });
      }
    } else if (!token && isCompanyOwnerSignup) {
      return res.status(403).json({
        message: 'Company already exists. Register a new company owner with a unique company name or ask your administrator for an invite.',
      });
    }

    const generatedEmail = await createEmailFromNameAndCompany(firstName, lastName, company.name);
    const passwordToUse = password?.trim() ? password.trim() : Math.floor(10000 + Math.random() * 90000).toString();
    if (password?.trim() && password.trim().length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }
    const hashedPassword = await hashPassword(passwordToUse);
    const requiresOtpVerification = normalizedRole === 'companyOwner';
    const verificationCode = requiresOtpVerification ? Math.floor(100000 + Math.random() * 900000).toString() : null;
    const verificationCodeExpires = requiresOtpVerification ? Date.now() + 10 * 60 * 1000 : null;
    const requiresApproval = !isPublicSignup && !bootstrapAdmin && !['admin', 'companyOwner'].includes(normalizedRole);

    const newUser = new User({
      userName: userName?.trim() || `${firstName?.trim() || ''} ${lastName?.trim() || ''}`.trim() || generatedEmail,
      firstName: firstName?.trim() || '',
      lastName: lastName?.trim() || '',
      email: generatedEmail,
      contactEmail: normalizedContactEmail,
      joiningDate: joiningDate ? new Date(joiningDate) : null,
      mobileNo: '',
      password: hashedPassword,
      role: normalizedRole,
      company: company._id,
      companyId: company._id,
      companyName: company.name,
      profileCompleted: false,
      isFirstLogin: true,
      isOnboarded: false,
      resetPasswordToken: null,
      resetPasswordExpires: null,
      verificationCode,
      verificationCodeExpires,
      isVerified: !requiresOtpVerification,
      requestStatus: isPublicSignup ? 'approved' : requiresApproval ? 'pending' : 'approved',
      approved: isPublicSignup ? (normalizedRole === 'companyOwner' || bootstrapAdmin) : !requiresApproval,
      isActive: isPublicSignup ? true : !requiresApproval,
    });

    await newUser.save();

    if (normalizedRole === 'admin' && !company.admin) {
      company.admin = newUser._id;
      await company.save();
    }

    if (requiresOtpVerification) {
      sendOtpVerificationEmail(normalizedContactEmail, newUser.userName, verificationCode, newUser.email, passwordToUse)
        .catch((emailError) => console.error('OTP verification email error:', emailError));

      return res.status(201).json({
        message: 'Company owner account created. An OTP has been sent to the contact email for verification.',
        user: {
          id: newUser._id,
          userName: newUser.userName,
          email: newUser.email,
          contactEmail: newUser.contactEmail,
          joiningDate: newUser.joiningDate,
          role: newUser.role,
          companyName: newUser.companyName,
          isFirstLogin: newUser.isFirstLogin,
          isOnboarded: newUser.isOnboarded,
          requiresOtpVerification: true,
        },
      });
    }

    if (newUser.requestStatus === 'pending') {
      sendApprovalPendingEmail(
        normalizedContactEmail,
        newUser.userName,
        normalizedRole,
        company.name,
        newUser.email,
        passwordToUse
      ).catch((emailError) => console.error('Approval pending email error:', emailError));

      return res.status(201).json({
        message: 'User request created and is pending approval. The invitee has been emailed their official login details and will be able to sign in after approval.',
        user: {
          id: newUser._id,
          userName: newUser.userName,
          email: newUser.email,
          contactEmail: newUser.contactEmail,
          joiningDate: newUser.joiningDate,
          role: newUser.role,
          companyName: newUser.companyName,
          isFirstLogin: newUser.isFirstLogin,
          isOnboarded: newUser.isOnboarded,
          requestStatus: newUser.requestStatus,
        },
      });
    }

    sendInvitationEmail(normalizedContactEmail, newUser.userName, newUser.email, passwordToUse)
      .catch((emailError) => console.error('Invitation email error:', emailError));

    res.status(201).json({
      message: 'User invited successfully. A login invite was sent to their current email address.',
      user: {
        id: newUser._id,
        userName: newUser.userName,
        email: newUser.email,
        contactEmail: newUser.contactEmail,
        joiningDate: newUser.joiningDate,
        role: newUser.role,
        companyName: newUser.companyName,
        isFirstLogin: newUser.isFirstLogin,
        isOnboarded: newUser.isOnboarded,
        requestStatus: newUser.requestStatus,
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

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({
      $or: [{ email: normalizedEmail }, { contactEmail: normalizedEmail }],
    });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (user.requestStatus === 'rejected') {
      return res.status(403).json({ message: 'Your access request has been rejected.' });
    }

    if (!user.approved) {
      return res.status(403).json({ message: 'Your account is awaiting approval.' });
    }

    if (!user.isVerified) {
      return res.status(403).json({ message: 'Your account is awaiting OTP verification. Please verify the code sent to your email.' });
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
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        companyName: user.companyName,
        mobileNo: user.mobileNo,
        profileCompleted: user.profileCompleted,
        isFirstLogin: user.isFirstLogin,
        isOnboarded: user.isOnboarded,
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
      isFirstLogin: user.isFirstLogin,
      isOnboarded: user.isOnboarded,
      approved: user.approved,
      isActive: user.isActive,
      mobileNo: user.mobileNo,
    });
    res.status(200).json({
      user: {
        id: user._id,
        userName: user.userName,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        joiningDate: user.joiningDate,
        role: user.role,
        companyName: user.companyName,
        mobileNo: user.mobileNo,
        profileCompleted: user.profileCompleted,
        isFirstLogin: user.isFirstLogin,
        isOnboarded: user.isOnboarded,
        approved: user.approved,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error('Fetch current user error:', error.message || error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({
      $or: [{ email: normalizedEmail }, { contactEmail: normalizedEmail }],
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.passwordResetOtp = otpCode;
    user.passwordResetOtpExpires = Date.now() + 10 * 60 * 1000;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    await sendPasswordResetOtpEmail(user.contactEmail || user.email, user.userName || user.email, otpCode);
    res.status(200).json({ message: 'Password reset OTP sent to email' });
  } catch (error) {
    console.error('Request password reset error:', error.message || error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const resetPasswordWithToken = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    user.password = await hashPassword(newPassword);
    user.isFirstLogin = false;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    await sendPasswordResetConfirmationEmail(user.email, user.userName || user.email);
    res.status(200).json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password with token error:', error.message || error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const resetPasswordWithOtp = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'Email, OTP and new password are required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({
      $or: [{ email: normalizedEmail }, { contactEmail: normalizedEmail }],
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.passwordResetOtp || !user.passwordResetOtpExpires || user.passwordResetOtpExpires < Date.now()) {
      return res.status(400).json({ message: 'OTP expired or invalid. Request a new password reset code.' });
    }

    if (user.passwordResetOtp !== otp.trim()) {
      return res.status(400).json({ message: 'Invalid OTP code.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    user.password = await hashPassword(newPassword);
    user.isFirstLogin = false;
    user.passwordResetOtp = null;
    user.passwordResetOtpExpires = null;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    await sendPasswordResetConfirmationEmail(user.contactEmail || user.email, user.userName || user.email);
    res.status(200).json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password with OTP error:', error.message || error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({
      $or: [{ email: normalizedEmail }, { contactEmail: normalizedEmail }],
    });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'Account already verified' });
    }

    if (!user.verificationCode || !user.verificationCodeExpires || user.verificationCodeExpires < Date.now()) {
      return res.status(400).json({ message: 'OTP expired or invalid. Request a new verification code.' });
    }

    if (user.verificationCode !== otp.trim()) {
      return res.status(400).json({ message: 'Invalid OTP code.' });
    }

    user.isVerified = true;
    user.verificationCode = null;
    user.verificationCodeExpires = null;
    await user.save();

    res.status(200).json({ message: 'OTP verified successfully. You can now log in.' });
  } catch (error) {
    console.error('Verify OTP error:', error.message || error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({
      $or: [{ email: normalizedEmail }, { contactEmail: normalizedEmail }],
    });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'Account already verified' });
    }

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.verificationCode = verificationCode;
    user.verificationCodeExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    sendOtpVerificationEmail(user.contactEmail || user.email, user.userName, verificationCode, user.email, null)
      .catch((emailError) => console.error('OTP resend email error:', emailError));

    res.status(200).json({ message: 'A new OTP has been sent to your email.' });
  } catch (error) {
    console.error('Resend OTP error:', error.message || error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const resendPasswordResetOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({
      $or: [{ email: normalizedEmail }, { contactEmail: normalizedEmail }],
    });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.passwordResetOtp = otpCode;
    user.passwordResetOtpExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    sendPasswordResetOtpEmail(user.contactEmail || user.email, user.userName || user.email, otpCode)
      .catch((emailError) => console.error('Password reset OTP resend email error:', emailError));

    res.status(200).json({ message: 'A new password reset OTP has been sent to your email.' });
  } catch (error) {
    console.error('Resend password reset OTP error:', error.message || error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const approveUser = async (req, res) => {
  console.log('Approve user request received for user ID:', req.params.id);
  try {
    const userId = req.params.id;
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { approved: true, isActive: true, requestStatus: 'approved', isVerified: true },
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    await sendApprovalGrantedEmail(updatedUser.contactEmail || updatedUser.email, updatedUser.userName, updatedUser.email)
      .catch((emailError) => console.error('Approval granted email error:', emailError));

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
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

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


export const getUserById = async (req, res) => {
  try {
    const userId = req.params.id;
    const requesterId = req.user?.id || req.user?._id;
    const requesterRole = req.user?.role;

    const user = await User.findById(userId).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (requesterRole === 'employee' && userId !== requesterId) {
      return res.status(403).json({ message: 'Access denied for this user' });
    }

    if (req.user.companyName && user.companyName !== req.user.companyName) {
      return res.status(403).json({ message: 'Access denied for this user' });
    }

    const companyFilter = req.user.companyName;
    const [profileDoc, leaves, visits, doctors] = await Promise.all([
      Profile.findOne({ user: userId }).populate('user', 'userName email role companyName').lean(),
      Leave.find({ user: userId }).sort({ createdAt: -1 }),
      Visit.find({ mr: userId }).sort({ createdAt: -1 }),
      Doctor.find({ mr: userId, companyName: companyFilter }).sort({ createdAt: -1 }),
    ]);

    let profile = profileDoc;
    if (profile?.reportsTo) {
      const manager = await Profile.findById(profile.reportsTo).populate('user', 'userName').lean();
      profile = {
        ...profile,
        managerName: manager?.user?.userName || '',
        managerDesignation: manager?.designation || manager?.role || '',
        managerEmployeeId: manager?.employeeId || '',
        managerUserId: manager?.user?._id || manager?.user || '',
      };
    }

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


export const forgotPassword = (req, res) => {
  try{
   
  }catch(error){
    console.log('Forgot password error:', error.message || error);
    res.status(500).json({message: 'Internal server error '});
  }
}