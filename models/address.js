const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema(
  {
    street: {
      type: String,
      default: null,
      required: true,
    },
    city: {
      type: String,
      default: null,
      required: true,
    },
    state: {
      type: String,
      default: null,
      required: true,
    },
    pincode: {
      type: String,
      default: null,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Address", addressSchema);
