const express = require("express");

const { authenticate, requireAdmin } = require("../../middlewares/authenticate");
const { validateRequest } = require("../../middlewares/validateRequest");
const { asyncHandler } = require("../../shared/asyncHandler");
const {
  branchParamsSchema,
  createBranchSchema,
  listBranchesSchema,
  updateBranchSchema
} = require("./branches.schema");
const {
  createBranch,
  deleteBranch,
  getBranchById,
  listBranches,
  updateBranch
} = require("./branches.service");

const branchesRouter = express.Router();

branchesRouter.get(
  "/",
  validateRequest(listBranchesSchema),
  asyncHandler(async (request, response) => {
    const branches = await listBranches(request.validated.query);
    response.json({ branches });
  })
);

branchesRouter.get(
  "/:id",
  validateRequest(branchParamsSchema),
  asyncHandler(async (request, response) => {
    const branch = await getBranchById(request.validated.params.id);
    response.json({ branch });
  })
);

branchesRouter.post(
  "/",
  authenticate,
  requireAdmin,
  validateRequest(createBranchSchema),
  asyncHandler(async (request, response) => {
    const branch = await createBranch(request.validated.body);
    response.status(201).json({ branch });
  })
);

branchesRouter.patch(
  "/:id",
  authenticate,
  requireAdmin,
  validateRequest(updateBranchSchema),
  asyncHandler(async (request, response) => {
    const branch = await updateBranch(request.validated.params.id, request.validated.body);
    response.json({ branch });
  })
);

branchesRouter.delete(
  "/:id",
  authenticate,
  requireAdmin,
  validateRequest(branchParamsSchema),
  asyncHandler(async (request, response) => {
    await deleteBranch(request.validated.params.id);
    response.status(204).send();
  })
);

module.exports = { branchesRouter };
