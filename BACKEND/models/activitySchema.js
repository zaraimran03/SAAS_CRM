const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["Call", "Email", "Meeting", "Note", "Follow-up"],
      default: "Email",
    },

    title: {
      type: String,
      default: "",
      trim: true,
    },

    relatedTo: {
      type: String,
      default: "",
      trim: true,
    },

    contact: {
      type: String,
      required: true,
      trim: true,
    },

    notes: {
      type: String,
      default: "",
      trim: true,
    },

    owner: {
      type: String,
      default: "",
      trim: true,
    },

    date: {
      type: String,
      default: "",
    },

    // Relational fields
    relatedId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    
    relatedType: {
      type: String,
      enum: ["Lead", "Customer", "Company", "Deal", "Contact", null],
      default: null,
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Activity", activitySchema);
