const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    // =========================
    // USER DETAILS
    // =========================

    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["org_admin", "sales_manager", "sales_rep", "super_admin"],
      default: "org_admin",
    },

    avatar: {
      type: String,
      default: null,
    },

    // =========================
    // OTP
    // =========================

    otp: {
      type: String,
      default: null,
    },

    otpExpires: {
      type: Date,
      default: null,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    // =========================
    // PASSWORD RESET
    // =========================

    resetPasswordVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

module.exports = User;