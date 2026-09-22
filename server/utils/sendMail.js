const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

function getCredentials() {
  try {
    const envPath = path.resolve(__dirname, '../.env');
    if (fs.existsSync(envPath)) {
      const parsed = dotenv.parse(fs.readFileSync(envPath, 'utf-8'));
      const user = (parsed.MAIL_USER || parsed.EMAIL_USER || process.env.MAIL_USER || process.env.EMAIL_USER || '').trim();
      const pass = (parsed.MAIL_PASS || parsed.EMAIL_PASS || process.env.MAIL_PASS || process.env.EMAIL_PASS || '').replace(/\s+/g, '').trim();
      console.log('[sendMail getCredentials from .env file]', { user, passLength: pass.length, passFirst3: pass.slice(0, 3) });
      return { user, pass };
    }
  } catch (err) {
    console.warn('[sendMail] Falling back to process.env', err.message);
  }
  const user = (process.env.MAIL_USER || process.env.EMAIL_USER || '').trim();
  const pass = (process.env.MAIL_PASS || process.env.EMAIL_PASS || '').replace(/\s+/g, '').trim();
  console.log('[sendMail getCredentials from process.env]', { user, passLength: pass.length, passFirst3: pass.slice(0, 3) });
  return { user, pass };
}

const sendMail = async ({ to, subject, html, replyTo }) => {
  const { user, pass } = getCredentials();

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user,
      pass,
    },
  });

  return await transporter.sendMail({
    from: `"KN Advisors" <${user}>`,
    to,
    replyTo: replyTo || 'avinashs@knadvisors.pro',
    subject,
    html,
  });
};

module.exports = sendMail;
