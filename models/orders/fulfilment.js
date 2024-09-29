const mongoose = require("mongoose");

const fulfillmentSchema = new mongoose.Schema(
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
      default: null,
    },
    status: {
      type: String,
      trim: true,
      uppercase: true,
      default: "PENDING",
      enum: ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"],
    },
    productsOrdered: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        purchasedUnitPrice: { type: Number, required: true },
        totalTaxes: { type: Number, required: true },
        totalPrice: { type: Number, required: true },
        quantity: { type: Number, required: true, default: 1 },
      },
    ],
    productsSent: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
        purchasedUnitPrice: { type: Number },
        totalTaxes: { type: Number },
        totalPrice: { type: Number },
        quantity: { type: Number, default: 1 },
      },
    ],
    discount: { type: Number, default: 0 },
    coupon: { type: Number, default: 0 },
    shippingCharge: { type: Number, default: 0 },
    totalTaxes: { type: Number, default: 0 },
    totalWOTaxes: { type: Number, required: true },
    totalWithoutDiscounts: { type: Number, required: true },
    totalPayable: { type: Number, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Fulfillment", fulfillmentSchema);
