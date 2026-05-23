#!/usr/bin/env node

const nodemailer = require('nodemailer');

const host = process.env.SMTP_HOST;
const port = parseInt(process.env.SMTP_PORT || '587', 10);
const secure = (process.env.SMTP_SECURE === 'true') || port === 465;
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;
const from = process.env.EMAIL_FROM;
const to = process.env.TEST_EMAIL_TO || user;

function fail(msg) {
  console.error(msg);
  process.exit(2);
}

if (!host) fail('SMTP_HOST is not set');
if (!user) fail('SMTP_USER is not set');
if (!pass) fail('SMTP_PASS is not set');
if (!from) fail('EMAIL_FROM is not set');
if (!to) fail('TEST_EMAIL_TO or SMTP_USER must be set');

const transporter = nodemailer.createTransport({
  host,
  port,
  secure,
  auth: { user, pass },
});

(async () => {
  try {
    console.log('Verifying SMTP connection...');
    await transporter.verify();
    console.log('SMTP connection OK. Sending test email to', to);
    const info = await transporter.sendMail({
      from,
      to,
      subject: 'CTK EnrollSys – SMTP Test',
      text: 'This is a test email sent by CTK EnrollSys diagnostic script.',
      html: '<p>This is a test email sent by CTK EnrollSys diagnostic script.</p>',
    });
    console.log('Message sent:', info);
    process.exit(0);
  } catch (err) {
    console.error('Failed to send test email:', err);
    process.exit(3);
  }
})();
