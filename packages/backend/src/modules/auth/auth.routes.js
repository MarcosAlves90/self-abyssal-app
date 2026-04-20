const express = require("express");
const rateLimit = require("express-rate-limit");

const { authenticate } = require("../../middlewares/authenticate");
const { validateRequest } = require("../../middlewares/validateRequest");
const { asyncHandler } = require("../../shared/asyncHandler");
const { loginSchema, registerSchema } = require("./auth.schema");
const { getCurrentUser, loginUser, registerUser } = require("./auth.service");

const authRouter = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many authentication attempts. Please try again later." }
});

authRouter.post(
  "/register",
  authLimiter,
  validateRequest(registerSchema),
  asyncHandler(async (request, response) => {
    const result = await registerUser(request.validated.body);
    response.status(201).json(result);
  })
);

authRouter.post(
  "/login",
  authLimiter,
  validateRequest(loginSchema),
  asyncHandler(async (request, response) => {
    const result = await loginUser(request.validated.body);
    response.json(result);
  })
);

authRouter.get(
  "/me",
  authenticate,
  asyncHandler(async (request, response) => {
    const user = await getCurrentUser(request.user.id);
    response.json({ user });
  })
);

module.exports = { authRouter };
