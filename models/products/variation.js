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
      enum: [
        "COLOR",
        "NAME",
        "PRINT",
        "CARPET COLOR",
        "B",
        "H",
        "RMS",
        "TYPE",
        "THICKNESS",
        "LIGHT COLOR",
        "CHAIR TYPE",
        "SHADE",
      ],
    },
  },
  {
    timestamps: true,
  }
);

variationSchema.index({ type: 1, value: 1 }, { unique: true });

module.exports = mongoose.model("Variations", variationSchema);
