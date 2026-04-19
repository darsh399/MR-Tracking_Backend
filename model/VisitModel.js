import mongoose from 'mongoose';

const visitSchema = mongoose.Schema({
  mr: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
  },
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
  contactNumber: {
    type: String,
    trim: true,
  },

  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },

  // ✅ NEW
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

  timestamp: {
    type: Date,
    default: Date.now,
  },
  locationMatched: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('Visit', visitSchema);