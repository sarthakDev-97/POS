const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    products: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: { type: Number, required: true, default: 1 },
      },
    ],
    totalPriceWOTax: { type: Number, required: true },
    taxes: { type: Number, required: true, default: 0 },
    discount: { type: Number, default: 0 },
    coupon: { type: Number, default: 0 },
    shippingCharge: { type: Number, default: 50 },
    totalWithoutDiscounts: { type: Number, required: true },
    totalPayable: { type: Number, required: true },
    creditPoints: { type: Boolean, default: false },
    quantity: { type: Number, required: true, default: 1 },
    status: {
      type: String,
      lowercase: true,
      trim: true,
      enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["cod", "UPI", "card"],
      default: "cod",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "processing", "success", "failed"],
      default: "pending",
    },
    paymentDetails: {
      status: { type: Boolean, default: false },
      data: {
        resultCode: { type: String, default: null },
        amount: { type: Number, default: 0 },
        paymentToken: { type: String, default: null },
        paymentId: { type: String, default: null },
        method: { type: Number, default: 1 },
        paidOn: { type: Date, default: new Date().now },
      },
    },
    shippingAddress: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Address",
      required: true,
    },
    deliveryDate: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
