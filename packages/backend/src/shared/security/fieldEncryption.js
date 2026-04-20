const crypto = require("node:crypto");

const { env } = require("../../config/env");

const algorithm = "aes-256-gcm";
const key = Buffer.from(env.encryptionKey, "hex");

function encryptText(value) {
  if (!value) {
    return undefined;
  }

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  const encrypted = Buffer.concat([cipher.update(String(value), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    iv: iv.toString("hex"),
    content: encrypted.toString("hex"),
    tag: tag.toString("hex")
  };
}

function decryptText(payload) {
  if (!payload?.iv || !payload?.content || !payload?.tag) {
    return undefined;
  }

  const decipher = crypto.createDecipheriv(
    algorithm,
    key,
    Buffer.from(payload.iv, "hex")
  );

  decipher.setAuthTag(Buffer.from(payload.tag, "hex"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(payload.content, "hex")),
    decipher.final()
  ]);

  return decrypted.toString("utf8");
}

function encryptedFieldSchema() {
  return {
    iv: { type: String },
    content: { type: String },
    tag: { type: String }
  };
}

module.exports = { decryptText, encryptText, encryptedFieldSchema };
