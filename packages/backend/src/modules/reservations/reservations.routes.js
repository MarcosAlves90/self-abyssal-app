const express = require("express");

const { authenticate } = require("../../middlewares/authenticate");
const { validateRequest } = require("../../middlewares/validateRequest");
const { asyncHandler } = require("../../shared/asyncHandler");
const {
  createReservationSchema,
  listReservationsSchema,
  reservationParamsSchema,
  updateReservationSchema
} = require("./reservations.schema");
const {
  createReservation,
  deleteReservation,
  getReservationById,
  listReservations,
  updateReservation
} = require("./reservations.service");

const reservationsRouter = express.Router();

reservationsRouter.use(authenticate);

reservationsRouter.get(
  "/",
  validateRequest(listReservationsSchema),
  asyncHandler(async (request, response) => {
    const reservations = await listReservations(request.user, request.validated.query);
    response.json({ reservations });
  })
);

reservationsRouter.get(
  "/:id",
  validateRequest(reservationParamsSchema),
  asyncHandler(async (request, response) => {
    const reservation = await getReservationById(request.validated.params.id, request.user);
    response.json({ reservation });
  })
);

reservationsRouter.post(
  "/",
  validateRequest(createReservationSchema),
  asyncHandler(async (request, response) => {
    const reservation = await createReservation(request.validated.body, request.user);
    response.status(201).json({ reservation });
  })
);

reservationsRouter.patch(
  "/:id",
  validateRequest(updateReservationSchema),
  asyncHandler(async (request, response) => {
    const reservation = await updateReservation(
      request.validated.params.id,
      request.validated.body,
      request.user
    );
    response.json({ reservation });
  })
);

reservationsRouter.delete(
  "/:id",
  validateRequest(reservationParamsSchema),
  asyncHandler(async (request, response) => {
    await deleteReservation(request.validated.params.id, request.user);
    response.status(204).send();
  })
);

module.exports = { reservationsRouter };
