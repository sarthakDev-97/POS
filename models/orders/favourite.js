const mongoose = require("mongoose");

const favouriteSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
  },
  { timestamps: true }
);

favouriteSchema.index(
  { user: 1, product: 1 },
  { unique: true, background: true }
);

module.exports = mongoose.model("Favourite", favouriteSchema);
