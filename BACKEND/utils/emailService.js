const emailjs = require('@emailjs/nodejs');

/**
 * Build shared EmailJS credentials from env vars.
 * Throws if required vars are missing.
 */
function getCredentials() {
  const serviceId  = process.env.EMAILJS_SERVICE_ID;
  const publicKey  = process.env.EMAILJS_PUBLIC_KEY;
  const privateKey = process.env.EMAILJS_PRIVATE_KEY;

  if (!serviceId || !publicKey) {
    throw new Error('EmailJS environment variables (SERVICE_ID, PUBLIC_KEY) are missing.');
  }

  const credentials = { publicKey };
  if (privateKey) credentials.privateKey = privateKey;

  return { serviceId, credentials };
}

// ── OTP / verification emails ─────────────────────────────────────────────

/**
 * Send a one-time password (OTP) email using the OTP template.
 * Template variables expected: to_email, name, otp, message
 */
async function sendOtpEmail(email, otp, fullName = 'User') {
  const { serviceId, credentials } = getCredentials();
  const templateId = process.env.EMAILJS_TEMPLATE_ID;

  if (!templateId) throw new Error('EMAILJS_TEMPLATE_ID is missing.');

  await emailjs.send(serviceId, templateId, {
    to_email: email,
    email,
    name:     fullName,
    otp,
    message:  `Your Mini CRM verification code is ${otp}. This code expires in 10 minutes.`,
  }, credentials);
}

// ── Invitation emails ─────────────────────────────────────────────────────

const ROLE_DISPLAY = {
  org_admin:     'Admin',
  sales_manager: 'Sales Manager',
  sales_rep:     'Sales Rep',
  viewer:        'Viewer',
};

/**
 * Send a team-invitation email using the dedicated invitation template.
 *
 * Template variables expected by EMAILJS_INVITATION_TEMPLATE_ID:
 *   to_email      – recipient address
 *   name          – invitee's full name
 *   role          – human-readable role label
 *   invitation_url – the accept-invitation link
 *   message       – plain-text fallback body
 */
async function sendInvitationEmail(email, fullName, role, invitationUrl) {
  const { serviceId, credentials } = getCredentials();

  // Use the dedicated invitation template; fall back to the OTP template if
  // the operator hasn't created one yet (shows a console warning).
  const templateId = process.env.EMAILJS_INVITATION_TEMPLATE_ID || process.env.EMAILJS_TEMPLATE_ID;
  if (!templateId) throw new Error('EMAILJS_INVITATION_TEMPLATE_ID (or EMAILJS_TEMPLATE_ID) is missing.');

  if (!process.env.EMAILJS_INVITATION_TEMPLATE_ID) {
    console.warn('[emailService] EMAILJS_INVITATION_TEMPLATE_ID is not set — falling back to OTP template.');
  }

  const roleLabel = ROLE_DISPLAY[role] || role;

  await emailjs.send(serviceId, templateId, {
    to_email:       email,
    email,
    name:           fullName,
    role:           roleLabel,
    invitation_url: invitationUrl,
    // otp field kept for backward-compat if still using old template
    otp:            invitationUrl,
    message: [
      `Hi ${fullName},`,
      ``,
      `You have been invited to join Mini CRM as ${roleLabel}.`,
      ``,
      `Accept your invitation here:`,
      invitationUrl,
      ``,
      `This link expires in 48 hours.`,
    ].join('\n'),
  }, credentials);
}

module.exports = sendOtpEmail;
module.exports.sendInvitationEmail = sendInvitationEmail;