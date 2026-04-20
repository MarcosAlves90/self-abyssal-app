const jwt = require("jsonwebtoken");

const { env } = require("../config/env");
const { User } = require("../modules/auth/auth.model");
const { HttpError } = require("../shared/httpError");

async function authenticate(request, response, next) {
  const authorizationHeader = request.headers.authorization || "";
  const [, token] = authorizationHeader.split(" ");

  if (!token) {
    return next(new HttpError(401, "Authentication token is required."));
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret);
    const user = await User.findById(payload.sub).lean();

    if (!user) {
      return next(new HttpError(401, "Invalid authentication token."));
    }

    request.user = {
      id: String(user._id),
      role: user.role,
      name: user.name,
      email: user.email
    };

    return next();
  } catch (error) {
    return next(new HttpError(401, "Invalid authentication token."));
  }
}

function requireAdmin(request, response, next) {
  if (request.user?.role !== "admin") {
    return next(new HttpError(403, "Administrator access is required."));
  }

  return next();
}

module.exports = { authenticate, requireAdmin };
