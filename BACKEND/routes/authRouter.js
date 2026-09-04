
const express = require("express");
const yup = require("yup");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/userSchema");
const sendOtpEmail = require("../utils/emailService");

const authRouter = express.Router();

// ======================================================
// HELPERS
// ======================================================

const generateOtp = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const otpExpiry = () =>
  new Date(Date.now() + 5 * 60 * 1000);

// ======================================================
// PASSWORD VALIDATION
// ======================================================

const passwordSchema = yup
  .string()
  .required("Password is required")
  .min(8, "Password must be at least 8 characters")
  .matches(
    /[A-Z]/,
    "Password must contain at least one uppercase letter"
  )
  .matches(
    /[a-z]/,
    "Password must contain at least one lowercase letter"
  )
  .matches(
    /[0-9]/,
    "Password must contain at least one number"
  )
  .matches(
    /[^A-Za-z0-9]/,
    "Password must contain at least one special character"
  );

// ======================================================
// REGISTER VALIDATION
// ======================================================

const registerSchema = yup.object({
  fullName: yup
    .string()
    .required("Full Name is required")
    .trim(),

  email: yup
    .string()
    .email("Invalid email format")
    .required("Email is required")
    .trim()
    .lowercase(),

  phone: yup
    .string()
    .required("Phone number is required")
    .trim(),

  password: passwordSchema,
});

// ======================================================
// LOGIN VALIDATION
// ======================================================

const loginSchema = yup.object({
  email: yup
    .string()
    .email("Invalid email format")
    .required("Email is required")
    .trim()
    .lowercase(),

  password: yup
    .string()
    .required("Password is required"),
});

// ======================================================
// REGISTER
// POST /auth/register
// ======================================================

authRouter.post("/register", async (req, res) => {
  try {
    const {
      fullName,
      email,
      phone,
      password,
      confirmPassword,
    } = req.body;

    // Check passwords
    if (password !== confirmPassword) {
      return res.status(400).json({
        status: 400,
        message: "Passwords do not match",
      });
    }

    // Validate data
    const data = await registerSchema.validate(
      {
        fullName,
        email,
        phone,
        password,
      },
      {
        abortEarly: true,
      }
    );

    // Check existing email
    const existingUser = await User.findOne({
      email: data.email,
    });

    if (existingUser) {
      return res.status(409).json({
        status: 409,
        message: "Email is already registered",
      });
    }

    // Generate OTP
    const otp = generateOtp();

    // Create user
    const user = new User({
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      password: await bcrypt.hash(data.password, 10),

      otp: otp,
      otpExpires: otpExpiry(),

      isVerified: false,
    });

    await user.save();

    // Send OTP email
    await sendOtpEmail(
      user.email,
      otp,
      user.fullName
    );

    return res.status(201).json({
      status: 201,
      message: "OTP sent successfully",
      email: user.email,
    });
  } catch (error) {
    console.error("Register error:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        status: 400,
        message: error.message,
      });
    }

    return res.status(500).json({
      status: 500,
      message: "Internal server error",
    });
  }
});

// ======================================================
// VERIFY SIGNUP OTP
// POST /auth/verify-otp
// ======================================================

authRouter.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({
      email: email.toLowerCase(),
    });

    if (!user) {
      return res.status(404).json({
        status: 404,
        message: "User not found",
      });
    }

    // No OTP
    if (!user.otp) {
      return res.status(400).json({
        status: 400,
        message: "OTP expired. Please register again.",
      });
    }

    // OTP expired
    if (new Date() > user.otpExpires) {
      user.otp = null;
      user.otpExpires = null;

      await user.save();

      return res.status(400).json({
        status: 400,
        message: "OTP expired. Please request a new OTP.",
      });
    }

    // Wrong OTP
    if (user.otp !== otp) {
      return res.status(400).json({
        status: 400,
        message: "Invalid OTP",
      });
    }

    // Verify user
    user.isVerified = true;
    user.otp = null;
    user.otpExpires = null;

    await user.save();

    return res.status(200).json({
      status: 200,
      message: "OTP verified successfully",
    });
  } catch (error) {
    console.error("OTP error:", error);

    return res.status(500).json({
      status: 500,
      message: "Internal server error",
    });
  }
});

// ======================================================
// LOGIN
// POST /auth/login
// ======================================================

authRouter.post("/login", async (req, res) => {
  try {
    const data = await loginSchema.validate(req.body);

    const user = await User.findOne({
      email: data.email,
    });

    // User not found
    if (!user) {
      return res.status(401).json({
        status: 401,
        message: "Invalid email or password",
      });
    }

    // User not verified
    if (!user.isVerified) {
      return res.status(403).json({
        status: 403,
        message: "Please verify your email with OTP first",
        email: user.email,
        requiresVerification: true,
      });
    }

    // Check password
    const passwordMatch = await bcrypt.compare(
      data.password,
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        status: 401,
        message: "Invalid email or password",
      });
    }

    // Issue JWT
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    return res.status(200).json({
      status: 200,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        status: 400,
        message: error.message,
      });
    }

    return res.status(500).json({
      status: 500,
      message: "Internal server error",
    });
  }
});

// ======================================================
// FORGOT PASSWORD
// POST /auth/forgot-password
// ======================================================

authRouter.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({
      email: email.toLowerCase(),
    });

    if (!user) {
      return res.status(404).json({
        status: 404,
        message: "Email not found",
      });
    }

    // Generate OTP
    const otp = generateOtp();

    user.otp = otp;
    user.otpExpires = otpExpiry();

    await user.save();

    // Send OTP email
    await sendOtpEmail(
      user.email,
      otp,
      user.fullName
    );

    return res.status(200).json({
      status: 200,
      message: "Password reset OTP sent successfully",
      email: user.email,
    });
  } catch (error) {
    console.error("Forgot password error:", error);

    return res.status(500).json({
      status: 500,
      message: "Internal server error",
    });
  }
});

// ======================================================
// VERIFY RESET OTP
// POST /auth/verify-reset-otp
// ======================================================

authRouter.post("/verify-reset-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({
      email: email.toLowerCase(),
    });

    if (!user) {
      return res.status(404).json({
        status: 404,
        message: "User not found",
      });
    }

    // No OTP
    if (!user.otp) {
      return res.status(400).json({
        status: 400,
        message: "OTP expired",
      });
    }

    // OTP expired
    if (new Date() > user.otpExpires) {
      user.otp = null;
      user.otpExpires = null;

      await user.save();

      return res.status(400).json({
        status: 400,
        message: "OTP expired",
      });
    }

    // Wrong OTP
    if (user.otp !== otp) {
      return res.status(400).json({
        status: 400,
        message: "Invalid OTP",
      });
    }

    // Clear OTP
    user.otp = null;
    user.otpExpires = null;

    await user.save();

    return res.status(200).json({
      status: 200,
      message: "OTP verified successfully",
    });
  } catch (error) {
    console.error("Reset OTP error:", error);

    return res.status(500).json({
      status: 500,
      message: "Internal server error",
    });
  }
});

// ======================================================
// RESET PASSWORD
// POST /auth/reset-password
// ======================================================

authRouter.post("/reset-password", async (req, res) => {
  try {
    const {
      email,
      password,
      confirmPassword,
    } = req.body;

    // Check passwords
    if (password !== confirmPassword) {
      return res.status(400).json({
        status: 400,
        message: "Passwords do not match",
      });
    }

    // Validate password
    await passwordSchema.validate(password);

    const user = await User.findOne({
      email: email.toLowerCase(),
    });

    if (!user) {
      return res.status(404).json({
        status: 404,
        message: "User not found",
      });
    }

    // Hash new password
    user.password = await bcrypt.hash(
      password,
      10
    );

    await user.save();

    return res.status(200).json({
      status: 200,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Reset password error:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        status: 400,
        message: error.message,
      });
    }

    return res.status(500).json({
      status: 500,
      message: "Internal server error",
    });
  }
});

// ======================================================
// CHECK EMAIL
// POST /auth/check-email
// Used by the Login page's "Forgot Password?" link to
// confirm the address is registered before redirecting.
// ======================================================

authRouter.post("/check-email", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        status: 400,
        message: "Email is required",
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    if (!user) {
      return res.status(404).json({
        status: 404,
        message: "Email not found",
      });
    }

    return res.status(200).json({
      status: 200,
      message: "Email exists",
    });
  } catch (error) {
    console.error("Check email error:", error);
    return res.status(500).json({
      status: 500,
      message: "Internal server error",
    });
  }
});

// ======================================================
// RESEND SIGNUP OTP
// POST /auth/resend-otp
// Used by the OTP page when the user requests a new
// verification code during the signup flow.
// ======================================================

authRouter.post("/resend-otp", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        status: 400,
        message: "Email is required",
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    if (!user) {
      return res.status(404).json({
        status: 404,
        message: "User not found",
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        status: 400,
        message: "Account is already verified. Please log in.",
      });
    }

    // Generate a fresh OTP
    const otp = generateOtp();
    user.otp = otp;
    user.otpExpires = otpExpiry();
    await user.save();

    await sendOtpEmail(user.email, otp, user.fullName);

    return res.status(200).json({
      status: 200,
      message: "A new OTP has been sent to your email.",
      email: user.email,
    });
  } catch (error) {
    console.error("Resend OTP error:", error);
    return res.status(500).json({
      status: 500,
      message: "Internal server error",
    });
  }
});

module.exports = authRouter;

