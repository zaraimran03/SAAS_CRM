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
      default: "",
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["org_admin", "sales_manager", "sales_rep", "viewer", "super_admin"],
      default: "org_admin",
    },

    status: {
      type: String,
      enum: ["Active", "Pending", "Inactive"],
      default: "Active",
    },

    notificationPreferences: {
      taskAssigned: { type: Boolean, default: true },
      taskDue: { type: Boolean, default: true },
      taskOverdue: { type: Boolean, default: true },
      newLeadAssigned: { type: Boolean, default: true },
      dealWon: { type: Boolean, default: false },
      dealLost: { type: Boolean, default: true },
      newActivity: { type: Boolean, default: true },
      emailNotifications: { type: Boolean, default: true },
      inAppNotifications: { type: Boolean, default: true },
    },

    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      index: true,
    },

    invitationTokenHash: {
      type: String,
      default: null,
      select: false,
    },

    invitationExpires: {
      type: Date,
      default: null,
      select: false,
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