const mongoose = require("mongoose");

const { encryptedFieldSchema } = require("../../shared/security/fieldEncryption");

const orderItemSchema = new mongoose.Schema(
  {
    menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: "MenuItem", required: true },
    nameSnapshot: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPriceCents: { type: Number, required: true, min: 0 },
    noteEncrypted: encryptedFieldSchema()
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: "Branch" },
    reservationId: { type: mongoose.Schema.Types.ObjectId, ref: "Reservation" },
    fulfillmentType: { type: String, enum: ["delivery", "dine_in"], required: true },
    status: {
      type: String,
      enum: ["pending", "preparing", "on_the_way", "served", "completed", "cancelled"],
      default: "pending"
    },
    items: { type: [orderItemSchema], required: true },
    paymentMethod: {
      type: String,
      enum: ["in_app_card_tokenized", "card_on_delivery", "on_site"],
      required: true
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "authorized", "paid"],
      default: "pending"
    },
    deliveryAddressEncrypted: encryptedFieldSchema(),
    contactNameEncrypted: encryptedFieldSchema(),
    totalCents: { type: Number, required: true, min: 0 }
  },
  {
    timestamps: true
  }
);

const Order = mongoose.model("Order", orderSchema);

module.exports = { Order };
