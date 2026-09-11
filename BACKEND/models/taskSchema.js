const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    relatedTo: {
      type: String,
      default: "",
      trim: true,
    },

    type: {
      type: String,
      enum: ["Call", "Email", "Meeting", "Follow-up", "General"],
      default: "General",
    },

    assignee: {
      type: String,
      default: "",
      trim: true,
    },

    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Urgent"],
      default: "Medium",
    },

    status: {
      type: String,
      enum: ["To Do", "In Progress", "Review", "Done", "Cancelled"],
      default: "To Do",
    },

    dueDate: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Task", taskSchema);
