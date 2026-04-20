const mongoose = require("mongoose");

const menuItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: {
      type: String,
      required: true,
      enum: ["entradas", "principais", "sobremesas", "bebidas"]
    },
    priceCents: { type: Number, required: true, min: 0 },
    isFeatured: { type: Boolean, default: false },
    imageHint: { type: String, trim: true },
    availableForDelivery: { type: Boolean, default: true },
    availableForDineIn: { type: Boolean, default: true },
    accentColor: { type: String, trim: true, default: "#31e7ff" }
  },
  {
    timestamps: true
  }
);

const MenuItem = mongoose.model("MenuItem", menuItemSchema);

module.exports = { MenuItem };
