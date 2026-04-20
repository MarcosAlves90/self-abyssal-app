const mongoose = require("mongoose");

const branchSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    city: { type: String, required: true, trim: true },
    neighborhood: { type: String, required: true, trim: true },
    addressLine: { type: String, required: true, trim: true },
    openHours: { type: String, required: true, trim: true },
    reservationDepths: [{ type: String, trim: true }]
  },
  {
    timestamps: true
  }
);

const Branch = mongoose.model("Branch", branchSchema);

module.exports = { Branch };
