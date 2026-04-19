// Base email template with attractive styling
const baseTemplate = (content) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Medical Visit Management System</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          background-color: #f8f9fa;
          padding: 20px;
        }
        .email-container {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 15px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        .header {
          background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
          color: white;
          padding: 30px 20px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 700;
          text-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .content {
          background: white;
          padding: 40px 30px;
          color: #333;
        }
        .content h2 {
          color: #4facfe;
          font-size: 24px;
          margin-bottom: 20px;
          font-weight: 600;
        }
        .content p {
          margin-bottom: 20px;
          font-size: 16px;
          line-height: 1.7;
        }
        .btn {
          display: inline-block;
          background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
          color: white;
          text-decoration: none;
          padding: 15px 30px;
          border-radius: 50px;
          font-weight: 600;
          font-size: 16px;
          text-transform: uppercase;
          letter-spacing: 1px;
          box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
          transition: all 0.3s ease;
          margin: 20px 0;
        }
        .btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(255, 107, 107, 0.4);
        }
        .footer {
          background: #2c3e50;
          color: #ecf0f1;
          padding: 20px;
          text-align: center;
          font-size: 14px;
        }
        .footer p {
          margin: 5px 0;
        }
        .highlight {
          background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
          padding: 15px;
          border-radius: 10px;
          border-left: 5px solid #ff6b6b;
          margin: 20px 0;
        }
        .icon {
          font-size: 48px;
          margin-bottom: 15px;
        }
        .welcome-icon { color: #ffd93d; }
        .success-icon { color: #6bcf7f; }
        .warning-icon { color: #ff6b6b; }
        .info-icon { color: #4facfe; }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1>🏥 Medical Visit Management</h1>
        </div>
        <div class="content">
          ${content}
        </div>
        <div class="footer">
          <p><strong>Medical Visit Management System</strong></p>
          <p>Secure • Reliable • Efficient</p>
          <p>If you have any questions, contact our support team</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const activateUserTemplate = (name, token) => {
  const content = `
    <div style="text-align: center;">
      <div class="icon welcome-icon">🎉</div>
      <h2>Welcome to our platform, ${name}!</h2>
      <div class="highlight">
        <p>Thank you for registering with our Medical Visit Management System. We're excited to have you on board!</p>
      </div>
      <p>Your account is almost ready. Please click the button below to activate your account and start managing your medical visits efficiently.</p>
      <a href="http://localhost:3000/activate/${token}" class="btn">🚀 Activate My Account</a>
      <p style="color: #666; font-size: 14px; margin-top: 30px;">
        If the button doesn't work, copy and paste this link into your browser:<br>
        <span style="word-break: break-all; color: #4facfe;">http://localhost:3000/activate/${token}</span>
      </p>
      <p style="color: #666; font-size: 14px;">If you did not create an account, please ignore this email.</p>
    </div>
  `;
  return baseTemplate(content);
};

export const activationConfirmationTemplate = (name) => {
  const content = `
    <div style="text-align: center;">
      <div class="icon success-icon">✅</div>
      <h2>Account Activated Successfully!</h2>
      <div class="highlight">
        <p>Hi ${name}, your account has been successfully activated!</p>
      </div>
      <p>Your account is now fully active and ready to use. You can log in and start exploring all the features of our Medical Visit Management System.</p>
      <p>Here's what you can do now:</p>
      <ul style="text-align: left; display: inline-block; margin: 20px 0;">
        <li>📋 Manage patient visits and appointments</li>
        <li>📊 Track performance metrics</li>
        <li>👥 Collaborate with your team</li>
        <li>📱 Access from any device</li>
      </ul>
      <a href="http://localhost:3000/login" class="btn">🔐 Login Now</a>
      <p style="margin-top: 30px;">Thank you for joining our medical community! We're here to support your healthcare management needs.</p>
    </div>
  `;
  return baseTemplate(content);
};

export const passwordResetTemplate = (name, token) => {
  const content = `
    <div style="text-align: center;">
      <div class="icon warning-icon">🔐</div>
      <h2>Password Reset Request</h2>
      <div class="highlight">
        <p>Hi ${name}, we received a request to reset your password.</p>
      </div>
      <p>For security reasons, we need to verify your identity. Click the button below to reset your password securely.</p>
      <p style="color: #ff6b6b; font-weight: 600;">This link will expire in 24 hours for your security.</p>
      <a href="http://localhost:3000/reset-password/${token}" class="btn">🔑 Reset Password</a>
      <p style="color: #666; font-size: 14px; margin-top: 30px;">
        If the button doesn't work, copy and paste this link:<br>
        <span style="word-break: break-all; color: #4facfe;">http://localhost:3000/reset-password/${token}</span>
      </p>
      <p style="color: #666; font-size: 14px;">If you did not request a password reset, please ignore this email. Your account remains secure.</p>
    </div>
  `;
  return baseTemplate(content);
};

export const passwordResetConfirmationTemplate = (name) => {
  const content = `
    <div style="text-align: center;">
      <div class="icon success-icon">🔒</div>
      <h2>Password Reset Successful</h2>
      <div class="highlight">
        <p>Hi ${name}, your password has been successfully reset!</p>
      </div>
      <p>Your account security has been updated. You can now log in with your new password.</p>
      <p>For your security, we recommend:</p>
      <ul style="text-align: left; display: inline-block; margin: 20px 0;">
        <li>🔐 Use a strong, unique password</li>
        <li>🚫 Never share your password with others</li>
        <li>📱 Enable two-factor authentication if available</li>
        <li>⚠️ Contact support if you suspect unauthorized access</li>
      </ul>
      <a href="http://localhost:3000/login" class="btn">🔐 Login Securely</a>
      <p style="margin-top: 30px; color: #666;">If you did not perform this action, please contact our support team immediately.</p>
    </div>
  `;
  return baseTemplate(content);
};

export const onboardingCompletionTemplate = (name) => {
  const content = `
    <div style="text-align: center;">
      <div class="icon success-icon">🎊</div>
      <h2>Congratulations, ${name}!</h2>
      <div class="highlight">
        <p>Your onboarding process is now complete!</p>
      </div>
      <p>You now have full access to all features of our Medical Visit Management System. Start managing your visits and tracking performance metrics with confidence.</p>
      <p>Here's what you can explore:</p>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 25px 0; text-align: left;">
        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #4facfe;">
          <strong>📅 Visit Management</strong><br>
          <small>Schedule and track patient visits</small>
        </div>
        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #6bcf7f;">
          <strong>📈 Analytics</strong><br>
          <small>Monitor performance metrics</small>
        </div>
        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #ffd93d;">
          <strong>👥 Team Collaboration</strong><br>
          <small>Work seamlessly with colleagues</small>
        </div>
        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #ff6b6b;">
          <strong>📱 Mobile Access</strong><br>
          <small>Manage on the go</small>
        </div>
      </div>
      <a href="http://localhost:3000/dashboard" class="btn">🚀 Start Exploring</a>
      <p style="margin-top: 30px;">Thank you for joining us! We're excited to support you in your healthcare management journey.</p>
    </div>
  `;
  return baseTemplate(content);
};

export const deactivationNotificationTemplate = (name) => {
  const content = `
    <div style="text-align: center;">
      <div class="icon warning-icon">⚠️</div>
      <h2>Account Deactivation Notice</h2>
      <div class="highlight" style="background: linear-gradient(135deg, #ffeaa7 0%, #fab1a0 100%); border-left-color: #d63031;">
        <p>Hi ${name}, we wanted to inform you that your account has been deactivated.</p>
      </div>
      <p>This action may have been taken for security reasons or due to account policy violations. If you believe this is a mistake, please don't worry - we're here to help!</p>
      <p>What you can do next:</p>
      <ul style="text-align: left; display: inline-block; margin: 20px 0;">
        <li>📧 Contact our support team for clarification</li>
        <li>🔍 Review our terms of service</li>
        <li>✨ Request account reactivation if appropriate</li>
      </ul>
      <a href="mailto:support@medicalvisit.com" class="btn">📞 Contact Support</a>
      <p style="margin-top: 30px; color: #666;">Thank you for being a part of our platform. We hope to resolve this issue and welcome you back soon.</p>
    </div>
  `;
  return baseTemplate(content);
};

// New email templates for additional functionality
export const leaveRequestTemplate = (name, leaveType, startDate, endDate, reason) => {
  const content = `
    <div style="text-align: center;">
      <div class="icon info-icon">📋</div>
      <h2>Leave Request Submitted</h2>
      <div class="highlight">
        <p>Hi ${name}, your leave request has been submitted successfully!</p>
      </div>
      <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0; text-align: left;">
        <h3 style="color: #4facfe; margin-top: 0;">Leave Details:</h3>
        <p><strong>Type:</strong> ${leaveType}</p>
        <p><strong>From:</strong> ${startDate}</p>
        <p><strong>To:</strong> ${endDate}</p>
        <p><strong>Reason:</strong> ${reason || 'Not specified'}</p>
      </div>
      <p>Your request is now pending approval from your supervisor. You will be notified once a decision is made.</p>
      <p style="color: #666; font-size: 14px;">Thank you for keeping us informed about your availability.</p>
    </div>
  `;
  return baseTemplate(content);
};

export const leaveApprovalTemplate = (name, leaveType, startDate, endDate, status) => {
  const statusColor = status === 'approved' ? '#6bcf7f' : '#ff6b6b';
  const statusIcon = status === 'approved' ? '✅' : '❌';
  const statusText = status === 'approved' ? 'Approved' : 'Rejected';

  const content = `
    <div style="text-align: center;">
      <div class="icon" style="color: ${statusColor};">${statusIcon}</div>
      <h2>Leave Request ${statusText}</h2>
      <div class="highlight" style="border-left-color: ${statusColor};">
        <p>Hi ${name}, your leave request has been ${status}!</p>
      </div>
      <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0; text-align: left;">
        <h3 style="color: ${statusColor}; margin-top: 0;">Leave Details:</h3>
        <p><strong>Type:</strong> ${leaveType}</p>
        <p><strong>From:</strong> ${startDate}</p>
        <p><strong>To:</strong> ${endDate}</p>
        <p><strong>Status:</strong> <span style="color: ${statusColor}; font-weight: 600;">${statusText}</span></p>
      </div>
      ${status === 'approved'
        ? '<p>Enjoy your time off! Remember to update your out-of-office settings if needed.</p>'
        : '<p>If you have any questions about this decision, please contact your supervisor or HR department.</p>'
      }
      <p style="color: #666; font-size: 14px;">Thank you for your understanding.</p>
    </div>
  `;
  return baseTemplate(content);
};

export const visitReminderTemplate = (name, patientName, visitDate, visitTime, location) => {
  const content = `
    <div style="text-align: center;">
      <div class="icon info-icon">📅</div>
      <h2>Upcoming Visit Reminder</h2>
      <div class="highlight">
        <p>Hi ${name}, you have a medical visit scheduled soon!</p>
      </div>
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 25px; border-radius: 15px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: white;">Visit Details:</h3>
        <p style="margin: 8px 0;"><strong>Patient:</strong> ${patientName}</p>
        <p style="margin: 8px 0;"><strong>Date:</strong> ${visitDate}</p>
        <p style="margin: 8px 0;"><strong>Time:</strong> ${visitTime}</p>
        <p style="margin: 8px 0;"><strong>Location:</strong> ${location || 'TBD'}</p>
      </div>
      <p>Please ensure you have all necessary documents and equipment ready for this visit.</p>
      <div style="display: flex; justify-content: center; gap: 15px; margin: 25px 0;">
        <a href="#" style="background: #6bcf7f; color: white; padding: 12px 20px; border-radius: 25px; text-decoration: none; font-weight: 600;">✅ Confirm Visit</a>
        <a href="#" style="background: #ff6b6b; color: white; padding: 12px 20px; border-radius: 25px; text-decoration: none; font-weight: 600;">📝 Reschedule</a>
      </div>
      <p style="color: #666; font-size: 14px;">If you need to make changes, please contact the clinic as soon as possible.</p>
    </div>
  `;
  return baseTemplate(content);
};




