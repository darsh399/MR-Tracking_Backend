import mongoose from 'mongoose';

const leaveSchema = mongoose.Schema({
  sick: { type: Number, default: 12 },
  casual: { type: Number, default: 10 },
  maternity: { type: Number, default: 180 },
});

const profileSchema = mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  companyName: { type: String, required: true, trim: true },
  aadharNumber: { type: String, trim: true, required: function () { return this.role !== 'companyOwner'; }, default: '' },
  panNumber: { type: String, trim: true, required: function () { return this.role !== 'companyOwner'; }, default: '' },
  bloodGroup: { type: String, trim: true, required: function () { return this.role !== 'companyOwner'; }, default: '' },
  address: {
    city: { type: String, trim: true, required: function () { return this.role !== 'companyOwner'; }, default: '' },
    state: { type: String, trim: true, required: function () { return this.role !== 'companyOwner'; }, default: '' },
    pincode: { type: String, trim: true, required: function () { return this.role !== 'companyOwner'; }, default: '' },
  },
  emergencyContact: { type: String, trim: true, default: '' },
  employeeId: { type: String, required: true, unique: true },
  role: { type: String, enum: ['admin', 'companyOwner', 'hr', 'hrManager', 'projectManager', 'mr', 'employee'], required: true },
  joiningDate: { type: Date, required: true },
  department: { type: String, trim: true, required: function () { return this.role !== 'companyOwner'; }, default: '' },
  designation: { type: String, trim: true, default: '' },
  experienceType: { type: String, enum: ['fresher', 'experienced'], default: 'fresher' },
  previousCompany: { type: String, trim: true },
  totalExperienceMonths: { type: Number, default: 0 },
  reportsTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', default: null },
  managerName: { type: String, trim: true, default: '' },
  managerDesignation: { type: String, trim: true, default: '' },
  managerEmployeeId: { type: String, trim: true, default: '' },
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
