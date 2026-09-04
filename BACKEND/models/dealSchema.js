const mongoose = require("mongoose");

const dealSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    company: {
      type: String,
      required: true,
      trim: true,
    },

    contact: {
      type: String,
      default: "",
      trim: true,
    },

    email: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },

    value: {
      type: String,
      default: "$0",
    },

    stage: {
      type: String,
      enum: ["Qualification", "Proposal", "Negotiation", "Won", "Lost"],
      default: "Qualification",
    },

    owner: {
      type: String,
      default: "",
      trim: true,
    },

    closeDate: {
      type: String,
      default: "",
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Deal", dealSchema);
