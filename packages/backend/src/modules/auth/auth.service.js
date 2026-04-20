const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { env } = require("../../config/env");
const { HttpError } = require("../../shared/httpError");
const { encryptText, decryptText } = require("../../shared/security/fieldEncryption");
const { User } = require("./auth.model");

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
    savedAddresses: (user.savedAddresses || []).map((item) => ({
      label: item.label,
      address: decryptText(item.addressEncrypted)
    }))
  };
}

async function registerUser(payload) {
  const existingUser = await User.findOne({ email: payload.email }).lean();

  if (existingUser) {
    throw new HttpError(409, "An account with this email already exists.");
  }

  const passwordHash = await bcrypt.hash(payload.password, 12);
  const savedAddresses = payload.defaultAddress
    ? [
        {
          label: "Principal",
          addressEncrypted: encryptText(payload.defaultAddress)
        }
      ]
    : [];

  const user = await User.create({
    name: payload.name,
    email: payload.email,
    passwordHash,
    phoneEncrypted: encryptText(payload.phone),
    savedAddresses
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

module.exports = { getCurrentUser, loginUser, registerUser };
