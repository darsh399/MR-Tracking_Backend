import Visit from '../model/VisitModel.js';
import Doctor from '../model/DoctorModel.js';

const getDistanceInMeters = (lat1, lng1, lat2, lng2) => {
  const toRadians = (value) => (value * Math.PI) / 180;
  const earthRadius = 6371000; // meters
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadius * c;
};

export const addVisit = async (req, res) => {
  try {
    const { doctorId, doctorName, specialty, clinicName, contactNumber, latitude, longitude } = req.body;

    if (!doctorName || !specialty || !clinicName || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ message: 'Doctor name, specialty, clinic, and location are required' });
    }

    let doctor = null;
    if (doctorId) {
      doctor = await Doctor.findById(doctorId);
      if (doctor && doctor.companyName !== req.user.companyName) {
        return res.status(403).json({ message: 'Access denied: doctor from different company' });
      }
    }

    if (!doctor) {
      doctor = await Doctor.findOne({
        doctorName: doctorName.trim(),
        clinicName: clinicName.trim(),
        companyName: req.user.companyName,
      });
    }

    if (!doctor) {
      doctor = new Doctor({
        doctorName: doctorName.trim(),
        specialty: specialty.trim(),
        clinicName: clinicName.trim(),
        contactNumber,
        mr: req.user.id,
        company: req.user.company,
        companyName: req.user.companyName,
      });
      await doctor.save();
    }

    let locationMatched = true;
    let statusMessage = 'Visit recorded successfully';

    if (doctor.location?.lat !== undefined && doctor.location?.lng !== undefined) {
      const distance = getDistanceInMeters(
        latitude,
        longitude,
        doctor.location.lat,
        doctor.location.lng
      );
      if (distance > 50) {
        locationMatched = false;
        statusMessage = 'Location not matched';
      }
    }

    const visit = new Visit({
      mr: req.user.id,
      doctor: doctor._id,
      doctorName: doctor.doctorName,
      specialty: doctor.specialty,
      clinicName: doctor.clinicName,
      contactNumber: doctor.contactNumber,
      location: {
        lat: latitude,
        lng: longitude,
      },
      company: req.user.company,
      companyName: req.user.companyName,
      timestamp: new Date(),
      locationMatched,
    });

    await visit.save();

    res.status(locationMatched ? 201 : 200).json({ message: statusMessage, visit });
  } catch (error) {
    console.error('Add visit error:', error.message || error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getVisitHistory = async (req, res) => {
  try {
    const filter = { companyName: req.user.companyName };
    const { startDate, endDate, mrName, doctorName } = req.query;

    if (req.user.role !== 'admin') {
      filter.mr = req.user.id;
    }

    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }

    if (doctorName) {
      filter.doctorName = { $regex: doctorName, $options: 'i' };
    }

    let visits = await Visit.find(filter)
      .populate('mr', 'userName email role')
      .populate('doctor', 'doctorName specialty clinicName')
      .sort({ timestamp: -1 });

    if (mrName && req.user.role === 'admin') {
      visits = visits.filter((visit) =>
        visit.mr?.userName?.toLowerCase().includes(mrName.toLowerCase()) ||
        visit.mr?.email?.toLowerCase().includes(mrName.toLowerCase())
      );
    }

    res.status(200).json(visits);
  } catch (error) {
    console.error('Fetch visit history error:', error.message || error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
