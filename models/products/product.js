const mongoose = require("mongoose");
const { isLowercase } = require("validator");
const variation = require("./variation");

const productSchema = new mongoose.Schema(
  {
    sku: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      trim: true,
    },
    unit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Unit",
    },
    tax: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tax",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: null,
    },
    image: {
      type: [String],
      default: [],
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },
    subcategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subcategory",
    },
    slug: {
      type: [String],
      default: [],
      trim: true,
    },
    unitPurchasePriceLow: {
      type: Number,
      default: 0.0,
    },
    unitPurchasePriceHigh: {
      type: Number,
      default: 0.0,
    },
    unitSellingPriceLow: {
      type: Number,
      default: 0.0,
    },
    unitSellingPriceHigh: {
      type: Number,
      default: 0.0,
    },
    margin: {
      type: Number,
      default: 0,
    },
    markup: {
      type: Number,
      default: 0,
    },
    bussinessLocation: {
      type: String,
      trim: true,
      default: null,
    },
    stock: {
      type: Number,
      default: 0,
    },
    minStock: {
      type: Number,
      default: 0,
    },
    productType: {
      type: String,
      trim: true,
      lowercase: true,
      enum: ["single", "variable"],
      default: "single",
    },
    variation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Variations",
      default: null,
    },
    rating: {
      type: [Object],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Product", productSchema);
