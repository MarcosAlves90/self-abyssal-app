const express = require("express");

const { authenticate, requireAdmin } = require("../../middlewares/authenticate");
const { validateRequest } = require("../../middlewares/validateRequest");
const { asyncHandler } = require("../../shared/asyncHandler");
const {
  createMenuSchema,
  listMenuSchema,
  menuParamsSchema,
  updateMenuSchema
} = require("./menu.schema");
const {
  createMenuItem,
  deleteMenuItem,
  getMenuItemById,
  listMenu,
  updateMenuItem
} = require("./menu.service");

const menuRouter = express.Router();

menuRouter.get(
  "/",
  validateRequest(listMenuSchema),
  asyncHandler(async (request, response) => {
    const items = await listMenu(request.validated.query);
    response.json({ items });
  })
);

menuRouter.get(
  "/:id",
  validateRequest(menuParamsSchema),
  asyncHandler(async (request, response) => {
    const item = await getMenuItemById(request.validated.params.id);
    response.json({ item });
  })
);

menuRouter.post(
  "/",
  authenticate,
  requireAdmin,
  validateRequest(createMenuSchema),
  asyncHandler(async (request, response) => {
    const item = await createMenuItem(request.validated.body);
    response.status(201).json({ item });
  })
);

menuRouter.patch(
  "/:id",
  authenticate,
  requireAdmin,
  validateRequest(updateMenuSchema),
  asyncHandler(async (request, response) => {
    const item = await updateMenuItem(request.validated.params.id, request.validated.body);
    response.json({ item });
  })
);

menuRouter.delete(
  "/:id",
  authenticate,
  requireAdmin,
  validateRequest(menuParamsSchema),
  asyncHandler(async (request, response) => {
    await deleteMenuItem(request.validated.params.id);
    response.status(204).send();
  })
);

module.exports = { menuRouter };
