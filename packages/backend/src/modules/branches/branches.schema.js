const { z } = require("zod");

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/);

const branchBody = z.object({
  name: z.string().min(3).max(80),
  slug: z.string().min(3).max(50),
  city: z.string().min(2).max(80),
  neighborhood: z.string().min(2).max(80),
  addressLine: z.string().min(5).max(120),
  openHours: z.string().min(5).max(80),
  reservationDepths: z.array(z.string().min(2).max(40)).min(1)
});

const listBranchesSchema = z.object({
  body: z.object({}).default({}),
  params: z.object({}).default({}),
  query: z.object({ city: z.string().optional() }).default({})
});

const branchParamsSchema = z.object({
  body: z.object({}).default({}),
  params: z.object({ id: objectId }),
  query: z.object({}).default({})
});

const createBranchSchema = z.object({
  body: branchBody,
  params: z.object({}).default({}),
  query: z.object({}).default({})
});

const updateBranchSchema = z.object({
  body: branchBody.partial().refine((value) => Object.keys(value).length > 0, {
    message: "At least one branch field must be provided."
  }),
  params: z.object({ id: objectId }),
  query: z.object({}).default({})
});

module.exports = {
  branchParamsSchema,
  createBranchSchema,
  listBranchesSchema,
  updateBranchSchema
};
