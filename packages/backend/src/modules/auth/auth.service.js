const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { env } = require("../../config/env");
const { HttpError } = require("../../shared/httpError");
const { encryptText, decryptText } = require("../../shared/security/fieldEncryption");
const { User } = require("./auth.model");

function formatPostalCode(postalCode) {
  if (!postalCode || postalCode.length !== 8) {
    return postalCode;
  }

  return `${postalCode.slice(0, 5)}-${postalCode.slice(5)}`;
}

function buildAddressSummary(address) {
  const firstLine = [address.street, address.number].filter(Boolean).join(", ");
  const secondLine = [address.complement, address.neighborhood].filter(Boolean).join(", ");
  const thirdLine = [
    [address.city, address.state].filter(Boolean).join(" - "),
    address.postalCode ? `CEP ${formatPostalCode(address.postalCode)}` : undefined
  ]
    .filter(Boolean)
    .join(" • ");

  return [firstLine, secondLine, thirdLine].filter(Boolean).join(" • ");
}

function serializeAddress(item) {
  const postalCode = decryptText(item.postalCodeEncrypted);
  const street = decryptText(item.streetEncrypted);
  const number = decryptText(item.numberEncrypted);
  const complement = decryptText(item.complementEncrypted);
  const neighborhood = decryptText(item.neighborhoodEncrypted);
  const city = decryptText(item.cityEncrypted);
  const state = decryptText(item.stateEncrypted);
  const summary = decryptText(item.summaryEncrypted);

  return {
    label: item.label,
    postalCode: formatPostalCode(postalCode),
    street,
    number,
    complement,
    neighborhood,
    city,
    state,
    summary
  };
}

function buildToken(user) {
  return jwt.sign(
    {
      sub: String(user._id),
      role: user.role
    },
    env.jwtSecret,
    { expiresIn: "7d" }
  );
}

function serializeUser(user) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    savedAddresses: (user.savedAddresses || []).map(serializeAddress)
  };
}

async function registerUser(payload) {
  const existingUser = await User.findOne({ email: payload.email }).lean();

  if (existingUser) {
    throw new HttpError(409, "An account with this email already exists.");
  }

  const passwordHash = await bcrypt.hash(payload.password, 12);

  const user = await User.create({
    name: payload.name,
    email: payload.email,
    passwordHash,
    phoneEncrypted: encryptText(payload.phone)
  });

  return {
    token: buildToken(user),
    user: serializeUser(user)
  };
}

async function loginUser(payload) {
  const user = await User.findOne({ email: payload.email });

  if (!user) {
    throw new HttpError(401, "Invalid email or password.");
  }

  const passwordMatches = await bcrypt.compare(payload.password, user.passwordHash);

  if (!passwordMatches) {
    throw new HttpError(401, "Invalid email or password.");
  }

  return {
    token: buildToken(user),
    user: serializeUser(user)
  };
}

async function getCurrentUser(userId) {
  const user = await User.findById(userId);

  if (!user) {
    throw new HttpError(404, "Authenticated user not found.");
  }

  return serializeUser(user);
}

async function savePrimaryAddress(userId, payload) {
  const user = await User.findById(userId);

  if (!user) {
    throw new HttpError(404, "Authenticated user not found.");
  }

  const addressSummary = buildAddressSummary(payload);
  const encryptedAddress = {
    label: payload.label || "Principal",
    postalCodeEncrypted: encryptText(payload.postalCode),
    streetEncrypted: encryptText(payload.street),
    numberEncrypted: encryptText(payload.number),
    complementEncrypted: encryptText(payload.complement),
    neighborhoodEncrypted: encryptText(payload.neighborhood),
    cityEncrypted: encryptText(payload.city),
    stateEncrypted: encryptText(payload.state),
    summaryEncrypted: encryptText(addressSummary)
  };

  if (user.savedAddresses.length) {
    user.savedAddresses[0] = encryptedAddress;
  } else {
    user.savedAddresses.push(encryptedAddress);
  }

  await user.save();

  return serializeUser(user);
}

module.exports = { getCurrentUser, loginUser, registerUser, savePrimaryAddress };
