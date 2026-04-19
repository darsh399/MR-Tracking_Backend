import mongoose from 'mongoose';

const leaveSchema = mongoose.Schema({
  sick: { type: Number, default: 12 },
  casual: { type: Number, default: 10 },
  maternity: { type: Number, default: 180 },
});

const profileSchema = mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  aadharNumber: { type: String, required: true, trim: true },
  panNumber: { type: String, required: true, trim: true },
  bloodGroup: { type: String, required: true, trim: true },
  address: {
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
  },
  emergencyContact: { type: String, required: true, trim: true },
  employeeId: { type: String, required: true, unique: true },
  role: { type: String, enum: ['admin', 'mr'], required: true },
  joiningDate: { type: Date, required: true },
  department: { type: String, required: true, trim: true },
  experienceType: { type: String, enum: ['fresher', 'experienced'], required: true },
  previousCompany: { type: String, trim: true },
  totalExperienceMonths: { type: Number, default: 0 },
  documents: {
    salarySlips: [{ type: String }],
    offerLetters: [{ type: String }],
    relievingLetters: [{ type: String }],
  },
  leaveBalance: {
    sick: { type: Number, default: 12 },
    casual: { type: Number, default: 10 },
    maternity: { type: Number, default: 180 },
  },
  leaveBalanceLastUpdated: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Profile', profileSchema);
