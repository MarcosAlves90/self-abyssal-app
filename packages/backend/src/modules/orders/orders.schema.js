const { z } = require("zod");

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/);

const orderStatusField = z.enum([
  "pending",
  "preparing",
  "on_the_way",
  "served",
  "completed",
  "cancelled"
]);

const paymentMethodField = z.enum([
  "in_app_card_tokenized",
  "card_on_delivery",
  "on_site"
]);

const itemBody = z.object({
  menuItemId: objectId,
  quantity: z.number().int().min(1).max(20),
  note: z.string().max(120).optional()
});

const orderBody = z.object({
  branchId: objectId.optional(),
  reservationId: objectId.optional(),
  fulfillmentType: z.enum(["delivery", "dine_in"]),
  items: z.array(itemBody).min(1),
  paymentMethod: paymentMethodField,
  deliveryAddress: z.string().min(10).max(200).optional(),
  contactName: z.string().min(3).max(80).optional()
});

const listOrdersSchema = z.object({
  body: z.object({}).default({}),
  params: z.object({}).default({}),
  query: z
    .object({
      status: orderStatusField.optional()
    })
    .default({})
});

const orderParamsSchema = z.object({
  body: z.object({}).default({}),
  params: z.object({ id: objectId }),
  query: z.object({}).default({})
});

const createOrderSchema = z.object({
  body: orderBody.superRefine((value, context) => {
    if (value.fulfillmentType === "delivery" && !value.deliveryAddress) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "deliveryAddress is required for delivery orders."
      });
    }

    if (value.fulfillmentType === "dine_in" && !value.branchId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "branchId is required for dine-in orders."
      });
    }
  }),
  params: z.object({}).default({}),
  query: z.object({}).default({})
});

const updateOrderSchema = z.object({
  body: z
    .object({
      status: orderStatusField.optional(),
      paymentStatus: z.enum(["pending", "authorized", "paid"]).optional()
    })
    .refine((value) => Object.keys(value).length > 0, {
      message: "At least one order field must be provided."
    }),
  params: z.object({ id: objectId }),
  query: z.object({}).default({})
});

module.exports = {
  createOrderSchema,
  listOrdersSchema,
  orderParamsSchema,
  updateOrderSchema
};
