const express = require("express");
const Lead = require("../models/leadSchema");
const Customer = require("../models/customerSchema");
const Deal = require("../models/dealSchema");
const Activity = require("../models/activitySchema");
const Task = require("../models/taskSchema");
const User = require("../models/userSchema");

const router = express.Router();

const asDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const amount = (value) => {
  const parsed = Number(String(value || 0).replace(/[$,]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
};

const inRange = (value, start, end) => {
  const date = asDate(value);
  return date && date >= start && date <= end;
};

const percent = (value, total) => total ? Number(((value / total) * 100).toFixed(1)) : 0;

router.get("/overview", async (req, res) => {
  try {
    const now = new Date();
    const start = asDate(req.query.start) || new Date(0);
    const end = asDate(req.query.end) || now;
    const currentUser = await User.findById(req.user.id).select("organizationId").lean();
    const memberQuery = currentUser?.organizationId ? { organizationId: currentUser.organizationId } : { _id: req.user.id };
    const [leads, customers, deals, activities, tasks, members] = await Promise.all([
      Lead.find().lean(),
      Customer.find().lean(),
      Deal.find().lean(),
      Activity.find().lean(),
      Task.find().lean(),
      User.find(memberQuery).select("fullName email role status createdAt organizationId").lean(),
    ]);

    const filteredLeads = leads.filter((item) => inRange(item.createdAt, start, end));
    const filteredCustomers = customers.filter((item) => inRange(item.createdAt, start, end));
    const filteredDeals = deals.filter((item) => inRange(item.createdAt || item.closeDate, start, end));
    const filteredActivities = activities.filter((item) => inRange(item.date || item.createdAt, start, end));
    const filteredTasks = tasks.filter((item) => inRange(item.createdAt || item.dueDate, start, end));

    const wonDeals = filteredDeals.filter((item) => item.stage === "Won");
    const lostDeals = filteredDeals.filter((item) => item.stage === "Lost");
    const wonLeads = filteredLeads.filter((item) => item.status === "Won");
    const revenue = wonDeals.reduce((sum, item) => sum + amount(item.value), 0);
    const leadRevenue = wonLeads.reduce((sum, item) => sum + amount(item.value), 0);
    const team = members.map((member) => {
      const name = member.fullName;
      const ownedLeads = filteredLeads.filter((item) => item.owner === name);
      const ownedDeals = filteredDeals.filter((item) => item.owner === name);
      const memberWon = ownedDeals.filter((item) => item.stage === "Won");
      return {
        member: name,
        email: member.email,
        leads: ownedLeads.length,
        deals: ownedDeals.length,
        won: memberWon.length,
        lost: ownedDeals.filter((item) => item.stage === "Lost").length,
        revenue: memberWon.reduce((sum, item) => sum + amount(item.value), 0),
        conversionRate: percent(memberWon.length, ownedLeads.length),
      };
    }).sort((a, b) => b.revenue - a.revenue);

    res.json({
      success: true,
      range: { start, end },
      kpis: {
        totalLeads: filteredLeads.length,
        conversionRate: percent(wonLeads.length, filteredLeads.length),
        activeDeals: filteredDeals.filter((item) => item.status !== "Inactive" && !["Won", "Lost"].includes(item.stage)).length,
        wonDeals: wonDeals.length,
        lostDeals: lostDeals.length,
        totalRevenue: revenue,
        averageDealValue: wonDeals.length ? revenue / wonDeals.length : 0,
      },
      leads: filteredLeads,
      customers: filteredCustomers,
      deals: filteredDeals,
      activities: filteredActivities,
      tasks: filteredTasks,
      members,
      team,
      leadSources: [],
      leadRevenue,
    });
  } catch (error) {
    console.error("Reports Overview Error:", error.message);
    res.status(500).json({ success: false, message: "Failed to load report data." });
  }
});

module.exports = router;