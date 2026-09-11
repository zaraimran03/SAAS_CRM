const express = require("express");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const User    = require("../models/userSchema");
const { sendInvitationEmail } = require("../utils/emailService");

const userRouter = express.Router();
const MANAGEMENT_ROLES = ["org_admin", "sales_manager"];
const ROLE_VALUES = ["org_admin", "sales_manager", "sales_rep", "viewer"];

const getCurrentUser = (req) => User.findById(req.user.id);
const canManageMembers = (user) => MANAGEMENT_ROLES.includes(user?.role);
const isAdmin = (user) => user?.role === "org_admin";
const memberFields = "-password -otp -otpExpires -resetOtp -resetOtpExpires";

const sameOrganization = (currentUser, member) => (
  member.organizationId?.toString() === currentUser.organizationId?.toString()
);

const publicMember = (member) => ({
  id: member._id,
  _id: member._id,
  fullName: member.fullName,
  email: member.email,
  role: member.role,
  status: member.status,
  avatar: member.avatar,
  organizationId: member.organizationId,
  createdAt: member.createdAt,
  updatedAt: member.updatedAt,
  notificationPreferences: member.notificationPreferences,
});

const rejectMemberAdminTarget = (currentUser, target) => (
  currentUser.role === "sales_manager" && target.role === "org_admin"
);
const hashInvitationToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

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

// GET /users/members — organization-scoped member management.
userRouter.get("/members", async (req, res) => {
  try {
    const currentUser = await getCurrentUser(req);
    if (!canManageMembers(currentUser)) return res.status(403).json({ message: "Member management access is required." });
    const members = await User.find({ organizationId: currentUser.organizationId }).select(memberFields).sort({ createdAt: -1 });
    res.json({ success: true, members: members.map(publicMember) });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch members." });
  }
});

// POST /users/members — create a pending invitation in the current org.
userRouter.post("/members", async (req, res) => {
  try {
    const currentUser = await getCurrentUser(req);
    if (!canManageMembers(currentUser)) return res.status(403).json({ message: "Member management access is required." });
    const { fullName, email, role } = req.body;
    const normalizedEmail = String(email || "").trim().toLowerCase();
    if (!fullName?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) || !ROLE_VALUES.includes(role)) {
      return res.status(400).json({ message: "Name, valid email, and role are required." });
    }
    if (role === "org_admin" && !isAdmin(currentUser)) return res.status(403).json({ message: "Only an admin can invite another admin." });
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) return res.status(409).json({ message: "A member with this email already exists." });
    const invitationToken = crypto.randomBytes(32).toString("hex");
    const member = await User.create({
      fullName: fullName.trim(), email: normalizedEmail, phone: "", role,
      status: "Pending", isVerified: false,
      organizationId: currentUser.organizationId,
      password: await bcrypt.hash(crypto.randomBytes(24).toString("hex"), 10),
      invitationTokenHash: hashInvitationToken(invitationToken),
      invitationExpires: new Date(Date.now() + 48 * 60 * 60 * 1000),
    });
    try {
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
      const invitationUrl = `${frontendUrl}/accept-invitation?token=${invitationToken}`;
      await sendInvitationEmail(normalizedEmail, member.fullName, ROLE_VALUES.includes(role) ? role.replace("org_", "").replace("sales_", "Sales ") : role, invitationUrl);
    } catch (emailError) {
      await User.findByIdAndDelete(member._id);
      return res.status(502).json({ message: "Invitation email could not be sent. Please try again." });
    }
    res.status(201).json({ success: true, member: publicMember(member) });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to invite member." });
  }
});

// POST /users/members/:id/resend-invitation — issue and send a fresh invite.
userRouter.post("/members/:id/resend-invitation", async (req, res) => {
  try {
    const currentUser = await getCurrentUser(req);
    if (!canManageMembers(currentUser)) return res.status(403).json({ message: "Member management access is required." });
    const member = await User.findById(req.params.id).select("+invitationTokenHash +invitationExpires");
    if (!member || !sameOrganization(currentUser, member)) return res.status(404).json({ message: "Member not found." });
    if (member.status !== "Pending") return res.status(400).json({ message: "Only pending invitations can be resent." });
    if (rejectMemberAdminTarget(currentUser, member)) return res.status(403).json({ message: "Managers cannot resend admin invitations." });
    const invitationToken = crypto.randomBytes(32).toString("hex");
    member.invitationTokenHash = hashInvitationToken(invitationToken);
    member.invitationExpires = new Date(Date.now() + 48 * 60 * 60 * 1000);
    await member.save();
    try {
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
      await sendInvitationEmail(member.email, member.fullName, member.role, `${frontendUrl}/accept-invitation?token=${invitationToken}`);
    } catch (emailError) {
      return res.status(502).json({ message: "Invitation email could not be sent. Please try again." });
    }
    res.json({ success: true, message: "Invitation resent successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to resend invitation." });
  }
});

// PATCH /users/members/:id — role/status changes, organization-scoped.
userRouter.patch("/members/:id", async (req, res) => {
  try {
    const currentUser = await getCurrentUser(req);
    if (!canManageMembers(currentUser)) return res.status(403).json({ message: "Member management access is required." });
    const member = await User.findById(req.params.id);
    if (!member || !sameOrganization(currentUser, member)) return res.status(404).json({ message: "Member not found." });
    if (member._id.equals(currentUser._id) && req.body.status === "Inactive") return res.status(400).json({ message: "You cannot deactivate yourself." });
    if (rejectMemberAdminTarget(currentUser, member)) return res.status(403).json({ message: "Managers cannot change organization admins." });
    if (req.body.role === "org_admin" && !isAdmin(currentUser)) return res.status(403).json({ message: "Only an admin can assign the Admin role." });
    const updates = {};
    if (req.body.role !== undefined && ROLE_VALUES.includes(req.body.role)) updates.role = req.body.role;
    if (["Active", "Pending", "Inactive"].includes(req.body.status)) updates.status = req.body.status;
    const updated = await User.findByIdAndUpdate(member._id, { $set: updates }, { new: true, runValidators: true }).select(memberFields);
    res.json({ success: true, member: publicMember(updated) });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update member." });
  }
});

// DELETE /users/members/:id — only admins can remove members.
userRouter.delete("/members/:id", async (req, res) => {
  try {
    const currentUser = await getCurrentUser(req);
    if (!isAdmin(currentUser)) return res.status(403).json({ message: "Only organization admins can remove members." });
    const member = await User.findById(req.params.id);
    if (!member || !sameOrganization(currentUser, member)) return res.status(404).json({ message: "Member not found." });
    if (member._id.equals(currentUser._id)) return res.status(400).json({ message: "You cannot remove yourself." });
    await User.findByIdAndDelete(member._id);
    res.json({ success: true, message: "Member removed successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to remove member." });
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