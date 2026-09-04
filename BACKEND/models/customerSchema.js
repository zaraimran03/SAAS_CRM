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
<<<<<<< HEAD
    dueDate: {
      type: Date,
      default: null,
    },
=======
>>>>>>> f47bcffec4428929a47fcf970e5c85cf6b13b146
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Customer", customerSchema);
