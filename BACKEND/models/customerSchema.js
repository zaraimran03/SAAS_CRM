const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    company: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    phone: {
      type: String,
      default: "",
      trim: true,
    },

    owner: {
      type: String,
      default: "",
      trim: true,
    },

    status: {
      type: String,
      enum: ["Active", "Inactive", "Churned"],
      default: "Active",
    },

    value: {
      type: String,
      default: "$0",
    },

    balance: {
      type: Number,
      default: 0,
      min: 0,
    },

    purchases: [
      {
        description: { type: String, required: true, trim: true },
        amount: { type: Number, required: true, min: 0 },
        date: { type: Date, default: Date.now },
        notes: { type: String, default: "", trim: true },
      },
    ],

    dueDate: {
      type: Date,
      default: null,
    },

    convertedFromLead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
      default: null,
    },

    lastContacted: {
      type: Date,
      default: null,
    },

    tags: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Customer", customerSchema);
