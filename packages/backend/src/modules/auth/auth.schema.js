const { z } = require("zod");

const emailField = z.string().email().transform((value) => value.trim().toLowerCase());
const passwordField = z.string().min(8).max(128);

const registerSchema = z.object({
  body: z.object({
    name: z.string().min(3).max(80),
    email: emailField,
    password: passwordField,
    phone: z.string().min(8).max(20).optional(),
    defaultAddress: z.string().min(10).max(200).optional()
  }),
  params: z.object({}).default({}),
  query: z.object({}).default({})
});

const loginSchema = z.object({
  body: z.object({
    email: emailField,
    password: passwordField
  }),
  params: z.object({}).default({}),
  query: z.object({}).default({})
});

module.exports = { loginSchema, registerSchema };
