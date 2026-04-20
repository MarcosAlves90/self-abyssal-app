const { z } = require("zod");

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/);

const reservationBody = z.object({
  branchId: objectId,
  scheduledAt: z.string().datetime(),
  guests: z.number().int().min(1).max(12),
  depthLevel: z.string().min(3).max(40),
  specialRequest: z.string().max(200).optional()
});

const reservationStatusField = z.enum([
  "confirmed",
  "checked_in",
  "completed",
  "cancelled"
]);

const listReservationsSchema = z.object({
  body: z.object({}).default({}),
  params: z.object({}).default({}),
  query: z
    .object({
      status: reservationStatusField.optional()
    })
    .default({})
});

const reservationParamsSchema = z.object({
  body: z.object({}).default({}),
  params: z.object({ id: objectId }),
  query: z.object({}).default({})
});

const createReservationSchema = z.object({
  body: reservationBody,
  params: z.object({}).default({}),
  query: z.object({}).default({})
});

const updateReservationSchema = z.object({
  body: reservationBody
    .extend({
      status: reservationStatusField.optional()
    })
    .partial()
    .refine((value) => Object.keys(value).length > 0, {
      message: "At least one reservation field must be provided."
    }),
  params: z.object({ id: objectId }),
  query: z.object({}).default({})
});

module.exports = {
  createReservationSchema,
  listReservationsSchema,
  reservationParamsSchema,
  updateReservationSchema
};
