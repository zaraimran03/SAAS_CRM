const mongoose = require("mongoose");

const organizationSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId },
  organizationName: { type: String, default: "", trim: true },
  workspaceName: { type: String, default: "", trim: true },
  logo: { type: String, default: null },
  industry: { type: String, default: "", trim: true },
  currency: { type: String, default: "USD" },
  timezone: { type: String, default: "UTC" },
  dateFormat: { type: String, enum: ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"], default: "MM/DD/YYYY" },
  crmConfig: {
    leadStatuses: { type: [String], default: ["New", "Contacted", "Qualified", "Unqualified", "Converted", "Lost"] },
    leadSources: { type: [String], default: ["Website", "Referral", "Social Media", "Email", "Advertisement", "Other"] },
    dealStages: { type: [String], default: ["New", "Qualified", "Proposal", "Negotiation", "Won", "Lost"] },
    lostReasons: { type: [String], default: ["Price", "Competitor", "No Response", "Not Interested", "Other"] },
    taskStatuses: { type: [String], default: ["To Do", "In Progress", "Review", "Done", "Cancelled"] },
    taskPriorities: { type: [String], default: ["Low", "Medium", "High", "Urgent"] },
    taskTypes: { type: [String], default: ["Call", "Email", "Meeting", "Follow-up", "General"] },
    activityTypes: { type: [String], default: ["Call", "Email", "Meeting", "Note", "Follow-up"] },
  },
}, { timestamps: true });

module.exports = mongoose.model("Organization", organizationSchema);