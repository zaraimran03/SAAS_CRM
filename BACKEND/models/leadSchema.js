const mongoose = require("mongoose");

const leadSchema = new mongoose.Schema(
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
      enum: ["New", "Contacted", "Proposal", "Negotiation", "Won"],
      default: "New",
    },

    value: {
      type: String,
      default: "$0",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Lead", leadSchema);