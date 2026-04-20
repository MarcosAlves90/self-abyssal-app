const { HttpError } = require("../../shared/httpError");
const { Branch } = require("./branches.model");

function serializeBranch(branch) {
  return {
    id: String(branch._id),
    name: branch.name,
    slug: branch.slug,
    city: branch.city,
    neighborhood: branch.neighborhood,
    addressLine: branch.addressLine,
    openHours: branch.openHours,
    reservationDepths: branch.reservationDepths
  };
}

async function listBranches(filters) {
  const query = {};

  if (filters.city) {
    query.city = new RegExp(filters.city, "i");
  }

  const branches = await Branch.find(query).sort({ city: 1, name: 1 }).lean();
  return branches.map(serializeBranch);
}

async function getBranchById(id) {
  const branch = await Branch.findById(id).lean();

  if (!branch) {
    throw new HttpError(404, "Branch not found.");
  }

  return serializeBranch(branch);
}

async function createBranch(payload) {
  const branch = await Branch.create(payload);
  return serializeBranch(branch);
}

async function updateBranch(id, payload) {
  const branch = await Branch.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true
  }).lean();

  if (!branch) {
    throw new HttpError(404, "Branch not found.");
  }

  return serializeBranch(branch);
}

async function deleteBranch(id) {
  const branch = await Branch.findByIdAndDelete(id).lean();

  if (!branch) {
    throw new HttpError(404, "Branch not found.");
  }
}

module.exports = {
  createBranch,
  deleteBranch,
  getBranchById,
  listBranches,
  updateBranch
};
