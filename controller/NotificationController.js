import Notification from '../model/NotificationModel.js';
import User from '../model/DataModel.js';
import mongoose from 'mongoose';

export const createNotification = async ({ userId, companyName, title, message, type = 'info', metadata = {} }) => {
  if (!userId || !companyName || !title || !message) return null;
  const notification = new Notification({
    user: mongoose.Types.ObjectId(userId),
    companyName,
    title,
    message,
    type,
    metadata,
  });
  return notification.save();
};

export const createNotificationsForRoles = async ({ companyName, roles, title, message, type = 'info', metadata = {} }) => {
  if (!companyName || !roles?.length || !title || !message) return [];
  const users = await User.find({ companyName, role: { $in: roles }, approved: true, isActive: true }).select('_id');
  const notifications = users.map((user) => ({
    user: user._id,
    companyName,
    title,
    message,
    type,
    metadata,
  }));
  return Notification.insertMany(notifications);
};

export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .lean();
    res.status(200).json({ notifications });
  } catch (error) {
    console.error('Get notifications error:', error.message || error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const markNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findOneAndUpdate(
      { _id: id, user: req.user.id },
      { read: true },
      { new: true }
    ).lean();
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    res.status(200).json({ notification });
  } catch (error) {
    console.error('Mark notification read error:', error.message || error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const markAllNotificationsRead = async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user.id, read: false }, { read: true });
    res.status(200).json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all notifications read error:', error.message || error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
