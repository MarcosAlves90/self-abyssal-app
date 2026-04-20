const mongoose = require("mongoose");

const { encryptedFieldSchema } = require("../../shared/security/fieldEncryption");

const reservationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", required: true },
    scheduledAt: { type: Date, required: true },
    guests: { type: Number, required: true, min: 1, max: 12 },
    depthLevel: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["confirmed", "checked_in", "completed", "cancelled"],
      default: "confirmed"
    },
    specialRequestEncrypted: encryptedFieldSchema()
  },
  {
    timestamps: true
  }
);

const Reservation = mongoose.model("Reservation", reservationSchema);

module.exports = { Reservation };
