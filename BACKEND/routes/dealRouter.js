const express = require("express");
const Deal    = require("../models/dealSchema");

const router  = express.Router();

// ======================================================
// CREATE — POST /deals
// ======================================================

router.post("/", async (req, res) => {
  try {
    const { title, company, contact, email, value, stage, status, owner, closeDate, description, probability, linkedCustomer } = req.body;

    if (!title || !company || !linkedCustomer) {
      return res.status(400).json({
        success: false,
        message: "Title, company, and customer are required",
      });
    }

    const newDeal = await Deal.create({
      title,
      company,
      contact,
      email,
      value,
      stage: stage || "Qualification",
      status: status || "Active",
      owner,
      closeDate,
      description,
      probability: probability || 0,
      linkedCustomer,
      history: [{ stage: stage || "Qualification", changedAt: new Date() }]
    });

    res.status(201).json({
      success: true,
      message: "Deal created successfully",
      deal: newDeal,
    });
  } catch (error) {
    console.error("Deal Create Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create deal",
      error: error.message,
    });
  }
});

// ======================================================
// GET ALL — GET /deals
// Optional query: customerId
// ======================================================

router.get("/", async (req, res) => {
  try {
    const { customerId } = req.query;
    let query = {};
    if (customerId) query.linkedCustomer = customerId;

    const deals = await Deal.find(query).sort({ createdAt: -1 });
    res.status(200).json({ success: true, deals });
  } catch (error) {
    console.error("Deal Fetch Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch deals",
      error: error.message,
    });
  }
});

// ======================================================
// UPDATE — PUT /deals/:id
// ======================================================

router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if stage is being changed to update history
    const existingDeal = await Deal.findById(id);
    if (!existingDeal) {
      return res.status(404).json({ success: false, message: "Deal not found" });
    }

    const updates = { ...req.body };

    if (updates.value !== undefined && updates.value !== existingDeal.value) {
      updates.previousValue = existingDeal.value;
    }
    
    if (updates.stage && updates.stage !== existingDeal.stage) {
      updates.$push = {
        history: { stage: updates.stage, changedAt: new Date() }
      };
    }

    // if $push is used, we cannot just pass updates normally if it contains regular fields and update operators mixed in at the root.
    // Instead we construct the mongoose update object properly.
    let updateDoc = { $set: {} };
    for(const key in updates) {
      if(key !== '$push' && key !== 'history') {
        updateDoc.$set[key] = updates[key];
      }
    }
    if (updates.$push) {
      updateDoc.$push = updates.$push;
    }

    const updatedDeal = await Deal.findByIdAndUpdate(id, updateDoc, { new: true });

    res.status(200).json({
      success: true,
      message: "Deal updated successfully",
      deal: updatedDeal,
    });
  } catch (error) {
    console.error("Deal Update Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update deal",
      error: error.message,
    });
  }
});

// ======================================================
// DELETE — DELETE /deals/:id
// ======================================================

router.delete("/:id", async (req, res) => {
  try {
    const { id }  = req.params;
    const deleted = await Deal.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Deal not found" });
    }

    res.status(200).json({ success: true, message: "Deal deleted successfully" });
  } catch (error) {
    console.error("Deal Delete Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete deal",
      error: error.message,
    });
  }
});

module.exports = router;
