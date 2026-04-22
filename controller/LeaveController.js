import LeaveRequest from '../model/LeaveModel.js';
import Profile from '../model/ProfileModel.js';
import { sendLeaveRequestEmail, sendLeaveApprovalEmail } from '../utils/emailService.js';
import fs from 'fs';
import path from 'path';

const roundToTwo = (value) => Math.round(value * 100) / 100;

const calculateDaysRequested = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return -1;
  }
  const differenceMs = end.setHours(0, 0, 0, 0) - start.setHours(0, 0, 0, 0);
  return Math.floor(differenceMs / (1000 * 60 * 60 * 24)) + 1;
};

const getMonthsElapsed = (fromDate, toDate) => {
  const start = new Date(fromDate);
  const end = new Date(toDate);
  let months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  if (end.getDate() < start.getDate()) {
    months -= 1;
  }
  return Math.max(0, months);
};

const accrueLeaveBalance = async (profile) => {
  const lastUpdated = profile.leaveBalanceLastUpdated || profile.createdAt || new Date();
  const now = new Date();
  const elapsedMonths = getMonthsElapsed(lastUpdated, now);
  if (elapsedMonths <= 0) {
    return profile;
  }

  const accrual = roundToTwo(elapsedMonths * 0.77);
  profile.leaveBalance.sick = roundToTwo((profile.leaveBalance.sick || 0) + accrual);
  profile.leaveBalance.casual = roundToTwo((profile.leaveBalance.casual || 0) + accrual);
  profile.leaveBalanceLastUpdated = now;
  await profile.save();
  return profile;
};

export const requestLeave = async (req, res) => {
  try {
    console.log('Received leave request:', {
      userId: req.user.id,
      companyName: req.user.companyName,
      body: req.body,
    });
    const { leaveType, startDate, endDate, reason } = req.body;
    if (!leaveType || !startDate || !endDate || !reason) {
      return res.status(400).json({ message: 'All leave fields are required' });
    }
    const profile = await Profile.findOne({ user: req.user.id });
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    await accrueLeaveBalance(profile);
    const daysRequested = calculateDaysRequested(startDate, endDate);
    if (daysRequested <= 0) {
      return res.status(400).json({ message: 'Invalid leave dates' });
    }

    const available = profile.leaveBalance?.[leaveType] ?? 0;
    if (daysRequested > available) {
      return res.status(400).json({ message: `Insufficient remaining ${leaveType} leave. You have ${available} day(s) available.` });
    }

    const leaveRequest = new LeaveRequest({
      user: req.user.id,
      profile: profile._id,
      companyName: req.user.companyName,
      leaveType,
      startDate,
      endDate,
      daysRequested,
      reason,
    });

    // Handle attachments if files were uploaded
    if (req.files && req.files.length > 0) {
      req.files.forEach((file) => {
        // Store relative path for easy URL construction
        const relativePath = `attachments/${file.filename}`;
        leaveRequest.attachments.push({
          filename: file.originalname,
          path: relativePath,
          mimetype: file.mimetype,
          size: file.size,
        });
      });
    }

    await leaveRequest.save();

    // Send email notification to the user
    try {
      const user = await require('../model/DataModel.js').findById(req.user.id);
      if (user && user.email) {
        await sendLeaveRequestEmail(
          user.email,
          user.userName,
          leaveType,
          new Date(startDate).toLocaleDateString(),
          new Date(endDate).toLocaleDateString(),
          reason
        );
      }
    } catch (emailError) {
      console.error('Failed to send leave request email:', emailError.message);
      // Don't fail the request if email fails
    }

    res.status(201).json({ message: 'Leave request submitted', leaveRequest });
  } catch (error) {
    console.error('Request leave error:', error.message || error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getLeaveRequests = async (req, res) => {
  try {
    const query = req.user.role === 'admin'
      ? { companyName: req.user.companyName }
      : { user: req.user.id, companyName: req.user.companyName };

    const leaveRequests = await LeaveRequest.find(query)
      .populate('profile', 'employeeId role leaveBalance')
      .populate('user', 'userName email')
      .sort({ createdAt: -1 }); // Sort by newest first

    res.status(200).json({ leaveRequests });
  } catch (error) {
    console.error('Fetch leave requests error:', error.message || error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateLeaveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const leaveRequest = await LeaveRequest.findById(id);
    if (!leaveRequest) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    if (leaveRequest.companyName !== req.user.companyName) {
      return res.status(403).json({ message: 'Access denied: leave request from different company' });
    }

    const profile = await Profile.findById(leaveRequest.profile);
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    await accrueLeaveBalance(profile);
    const { leaveType, daysRequested } = leaveRequest;
    const previousStatus = leaveRequest.status;

    if (previousStatus !== 'approved' && status === 'approved') {
      const available = profile.leaveBalance?.[leaveType] ?? 0;
      if (daysRequested > available) {
        return res.status(400).json({ message: `Cannot approve request: only ${available} ${leaveType} day(s) remain.` });
      }
      profile.leaveBalance[leaveType] = roundToTwo(available - daysRequested);
    } else if (previousStatus === 'approved' && status !== 'approved') {
      profile.leaveBalance[leaveType] = roundToTwo((profile.leaveBalance?.[leaveType] || 0) + daysRequested);
    }

    leaveRequest.status = status;
    await profile.save();
    await leaveRequest.save();

    // Send email notification to the user about approval/rejection
    try {
      const user = await require('../model/DataModel.js').findById(leaveRequest.user);
      if (user && user.email) {
        await sendLeaveApprovalEmail(
          user.email,
          user.userName,
          leaveType,
          new Date(leaveRequest.startDate).toLocaleDateString(),
          new Date(leaveRequest.endDate).toLocaleDateString(),
          status
        );
      }
    } catch (emailError) {
      console.error('Failed to send leave approval email:', emailError.message);
      // Don't fail the request if email fails
    }

    res.status(200).json({ leaveRequest });
  } catch (error) {
    console.error('Update leave request error:', error.message || error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const downloadAttachment = async (req, res) => {
  try {
    const { leaveRequestId, attachmentIndex } = req.params;

    const leaveRequest = await LeaveRequest.findById(leaveRequestId);
    if (!leaveRequest) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    // Verify user has access to this leave request
    if (leaveRequest.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const attachmentIndex_num = parseInt(attachmentIndex);
    if (attachmentIndex_num < 0 || attachmentIndex_num >= leaveRequest.attachments.length) {
      return res.status(404).json({ message: 'Attachment not found' });
    }

    const attachment = leaveRequest.attachments[attachmentIndex_num];
    // Construct full file path
    const filePath = path.resolve('uploads', attachment.path);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found on server' });
    }

    // Set proper headers for download
    res.setHeader('Content-Type', attachment.mimetype);
    res.setHeader('Content-Disposition', `attachment; filename="${attachment.filename}"`);
    res.setHeader('Content-Length', attachment.size);

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    fileStream.on('error', (error) => {
      console.error('File stream error:', error);
      res.status(500).json({ message: 'Error downloading file' });
    });
  } catch (error) {
    console.error('Download attachment error:', error.message || error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
