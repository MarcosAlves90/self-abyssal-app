const mongoose = require("mongoose");

const { encryptedFieldSchema } = require("../../shared/security/fieldEncryption");

const addressSchema = new mongoose.Schema(
  {
    label: { type: String, trim: true },
    postalCodeEncrypted: encryptedFieldSchema(),
    streetEncrypted: encryptedFieldSchema(),
    numberEncrypted: encryptedFieldSchema(),
    complementEncrypted: encryptedFieldSchema(),
    neighborhoodEncrypted: encryptedFieldSchema(),
    cityEncrypted: encryptedFieldSchema(),
    stateEncrypted: encryptedFieldSchema(),
    summaryEncrypted: encryptedFieldSchema()
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["customer", "admin"], default: "customer" },
    phoneEncrypted: encryptedFieldSchema(),
    savedAddresses: [addressSchema]
  },
  {
    timestamps: true
  }
);

const User = mongoose.model("User", userSchema);

module.exports = { User };
