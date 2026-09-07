const express = require("express");
const Customer = require("../models/customerSchema");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const {
      name,
      company,
      email,
      phone,
      owner,
      status,
      value,
      dueDate,
      lastContacted,
      tags,
    } = req.body;

    if (!name || !company || !email) {
      return res.status(400).json({
        success: false,
        message: "Name, company and email are required",
      });
    }

    const newCustomer = await Customer.create({
      name,
      company,
      email,
      phone,
      owner,
      status,
      value,
      dueDate,
      lastContacted,
      tags,
    });

    res.status(201).json({
      success: true,
      message: "Customer created successfully",
      customer: newCustomer,
    });
  } catch (error) {
    console.error("Customer Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create customer",
      error: error.message,
    });
  }
});

// Add a purchase and update the customer's outstanding balance.
router.post("/:id/purchases", async (req, res) => {
  try {
    const { description, amount, date, notes } = req.body;
    const numericAmount = Number(amount);
    if (!description || !Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ success: false, message: "Description and a positive amount are required" });
    }

    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      {
        $push: { purchases: { description, amount: numericAmount, date: date || new Date(), notes: notes || "" } },
        $inc: { balance: numericAmount },
      },
      { new: true, runValidators: true }
    );

    if (!customer) return res.status(404).json({ success: false, message: "Customer not found" });
    res.status(201).json({ success: true, customer });
  } catch (error) {
    console.error("Purchase Error:", error);
    res.status(500).json({ success: false, message: "Failed to add purchase", error: error.message });
  }
});

// Get all customers
router.get("/", async (req, res) => {
  try {
    const customers = await Customer.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      customers,
    });
  } catch (error) {
    console.error("Get Customers Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch customers",
      error: error.message,
    });
  }
});

// Update a customer
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updatedCustomer = await Customer.findByIdAndUpdate(id, req.body, { new: true });
    
    if (!updatedCustomer) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    res.status(200).json({
      success: true,
      message: "Customer updated successfully",
      customer: updatedCustomer,
    });
  } catch (error) {
    console.error("Update Customer Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update customer",
      error: error.message,
    });
  }
});

// Delete a customer
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deletedCustomer = await Customer.findByIdAndDelete(id);

    if (!deletedCustomer) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    res.status(200).json({
      success: true,
      message: "Customer deleted successfully",
    });
  } catch (error) {
    console.error("Delete Customer Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete customer",
      error: error.message,
    });
  }
});

module.exports = router;
