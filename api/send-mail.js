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

const RATE_MAX = 5;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 500) hits.delete(hits.keys().next().value);
  return recent.length > RATE_MAX;
}

// Strip CR/LF from any value that reaches an email header (prevents header injection).
const clean = (s) => String(s || '').replace(/[\r\n]+/g, ' ').trim();

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
    message, company, ts,
  } = req.body;

  // Honeypot: bots fill the hidden field; drop silently with a fake success.
  if (company) return res.status(200).json({ success: true });

  // Min-fill-time: this form takes longer than 3s to complete; bots submit instantly.
  if (ts && Date.now() - Number(ts) < 3000) return res.status(200).json({ success: true });

  // Best-effort per-IP rate limit (per warm serverless instance).
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  if (rateLimited(ip)) {
    return res.status(429).json({ success: false, message: 'Too many messages. Please try again in a few minutes.' });
  }

  if (!firstName || !email) {
    return res.status(400).json({ success: false, message: 'Please fill in all required fields.' });
  }

  if (String(message || '').length > 5000 || `${firstName || ''}${lastName || ''}`.length > 200) {
    return res.status(400).json({ success: false, message: 'Message is too long.' });
  }

  const name = `${firstName} ${lastName || ''}`.trim();
  const subject = `Golf Tour Enquiry from ${clean(name)}`;

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
      replyTo: clean(email),
      subject,
      text,
    });
    return res.status(200).json({ success: true, message: "Thanks! We'll be in touch within one business day." });
  } catch (err) {
    console.error('Mail error:', err);
    return res.status(500).json({ success: false, message: 'Sorry, the message could not be sent. Please email us directly at info@teetotrailafrica.com' });
  }
};
