import User from '../model/DataModel.js';
import Visit from '../model/VisitModel.js';
import Doctor from '../model/DoctorModel.js';

export const getDashboardStats = async (req, res) => {
  try {
    const companyFilter = { companyName: req.user.companyName };

    const totalMRs = await User.countDocuments({ role: 'mr', ...companyFilter });
    const totalVisits = await Visit.countDocuments(companyFilter);
    const activeUsers = await User.countDocuments({ isActive: true, ...companyFilter });
    const inactiveUsers = await User.countDocuments({ isActive: false, ...companyFilter });

    const visitsPerDay = await Visit.aggregate([
      { $match: companyFilter },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const topDoctors = await Visit.aggregate([
      { $match: companyFilter },
      {
        $group: {
          _id: '$doctorName',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    const mrPerformance = await Visit.aggregate([
      { $match: companyFilter },
      {
        $group: {
          _id: '$mr',
          visits: { $sum: 1 },
        },
      },
      { $sort: { visits: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'mr',
        },
      },
      {
        $unwind: '$mr',
      },
      {
        $project: {
          visits: 1,
          userName: '$mr.userName',
          email: '$mr.email',
        },
      },
    ]);

    const totalDoctors = await Doctor.countDocuments(companyFilter);

    res.status(200).json({
      totalMRs,
      totalVisits,
      totalDoctors,
      activeUsers,
      inactiveUsers,
      visitsPerDay,
      topDoctors,
      mrPerformance,
    });
  } catch (error) {
    console.error('Admin dashboard error:', error.message || error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAdminVisits = async (req, res) => {
  try {
    const { startDate, endDate, mrName, doctorName } = req.query;
    const filter = { companyName: req.user.companyName };

    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.timestamp.$lte = end;
      }
    }

    if (doctorName) {
      filter.doctorName = { $regex: doctorName, $options: 'i' };
    }

    const visits = await Visit.find(filter)
      .populate('mr', 'userName email role')
      .populate('doctor', 'doctorName specialty clinicName')
      .sort({ timestamp: -1 });

    const filteredVisits = mrName
      ? visits.filter((visit) => visit.mr?.userName?.toLowerCase().includes(mrName.toLowerCase()))
      : visits;

    res.status(200).json(filteredVisits);
  } catch (error) {
    console.error('Admin visits fetch error:', error.message || error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
