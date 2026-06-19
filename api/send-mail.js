const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.hostinger.com',
  port: 465,
  secure: true,
  auth: {
    user: 'info@teetotrailafrica.com',
    pass: process.env.SMTP_PASS,
  },
});

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://www.teetotrailafrica.com');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed' });

  const {
    firstName, lastName, email, phone,
    tourType, courses,
    groupSize, duration, dates, budget, accommodation, transport,
    message,
  } = req.body;

  if (!firstName || !email) {
    return res.status(400).json({ success: false, message: 'Please fill in all required fields.' });
  }

  const name = `${firstName} ${lastName || ''}`.trim();
  const subject = `Golf Tour Enquiry from ${name}`;

  const text = [
    'New tour enquiry from teetotrailafrica.com',
    '============================================',
    '',
    `Name:            ${name}`,
    `Email:           ${email}`,
    `Phone:           ${phone || '—'}`,
    '',
    `Tour Type:       ${tourType || '—'}`,
    `Courses:         ${Array.isArray(courses) ? courses.join(', ') : (courses || '—')}`,
    '',
    `Group Size:      ${groupSize || '—'}`,
    `Duration:        ${duration || '—'}`,
    `Dates:           ${dates || '—'}`,
    `Budget:          ${budget || '—'}`,
    `Accommodation:   ${accommodation || '—'}`,
    `Transport:       ${transport || '—'}`,
    '',
    'Message:',
    message || '—',
  ].join('\n');

  try {
    await transporter.sendMail({
      from: '"Tee to Trail Website" <info@teetotrailafrica.com>',
      to: 'info@teetotrailafrica.com',
      replyTo: email,
      subject,
      text,
    });
    return res.status(200).json({ success: true, message: "Thanks! We'll be in touch within one business day." });
  } catch (err) {
    console.error('Mail error:', err);
    return res.status(500).json({ success: false, message: 'Sorry, the message could not be sent. Please email us directly at info@teetotrailafrica.com' });
  }
};
