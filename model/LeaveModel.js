import mongoose from 'mongoose';

const leaveRequestSchema = mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  profile: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
  companyName: { type: String, required: true, trim: true },
  leaveType: { type: String, enum: ['sick', 'casual', 'maternity'], required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  daysRequested: { type: Number, required: true },
  reason: { type: String, required: true, trim: true },
  attachments: [
    {
      filename: String,
      path: String,
      mimetype: String,
      size: Number,
    },
  ],
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('LeaveRequest', leaveRequestSchema);
