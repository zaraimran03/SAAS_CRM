const emailjs = require('@emailjs/nodejs');

async function sendOtpEmail(email, otp, fullName = 'User') {
  const serviceId  = process.env.EMAILJS_SERVICE_ID;
  const templateId = process.env.EMAILJS_TEMPLATE_ID;
  const publicKey  = process.env.EMAILJS_PUBLIC_KEY;
  const privateKey = process.env.EMAILJS_PRIVATE_KEY;

  if (!serviceId || !templateId || !publicKey) {
    throw new Error('EmailJS environment variables are missing.');
  }

  const templateParams = {
    to_email: email,
    email:    email,
    name:     fullName,
    otp:      otp,
    message:  `Your Mini CRM verification code is ${otp}. This code expires in 10 minutes.`,
  };

  // Build the credentials object
  const credentials = { publicKey };
  if (privateKey) {
    credentials.privateKey = privateKey;
  }

  await emailjs.send(serviceId, templateId, templateParams, credentials);
}

async function sendInvitationEmail(email, fullName, role, invitationUrl) {
  const serviceId  = process.env.EMAILJS_SERVICE_ID;
  const templateId = process.env.EMAILJS_TEMPLATE_ID;
  const publicKey  = process.env.EMAILJS_PUBLIC_KEY;
  const privateKey = process.env.EMAILJS_PRIVATE_KEY;

  if (!serviceId || !templateId || !publicKey) {
    throw new Error('EmailJS environment variables are missing.');
  }

  const credentials = { publicKey };
  if (privateKey) credentials.privateKey = privateKey;

  await emailjs.send(serviceId, templateId, {
    to_email: email,
    email,
    name: fullName,
    otp: invitationUrl,
    message: `You have been invited to Mini CRM as ${role}. Accept your invitation here: ${invitationUrl}`,
  }, credentials);
}

module.exports = sendOtpEmail;
module.exports.sendInvitationEmail = sendInvitationEmail;