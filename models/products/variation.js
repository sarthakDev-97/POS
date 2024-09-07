const mongoose = require("mongoose");

const variationSchema = new mongoose.Schema(
  {
    value: {
      type: String,
      trim: true,
      uppercase: true,
      default: null,
    },
    type: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      default: "COLOR",
    },
    image: {
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

variationSchema.index({ type: 1, value: 1 }, { unique: true });

module.exports = mongoose.model("Variations", variationSchema);
