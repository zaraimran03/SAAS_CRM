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

    previousValue: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
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

    probability: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    linkedCustomer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },

    history: [
      {
        stage: String,
        changedAt: {
          type: Date,
          default: Date.now,
        }
      }
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Deal", dealSchema);
