const crypto = require("crypto");
const sendOtpEmail = require("./emailService");

const OTP_EXPIRY_MINUTES = 10;
const MAX_OTP_RESENDS = 5;
const OTP_BLOCK_MINUTES = 10;
const OTP_RESEND_COOLDOWN_SECONDS = 60;
const MAX_OTP_ATTEMPTS = 5;
const RESET_TOKEN_EXPIRY_MINUTES = 10;

const sha256 = (value) =>
  crypto.createHash("sha256").update(String(value)).digest("hex");

const generateOtp = () => crypto.randomInt(100000, 1000000).toString();
const hashOtp = (otp) => sha256(otp);
const generateSecureToken = () => crypto.randomBytes(32).toString("hex");
const hashToken = (token) => sha256(token);

const minutesFromNow = (minutes) =>
  new Date(Date.now() + minutes * 60 * 1000);

const getOtpExpiry = () => minutesFromNow(OTP_EXPIRY_MINUTES);
const getResetTokenExpiry = () => minutesFromNow(RESET_TOKEN_EXPIRY_MINUTES);

const remainingSeconds = (until) =>
  Math.max(0, Math.ceil((until - Date.now()) / 1000));

const checkResendCooldown = (user) => { 
  if (user.otpResendAvailableAt && Date.now() < user.otpResendAvailableAt) {
    return {
      allowed: false,
      remainingSeconds: remainingSeconds(user.otpResendAvailableAt),
    };
  }
  return { allowed: true, remainingSeconds: 0 };
};

const checkOtpRateLimit = (user) => {
  if (user.otpResendBlockedUntil && Date.now() < user.otpResendBlockedUntil) {
    const minutes = Math.ceil((user.otpResendBlockedUntil - Date.now()) / 60000);
    return {
      allowed: false,
      message: `Too many OTP requests. Please wait ${minutes} minutes.`,
    };
  }

  if (user.otpResendBlockedUntil && Date.now() >= user.otpResendBlockedUntil) {
    user.otpResendBlockedUntil = null;
    user.otpResendCount = 0;
    user.otpResendWindowStartedAt = null;
  }

  return { allowed: true };
};

const issueOtp = async (user) => {
  const rateLimit = checkOtpRateLimit(user);
  if (!rateLimit.allowed) {
    const error = new Error(rateLimit.message);
    error.code = "OTP_RATE_LIMIT";
    throw error;
  }

  const cooldown = checkResendCooldown(user);
  if (!cooldown.allowed) {
    const error = new Error(
      `Please wait ${cooldown.remainingSeconds} seconds before requesting another OTP.`
    );
    error.code = "OTP_COOLDOWN";
    error.remainingSeconds = cooldown.remainingSeconds;
    throw error;
  }

  const otp = generateOtp();
  user.resetOtp = hashOtp(otp);
  user.resetOtpExpires = getOtpExpiry();
  user.otpAttempts = 0;
  user.otpResendAvailableAt = new Date(
    Date.now() + OTP_RESEND_COOLDOWN_SECONDS * 1000
  );
  await user.save();

  try {
    await sendOtpEmail(user.email, otp, user.fullName);
  } catch (error) {
    user.resetOtp = null;
    user.resetOtpExpires = null;
    user.otpAttempts = 0;
    user.otpResendAvailableAt = null;
    await user.save();
    throw error;
  }

  return {
    otpExpires: user.resetOtpExpires,
    resendAvailableAt: user.otpResendAvailableAt,
  };
};

module.exports = {
  generateOtp,
  hashOtp,
  generateSecureToken,
  hashToken,
  getOtpExpiry,
  getResetTokenExpiry,
  checkResendCooldown,
  checkOtpRateLimit,
  issueOtp,
  MAX_OTP_RESENDS,
  OTP_BLOCK_MINUTES,
  MAX_OTP_ATTEMPTS,
};
