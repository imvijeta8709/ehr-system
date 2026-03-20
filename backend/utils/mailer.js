const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

exports.sendWelcomeEmail = async (email, name) => {
  if (!process.env.EMAIL_USER) return; // Skip if not configured
  await transporter.sendMail({
    from: `"EHR System" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Welcome to EHR System',
    html: `<h2>Welcome, ${name}!</h2><p>Your account has been created successfully.</p>`,
  });
};
