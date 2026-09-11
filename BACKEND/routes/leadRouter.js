const express = require("express");
const Lead = require("../models/leadSchema");
const Customer = require("../models/customerSchema");

const router = express.Router();
const QUALIFIED_STATUS = "Won";

const syncQualifiedLeadToCustomer = async (lead) => {
  if (lead.status !== QUALIFIED_STATUS) return null;

  return Customer.findOneAndUpdate(
    { convertedFromLead: lead._id },
    {
      $set: {
        name: lead.name,
        company: lead.company,
        email: lead.email,
        phone: lead.phone,
        owner: lead.owner,
        value: lead.value,
      },
      $setOnInsert: {
        convertedFromLead: lead._id,
        status: "Active",
      },
    },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );
};

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
      negotiationDate,
      negotiationTime,
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
      negotiationDate: status === "Negotiation" ? negotiationDate || null : null,
      negotiationTime: status === "Negotiation" ? negotiationTime || "" : "",
    });

    await syncQualifiedLeadToCustomer(newLead);

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
    const updatedLead = await Lead.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });
    
    if (!updatedLead) {
      return res.status(404).json({ success: false, message: "Lead not found" });
    }

    const customer = await syncQualifiedLeadToCustomer(updatedLead);

    res.status(200).json({
      success: true,
      message: "Lead updated successfully",
      lead: updatedLead,
      customer,
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