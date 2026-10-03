const emailjs = require('@emailjs/nodejs');

function getCredentials() {
  const serviceId  = process.env.EMAILJS_SERVICE_ID;
  const templateId = process.env.EMAILJS_TEMPLATE_ID;
  const publicKey  = process.env.EMAILJS_PUBLIC_KEY;
  const privateKey = process.env.EMAILJS_PRIVATE_KEY;

  if (!serviceId || !templateId || !publicKey) {
    throw new Error('EmailJS environment variables are missing.');
  }

  const credentials = { publicKey };
  if (privateKey) credentials.privateKey = privateKey;

  return { serviceId, templateId, credentials };
}

/**
 * Send OTP verification email during signup / password reset.
 */
async function sendOtpEmail(email, otp, fullName = 'User') {
  const { serviceId, templateId, credentials } = getCredentials();

  await emailjs.send(serviceId, templateId, {
    to_email: email,
    email,
    name:     fullName,
    otp,
    message: `Your Mini CRM verification code is ${otp}. This code expires in 10 minutes.`,
  }, credentials);
}

/**
 * Send a team invitation email.
 * The invitation URL is passed in the `otp` field so it works with the
 * existing EmailJS template — the template should display the `otp` field
 * as a clickable link or plain URL.
 */
async function sendInvitationEmail(email, fullName, role, invitationUrl) {
  const { serviceId, templateId, credentials } = getCredentials();

  const roleLabel = {
    org_admin:     'Admin',
    sales_manager: 'Sales Manager',
    sales_rep:     'Sales Rep',
    viewer:        'Viewer',
  }[role] || role;

  await emailjs.send(serviceId, templateId, {
    to_email: email,
    email,
    name:    fullName,
    otp:     invitationUrl,
    message: `You have been invited to join Mini CRM as ${roleLabel}.\n\nClick the link below to accept your invitation and set your password:\n\n${invitationUrl}\n\nThis link expires in 48 hours.`,
  }, credentials);
}

module.exports = sendOtpEmail;
module.exports.sendInvitationEmail = sendInvitationEmail;