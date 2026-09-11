const express = require("express");
const bcrypt = require("bcrypt");
const yup = require("yup");
const User = require("../models/userSchema");
const Organization = require("../models/organizationSchema");

const router = express.Router();
const ORG_ROLES = ["org_admin"];
const CONFIG_ROLES = ["org_admin", "sales_manager"];
const DEFAULT_CONFIG = {
  leadStatuses: ["New", "Contacted", "Qualified", "Unqualified", "Converted", "Lost"],
  leadSources: ["Website", "Referral", "Social Media", "Email", "Advertisement", "Other"],
  dealStages: ["New", "Qualified", "Proposal", "Negotiation", "Won", "Lost"],
  lostReasons: ["Price", "Competitor", "No Response", "Not Interested", "Other"],
  taskStatuses: ["To Do", "In Progress", "Review", "Done", "Cancelled"],
  taskPriorities: ["Low", "Medium", "High", "Urgent"],
  taskTypes: ["Call", "Email", "Meeting", "Follow-up", "General"],
  activityTypes: ["Call", "Email", "Meeting", "Note", "Follow-up"],
};
const getUser = (req) => User.findById(req.user.id);
const publicUser = (user) => ({ id: user._id, fullName: user.fullName, email: user.email, phone: user.phone, role: user.role, avatar: user.avatar, notificationPreferences: user.notificationPreferences });
const orgId = (user) => user.organizationId || user._id;
const getOrganization = (user) => Organization.findById(orgId(user));
const canEditOrg = (user) => ORG_ROLES.includes(user.role);
const canEditConfig = (user) => CONFIG_ROLES.includes(user.role);

router.get("/", async (req, res) => {
  try {
    const user = await getUser(req);
    const organization = await Organization.findOneAndUpdate({ _id: orgId(user) }, { $setOnInsert: { _id: orgId(user), crmConfig: DEFAULT_CONFIG } }, { new: true, upsert: true, setDefaultsOnInsert: true });
    res.json({ success: true, organization, user: publicUser(user), permissions: { canEditOrganization: canEditOrg(user), canEditConfig: canEditConfig(user) } });
  } catch (error) { res.status(500).json({ success: false, message: "Failed to load settings." }); }
});

router.patch("/organization", async (req, res) => {
  try {
    const user = await getUser(req);
    if (!canEditOrg(user)) return res.status(403).json({ message: "Only organization admins can update workspace settings." });
    const allowed = ["organizationName", "workspaceName", "logo", "industry", "currency", "timezone", "dateFormat"];
    const updates = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
    if (updates.dateFormat && !["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"].includes(updates.dateFormat)) return res.status(400).json({ message: "Invalid date format." });
    const organization = await Organization.findOneAndUpdate({ _id: orgId(user) }, { $set: updates }, { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true });
    res.json({ success: true, organization, message: "General settings saved successfully." });
  } catch (error) { res.status(500).json({ success: false, message: "Failed to save general settings." }); }
});

router.patch("/notifications", async (req, res) => {
  try {
    const allowed = ["taskAssigned", "taskDue", "taskOverdue", "newLeadAssigned", "dealWon", "dealLost", "newActivity", "emailNotifications", "inAppNotifications"];
    const updates = Object.fromEntries(Object.entries(req.body).filter(([key, value]) => allowed.includes(key) && typeof value === "boolean"));
    const user = await User.findByIdAndUpdate(req.user.id, { $set: Object.fromEntries(Object.entries(updates).map(([key, value]) => [`notificationPreferences.${key}`, value])) }, { new: true, runValidators: true });
    res.json({ success: true, user: publicUser(user), message: "Notification settings saved successfully." });
  } catch (error) { res.status(500).json({ success: false, message: "Failed to save notification settings." }); }
});

router.patch("/crm", async (req, res) => {
  try {
    const user = await getUser(req);
    if (!canEditConfig(user)) return res.status(403).json({ message: "You cannot edit CRM configuration." });
    const updates = {};
    Object.keys(DEFAULT_CONFIG).forEach((key) => { if (Array.isArray(req.body[key])) updates[`crmConfig.${key}`] = req.body[key].map((value) => String(value).trim()).filter(Boolean); });
    const organization = await Organization.findOneAndUpdate({ _id: orgId(user) }, { $set: updates }, { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true });
    res.json({ success: true, organization, message: "CRM configuration saved successfully." });
  } catch (error) { res.status(500).json({ success: false, message: "Failed to save CRM configuration." }); }
});

router.patch("/password", async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    if (!currentPassword || !newPassword || newPassword !== confirmPassword || newPassword.length < 8) return res.status(400).json({ message: "Enter the current password and a matching password of at least 8 characters." });
    const user = await User.findById(req.user.id);
    if (!user || !(await bcrypt.compare(currentPassword, user.password))) return res.status(401).json({ message: "Current password is incorrect." });
    await yup.string().min(8).matches(/[A-Z]/).matches(/[a-z]/).matches(/[0-9]/).matches(/[^A-Za-z0-9]/).validate(newPassword);
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ success: true, message: "Password updated successfully." });
  } catch (error) { res.status(400).json({ success: false, message: "Password must contain uppercase, lowercase, number, and special character." }); }
});

module.exports = router;
