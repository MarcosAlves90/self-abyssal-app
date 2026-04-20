const { z } = require("zod");

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/);
const categoryField = z.enum(["entradas", "principais", "sobremesas", "bebidas"]);

const menuBody = z.object({
  name: z.string().min(3).max(80),
  slug: z.string().min(3).max(60),
  description: z.string().min(10).max(300),
  category: categoryField,
  priceCents: z.number().int().positive(),
  isFeatured: z.boolean().optional(),
  imageHint: z.string().max(80).optional(),
  availableForDelivery: z.boolean().optional(),
  availableForDineIn: z.boolean().optional(),
  accentColor: z.string().max(20).optional()
});

const listMenuSchema = z.object({
  body: z.object({}).default({}),
  params: z.object({}).default({}),
  query: z
    .object({
      category: categoryField.optional(),
      featured: z.enum(["true", "false"]).optional()
    })
    .default({})
});

const menuParamsSchema = z.object({
  body: z.object({}).default({}),
  params: z.object({ id: objectId }),
  query: z.object({}).default({})
});

const createMenuSchema = z.object({
  body: menuBody,
  params: z.object({}).default({}),
  query: z.object({}).default({})
});

const updateMenuSchema = z.object({
  body: menuBody.partial().refine((value) => Object.keys(value).length > 0, {
    message: "At least one menu field must be provided."
  }),
  params: z.object({ id: objectId }),
  query: z.object({}).default({})
});

module.exports = {
  createMenuSchema,
  listMenuSchema,
  menuParamsSchema,
  updateMenuSchema
};
