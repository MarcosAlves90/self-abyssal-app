const { z } = require("zod");

const emailField = z.string().email().transform((value) => value.trim().toLowerCase());
const passwordField = z.string().min(8).max(128);
const trimmedString = (min, max) =>
  z.string().trim().min(min).max(max);
const optionalTrimmedString = (min, max) =>
  z
    .union([z.literal(""), z.string().trim().min(min).max(max)])
    .optional()
    .transform((value) => value || undefined);
const postalCodeField = z
  .string()
  .transform((value) => value.replace(/\D/g, ""))
  .refine((value) => value.length === 8, {
    message: "postalCode must contain 8 digits."
  });

const registerSchema = z.object({
  body: z.object({
    name: z.string().min(3).max(80),
    email: emailField,
    password: passwordField,
    phone: optionalTrimmedString(8, 20)
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

const upsertPrimaryAddressSchema = z.object({
  body: z.object({
    label: trimmedString(2, 40).optional(),
    postalCode: postalCodeField,
    street: trimmedString(3, 120),
    number: trimmedString(1, 20),
    complement: optionalTrimmedString(1, 80),
    neighborhood: trimmedString(2, 80),
    city: trimmedString(2, 80),
    state: z
      .string()
      .trim()
      .transform((value) => value.toUpperCase())
      .refine((value) => value.length === 2, {
        message: "state must contain 2 characters."
      })
  }),
  params: z.object({}).default({}),
  query: z.object({}).default({})
});

module.exports = { loginSchema, registerSchema, upsertPrimaryAddressSchema };
