import mongoose from 'mongoose';

const doctorSchema = mongoose.Schema({
  doctorName: {
    type: String,
    required: true,
    trim: true,
  },
  specialty: {
    type: String,
    required: true,
    trim: true,
  },
  clinicName: {
    type: String,
    required: true,
    trim: true,
  },
  city: {
    type: String,
    trim: true,
  },
  contactNumber: {
    type: String,
    trim: true,
  },
  location: {
    lat: { type: Number },
    lng: { type: Number },
  },
  mr: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
  },
  companyName: {
    type: String,
    required: true,
    trim: true,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('Doctor', doctorSchema);