const express = require("express");
const Activity = require("../models/activitySchema");

const router = express.Router();

// ======================================================
// CREATE — POST /activities
// ======================================================

router.post("/", async (req, res) => {
  try {
    const { title, activity, relatedTo, contact, type, notes, owner, date, relatedId, relatedType } = req.body;
    const activityTitle = title || activity || "";
    const relatedValue = relatedTo || contact;

    if (!activityTitle || !relatedValue) {
      return res.status(400).json({
        success: false,
        message: "Activity title and related entity are required",
      });
    }

    const newActivity = await Activity.create({
      type,
      title: activityTitle,
      relatedTo: relatedValue,
      contact: relatedValue,
      notes,
      owner,
      date,
      relatedId,
      relatedType,
    });

    res.status(201).json({
      success: true,
      message: "Activity created successfully",
      activity: newActivity,
    });
  } catch (error) {
    console.error("Activity Create Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create activity",
      error: error.message,
    });
  }
});

// ======================================================
// GET ALL — GET /activities
// Optional query params: relatedId, relatedType
// ======================================================

router.get("/", async (req, res) => {
  try {
    const { relatedId, relatedType } = req.query;
    let query = {};
    
    if (relatedId) query.relatedId = relatedId;
    if (relatedType) query.relatedType = relatedType;

    const activities = await Activity.find(query).sort({ createdAt: -1 });
    res.status(200).json({ success: true, activities });
  } catch (error) {
    console.error("Activity Fetch Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch activities",
      error: error.message,
    });
  }
});

// ======================================================
// UPDATE — PUT /activities/:id
// ======================================================

router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };
    if (updates.title || updates.activity) updates.title = updates.title || updates.activity;
    if (updates.relatedTo) updates.contact = updates.relatedTo;
    const updatedActivity = await Activity.findByIdAndUpdate(id, updates, { new: true, runValidators: true });

    if (!updatedActivity) {
      return res.status(404).json({ success: false, message: "Activity not found" });
    }

    res.status(200).json({
      success: true,
      message: "Activity updated successfully",
      activity: updatedActivity,
    });
  } catch (error) {
    console.error("Activity Update Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update activity",
      error: error.message,
    });
  }
});

// ======================================================
// DELETE — DELETE /activities/:id
// ======================================================

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Activity.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Activity not found" });
    }

    res.status(200).json({ success: true, message: "Activity deleted successfully" });
  } catch (error) {
    console.error("Activity Delete Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete activity",
      error: error.message,
    });
  }
});

module.exports = router;
