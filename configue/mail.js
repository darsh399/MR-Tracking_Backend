import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const { EMAIL_USER, EMAIL_PASS } = process.env;

if (!EMAIL_USER || !EMAIL_PASS) {
  throw new Error('Missing EMAIL_USER or EMAIL_PASS in .env. Use a valid Gmail app password.');
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS
  }
});

console.log('Using plain Nodemailer Gmail auth transport');
export default transporter;