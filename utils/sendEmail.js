import transporter from "../configue/mail.js";

const sendEmail = async (to, subject, html, options = {}) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to,
            subject,
            html,
            ...options 
        };

        const result = await transporter.sendMail(mailOptions);

        if (result) {
            console.log(`✅ Email sent successfully to ${to} - Subject: ${subject}`);
            return {
                success: true,
                messageId: result.messageId,
                response: result.response
            };
        }
    } catch (error) {
        console.error(`❌ Failed to send email to ${to}:`, error.message);
        throw new Error(`Failed to send email: ${error.message}`);
    }
};

// Send bulk emails
const sendBulkEmail = async (recipients, subject, html, options = {}) => {
    const results = [];
    const errors = [];

    for (const recipient of recipients) {
        try {
            const result = await sendEmail(recipient, subject, html, options);
            results.push({ email: recipient, ...result });
        } catch (error) {
            errors.push({ email: recipient, error: error.message });
        }
    }

    return { results, errors };
};

// Send email with attachment
const sendEmailWithAttachment = async (to, subject, html, attachments = []) => {
    return sendEmail(to, subject, html, { attachments });
};

export default sendEmail;
export { sendBulkEmail, sendEmailWithAttachment };