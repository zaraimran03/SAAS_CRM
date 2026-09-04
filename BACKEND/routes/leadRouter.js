const express = require("express");
const Lead = require("../models/leadSchema");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    console.log("Received Lead:", req.body);

    const {
      name,
      company,
      email,
      phone,
      owner,
      status,
      value,
    } = req.body;

    if (!name || !company || !email) {
      return res.status(400).json({
        success: false,
        message: "Name, company and email are required",
      });
    }

    const newLead = await Lead.create({
      name,
      company,
      email,
      phone,
      owner,
      status,
      value,
    });

    console.log("Lead Saved:", newLead);

    res.status(201).json({
      success: true,
      message: "Lead created successfully",
      lead: newLead,
    });

  } catch (error) {
    console.error("Lead Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create lead",
      error: error.message,
    });
  }
});
// Get all leads
router.get("/", async (req, res) => {
  try {
    const leads = await Lead.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      leads,
    });
  } catch (error) {
    console.error("Get Leads Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch leads",
      error: error.message,
    });
  }
});

// Update a lead
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updatedLead = await Lead.findByIdAndUpdate(id, req.body, { new: true });
    
    if (!updatedLead) {
      return res.status(404).json({ success: false, message: "Lead not found" });
    }

    res.status(200).json({
      success: true,
      message: "Lead updated successfully",
      lead: updatedLead,
    });
  } catch (error) {
    console.error("Update Lead Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update lead",
      error: error.message,
    });
  }
});

// Delete a lead
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deletedLead = await Lead.findByIdAndDelete(id);

    if (!deletedLead) {
      return res.status(404).json({ success: false, message: "Lead not found" });
    }

    res.status(200).json({
      success: true,
      message: "Lead deleted successfully",
    });
  } catch (error) {
    console.error("Delete Lead Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete lead",
      error: error.message,
    });
  }
});

module.exports = router;