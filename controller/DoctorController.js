import Doctor from '../model/DoctorModel.js';

export const addDoctor = async (req, res) => {
  try {
    const { doctorName, specialty, clinicName, city, contactNumber, latitude, longitude } = req.body;

    if (!doctorName || !specialty || !clinicName) {
      return res.status(400).json({ message: 'Doctor name, specialty, and clinic name are required' });
    }

    const doctor = new Doctor({
      doctorName,
      specialty,
      clinicName,
      city,
      contactNumber,
      location: latitude !== undefined && longitude !== undefined ? { lat: Number(latitude), lng: Number(longitude) } : undefined,
      mr: req.user.id,
      company: req.user.company,
      companyName: req.user.companyName,
    });

    await doctor.save();
    res.status(201).json({ message: 'Doctor added successfully', doctor });
  } catch (error) {
    console.error('Add doctor error:', error.message || error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getDoctors = async (req, res) => {
  try {
    const { city } = req.query;
    const filter = { companyName: req.user.companyName };

    if (city) {
      filter.city = new RegExp(`^${city.trim()}$`, 'i');
    }

    const doctors = await Doctor.find(filter).populate('mr', 'userName email role');
    res.status(200).json(doctors);
  } catch (error) {
    console.error('Fetch doctors error:', error.message || error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateDoctor = async (req, res) => {
  try {
    const doctorId = req.params.id;
    const doctor = await Doctor.findById(doctorId);

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    if (doctor.companyName !== req.user.companyName) {
      return res.status(403).json({ message: 'Access denied: doctor from different company' });
    }

    if (req.user.role !== 'admin' && doctor.mr.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized to edit this doctor' });
    }

    const { doctorName, specialty, clinicName, city, contactNumber } = req.body;
    if (doctorName) doctor.doctorName = doctorName;
    if (specialty) doctor.specialty = specialty;
    if (clinicName) doctor.clinicName = clinicName;
    if (city !== undefined) doctor.city = city;
    if (contactNumber !== undefined) doctor.contactNumber = contactNumber;

    await doctor.save();
    res.status(200).json({ message: 'Doctor updated successfully', doctor });
  } catch (error) {
    console.error('Update doctor error:', error.message || error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteDoctor = async (req, res) => {
  try {
    const doctorId = req.params.id;
    const doctor = await Doctor.findById(doctorId);

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    if (doctor.companyName !== req.user.companyName) {
      return res.status(403).json({ message: 'Access denied: doctor from different company' });
    }

    if (req.user.role !== 'admin' && doctor.mr.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized to delete this doctor' });
    }

    await doctor.remove();
    res.status(200).json({ message: 'Doctor deleted successfully' });
  } catch (error) {
    console.error('Delete doctor error:', error.message || error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getDoctorById = async (req, res) => {
  try {
    const doctorId = req.params.id;
    const doctor = await Doctor.findById(doctorId).populate('mr', 'userName email role');

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    if (doctor.companyName !== req.user.companyName) {
      return res.status(403).json({ message: 'Access denied: doctor from different company' });
    }

    res.status(200).json(doctor);
  } catch (error) {
    console.error('Fetch doctor error:', error.message || error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
