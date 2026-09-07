const express = require("express");
const User    = require("../models/userSchema");

const userRouter = express.Router();

// GET /users/ — health check
userRouter.get("/", (req, res) => {
  res.json({ status: 200, message: "Users route is working." });
});

// GET /users/profile — return current user from token
userRouter.get("/profile", async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password -otp -otpExpires");
    if (!user) return res.status(404).json({ status: 404, message: "User not found." });
    res.json({ status: 200, user });
  } catch (err) {
    res.status(500).json({ status: 500, message: "Internal server error." });
  }
});

// PUT /users/profile — update fullName, phone, avatar
userRouter.put("/profile", async (req, res) => {
  try {
    const { fullName, phone, avatar } = req.body;

    if (!fullName || !fullName.trim()) {
      return res.status(400).json({ status: 400, message: "Full name is required." });
    }

    const updates = {
      fullName: fullName.trim(),
      phone: (phone || "").trim(),
    };

    // Only update avatar if provided (allow clearing with null)
    if (avatar !== undefined) {
      updates.avatar = avatar || null;
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select("-password -otp -otpExpires");

    if (!user) return res.status(404).json({ status: 404, message: "User not found." });

    res.json({
      status: 200,
      message: "Profile updated successfully.",
      user: {
        id:       user._id,
        fullName: user.fullName,
        email:    user.email,
        phone:    user.phone,
        role:     user.role,
        avatar:   user.avatar,
      },
    });
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({ status: 400, message: err.message });
    }
    res.status(500).json({ status: 500, message: "Internal server error." });
  }
});

module.exports = userRouter;