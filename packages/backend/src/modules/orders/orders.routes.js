const express = require("express");

const { authenticate } = require("../../middlewares/authenticate");
const { validateRequest } = require("../../middlewares/validateRequest");
const { asyncHandler } = require("../../shared/asyncHandler");
const {
  createOrderSchema,
  listOrdersSchema,
  orderParamsSchema,
  updateOrderSchema
} = require("./orders.schema");
const {
  createOrder,
  deleteOrder,
  getOrderById,
  listOrders,
  updateOrder
} = require("./orders.service");

const ordersRouter = express.Router();

ordersRouter.use(authenticate);

ordersRouter.get(
  "/",
  validateRequest(listOrdersSchema),
  asyncHandler(async (request, response) => {
    const orders = await listOrders(request.user, request.validated.query);
    response.json({ orders });
  })
);

ordersRouter.get(
  "/:id",
  validateRequest(orderParamsSchema),
  asyncHandler(async (request, response) => {
    const order = await getOrderById(request.validated.params.id, request.user);
    response.json({ order });
  })
);

ordersRouter.post(
  "/",
  validateRequest(createOrderSchema),
  asyncHandler(async (request, response) => {
    const order = await createOrder(request.validated.body, request.user);
    response.status(201).json({ order });
  })
);

ordersRouter.patch(
  "/:id",
  validateRequest(updateOrderSchema),
  asyncHandler(async (request, response) => {
    const order = await updateOrder(request.validated.params.id, request.validated.body, request.user);
    response.json({ order });
  })
);

ordersRouter.delete(
  "/:id",
  validateRequest(orderParamsSchema),
  asyncHandler(async (request, response) => {
    await deleteOrder(request.validated.params.id, request.user);
    response.status(204).send();
  })
);

module.exports = { ordersRouter };
