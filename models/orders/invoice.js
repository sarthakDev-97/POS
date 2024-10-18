const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema({
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
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  address: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Address",
    default: null,
  },
  products: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
      purchasedUnitPrice: { type: Number, required: true },
      totalTaxes: { type: Number, required: true },
      quantity: { type: Number, required: true },
      tax: { type: mongoose.Schema.Types.ObjectId, ref: "Tax", default: null },
      folds: { type: Number, default: 0 },
      foldMtrs: { type: Number, default: 0 },
    },
  ],
  totalPayable: { type: Number, required: true },
  totalTaxes: { type: Number, required: true },
  isLocal: { type: Boolean, default: true },
  discount: { type: Number, default: 0 },
  packagingCharges: {
    name: { type: String, default: "SER001" },
    amount: { type: Number, default: 0 },
    quantity: { type: Number, default: 1 },
    tax: { type: Boolean, default: true },
  },
  date: { type: Date, required: false, default: new Date().now },
});

module.exports = mongoose.model("Invoice", invoiceSchema);