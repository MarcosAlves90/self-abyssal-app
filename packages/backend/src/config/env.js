const dotenv = require("dotenv");

dotenv.config();

const DEFAULT_ENCRYPTION_KEY =
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

function parseTrustProxy(value) {
  if (value === undefined || value === "") {
    return false;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  if (/^\d+$/.test(value)) {
    return Number(value);
  }

  return value;
}

function ensureHexKey(key) {
  if (!/^[0-9a-fA-F]{64}$/.test(key)) {
    throw new Error("ENCRYPTION_KEY must contain exactly 64 hex characters.");
  }

  return key.toLowerCase();
}

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 3333),
  mongoUri: process.env.MONGO_URI || "mongodb://localhost:27017/abyssal_app",
  jwtSecret:
    process.env.JWT_SECRET ||
    "3e82f77875293dd4226fb5271e5e28ee71bb4b3655d907eb418d5b4dfa7b29c5",
  encryptionKey: ensureHexKey(process.env.ENCRYPTION_KEY || DEFAULT_ENCRYPTION_KEY),
  autoSeed: String(process.env.AUTO_SEED || "true") === "true",
  corsOrigin: process.env.CORS_ORIGIN || "*",
  trustProxy: parseTrustProxy(process.env.TRUST_PROXY)
};

module.exports = { env };
