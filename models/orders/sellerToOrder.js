const mongoose = require("mongoose");

const orderForSellerSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

orderForSellerSchema.index(
  { order: 1, seller: 1 },
  { unique: true, background: true }
);

module.exports = mongoose.model("OrderForSeller", orderForSellerSchema);
