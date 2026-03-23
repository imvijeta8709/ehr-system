// const nodemailer = require('nodemailer');

// const transporter = nodemailer.createTransport({
//   host: process.env.EMAIL_HOST,
//   port: process.env.EMAIL_PORT,
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   },
// });

const send = (to, subject, html) => {
  console.log(`[Mailer] Email skipped (SMTP disabled): ${subject} → ${to}`);
  return Promise.resolve();
};

exports.sendWelcomeEmail = (email, name) =>
  send(email, 'Welcome to EHR System', '');

exports.sendOTPEmail = (email, name, otp) => {
  console.log(`[Mailer] OTP for ${email}: ${otp}`);
  return send(email, 'Password Reset OTP', '');
};
