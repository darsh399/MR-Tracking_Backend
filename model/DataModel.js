import mongoose from 'mongoose';

const DataModel = mongoose.Schema({
  userName: {
    type: String,
    trim: true,
    minlength: 3,
    default: '',
  },
  firstName: {
    type: String,
    trim: true,
    default: '',
  },
  lastName: {
    type: String,
    trim: true,
    default: '',
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  contactEmail: {
    type: String,
    trim: true,
    lowercase: true,
    default: '',
  },
  mobileNo: {
    type: String,
    trim: true,
    default: '',
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  role: {
    type: String,
    enum: ['admin', 'mr', 'employee', 'companyOwner', 'hr', 'hrManager', 'projectManager'],
    default: 'mr',
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
  },
  companyName: {
    type: String,
    required: true,
    trim: true,
  },
  joiningDate: {
    type: Date,
    default: null,
  },
  profileCompleted: {
    type: Boolean,
    default: false,
  },
  isFirstLogin: {
    type: Boolean,
    default: false,
  },
  isOnboarded: {
    type: Boolean,
    default: false,
  },
  resetPasswordToken: {
    type: String,
    default: null,
  },
  resetPasswordExpires: {
    type: Date,
    default: null,
  },
  passwordResetOtp: {
    type: String,
    default: null,
  },
  passwordResetOtpExpires: {
    type: Date,
    default: null,
  },
  verificationCode: {
    type: String,
    default: null,
  },
  verificationCodeExpires: {
    type: Date,
    default: null,
  },
  isVerified: {
    type: Boolean,
    default: true,
  },
  requestStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  approved: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('User', DataModel);