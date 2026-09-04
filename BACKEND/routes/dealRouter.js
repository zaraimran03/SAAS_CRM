const express = require("express");
const Deal    = require("../models/dealSchema");

const router  = express.Router();

// ======================================================
// CREATE — POST /deals
// ======================================================

router.post("/", async (req, res) => {
  try {
    const { title, company, contact, email, value, stage, owner, closeDate, description } = req.body;

    if (!title || !company) {
      return res.status(400).json({
        success: false,
        message: "Title and company are required",
      });
    }

    const newDeal = await Deal.create({
      title,
      company,
      contact,
      email,
      value,
      stage,
      owner,
      closeDate,
      description,
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
// ======================================================

router.get("/", async (req, res) => {
  try {
    const deals = await Deal.find().sort({ createdAt: -1 });
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
    const updatedDeal = await Deal.findByIdAndUpdate(id, req.body, { new: true });

    if (!updatedDeal) {
      return res.status(404).json({ success: false, message: "Deal not found" });
    }

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
