import sendEmail from './sendEmail.js';
import {
  activateUserTemplate,
  activationConfirmationTemplate,
  passwordResetTemplate,
  passwordResetConfirmationTemplate,
  onboardingCompletionTemplate,
  deactivationNotificationTemplate,
  leaveRequestTemplate,
  leaveApprovalTemplate,
  visitReminderTemplate
} from '../configue/mailFormat.js';

// User account emails
export const sendActivationEmail = async (email, userName, token) => {
  const html = activateUserTemplate(userName, token);
  return sendEmail(email, 'Account Activation Required', html);
};

export const sendActivationConfirmationEmail = async (email, userName) => {
  const html = activationConfirmationTemplate(userName);
  return sendEmail(email, 'Account Activated Successfully', html);
};

export const sendPasswordResetEmail = async (email, userName, token) => {
  const html = passwordResetTemplate(userName, token);
  return sendEmail(email, 'Password Reset Request', html);
};

export const sendPasswordResetConfirmationEmail = async (email, userName) => {
  const html = passwordResetConfirmationTemplate(userName);
  return sendEmail(email, 'Password Reset Successful', html);
};

export const sendOnboardingCompletionEmail = async (email, userName) => {
  const html = onboardingCompletionTemplate(userName);
  return sendEmail(email, 'Welcome to Medical Visit Management', html);
};

export const sendDeactivationNotificationEmail = async (email, userName) => {
  const html = deactivationNotificationTemplate(userName);
  return sendEmail(email, 'Account Deactivation Notice', html);
};

// Leave management emails
export const sendLeaveRequestEmail = async (email, userName, leaveType, startDate, endDate, reason) => {
  const html = leaveRequestTemplate(userName, leaveType, startDate, endDate, reason);
  return sendEmail(email, 'Leave Request Submitted', html);
};

export const sendLeaveApprovalEmail = async (email, userName, leaveType, startDate, endDate, status) => {
  const html = leaveApprovalTemplate(userName, leaveType, startDate, endDate, status);
  const subject = status === 'approved' ? 'Leave Request Approved' : 'Leave Request Update';
  return sendEmail(email, subject, html);
};

// Visit management emails
export const sendVisitReminderEmail = async (email, userName, patientName, visitDate, visitTime, location) => {
  const html = visitReminderTemplate(userName, patientName, visitDate, visitTime, location);
  return sendEmail(email, 'Upcoming Visit Reminder', html);
};

// Admin notification emails
export const sendAdminNotificationEmail = async (adminEmail, subject, message, details = {}) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px; border-radius: 10px; }
        .header { background: #dc3545; color: white; padding: 15px; border-radius: 10px 10px 0 0; text-align: center; }
        .content { background: white; padding: 20px; border-radius: 0 0 10px 10px; }
        .details { background: #f8f8f8; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .urgent { color: #dc3545; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>🔔 Admin Notification</h2>
        </div>
        <div class="content">
          <h3>${subject}</h3>
          <p>${message}</p>
          ${Object.keys(details).length > 0 ? `
            <div class="details">
              <h4>Details:</h4>
              <ul>
                ${Object.entries(details).map(([key, value]) => `<li><strong>${key}:</strong> ${value}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
          <p>Please log in to the admin dashboard to review this notification.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  return sendEmail(adminEmail, `Admin Alert: ${subject}`, html);
};

// Bulk email utilities
export const sendBulkUserNotification = async (userEmails, subject, message) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center; }
        .content { padding: 20px; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>📢 Important Notification</h2>
        </div>
        <div class="content">
          <p>${message}</p>
          <p>If you have any questions, please contact support.</p>
        </div>
        <div class="footer">
          <p>Medical Visit Management System</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const results = [];
  for (const email of userEmails) {
    try {
      const result = await sendEmail(email, subject, html);
      results.push({ email, success: true, ...result });
    } catch (error) {
      results.push({ email, success: false, error: error.message });
    }
  }
  return results;
};

export default {
  sendActivationEmail,
  sendActivationConfirmationEmail,
  sendPasswordResetEmail,
  sendPasswordResetConfirmationEmail,
  sendOnboardingCompletionEmail,
  sendDeactivationNotificationEmail,
  sendLeaveRequestEmail,
  sendLeaveApprovalEmail,
  sendVisitReminderEmail,
  sendAdminNotificationEmail,
  sendBulkUserNotification
};