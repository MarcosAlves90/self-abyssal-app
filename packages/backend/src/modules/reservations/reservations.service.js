const { Branch } = require("../branches/branches.model");
const { HttpError } = require("../../shared/httpError");
const { decryptText, encryptText } = require("../../shared/security/fieldEncryption");
const { Reservation } = require("./reservations.model");

function serializeReservation(reservation) {
  return {
    id: String(reservation._id),
    userId: String(reservation.userId),
    branchId:
      typeof reservation.branchId === "object" && reservation.branchId?._id
        ? String(reservation.branchId._id)
        : String(reservation.branchId),
    branchName:
      typeof reservation.branchId === "object" && reservation.branchId?.name
        ? reservation.branchId.name
        : undefined,
    scheduledAt: reservation.scheduledAt,
    guests: reservation.guests,
    depthLevel: reservation.depthLevel,
    status: reservation.status,
    specialRequest: decryptText(reservation.specialRequestEncrypted)
  };
}

async function assertBranchSupportsDepth(branchId, depthLevel) {
  const branch = await Branch.findById(branchId).lean();

  if (!branch) {
    throw new HttpError(404, "Selected branch not found.");
  }

  if (!branch.reservationDepths.includes(depthLevel)) {
    throw new HttpError(400, "Selected branch does not support this depth level.");
  }
}

async function listReservations(user, filters) {
  const query = user.role === "admin" ? {} : { userId: user.id };

  if (filters.status) {
    query.status = filters.status;
  }

  const reservations = await Reservation.find(query)
    .populate("branchId", "name")
    .sort({ scheduledAt: 1 })
    .lean();

  return reservations.map(serializeReservation);
}

async function getReservationById(id, user) {
  const reservation = await Reservation.findById(id).populate("branchId", "name").lean();

  if (!reservation) {
    throw new HttpError(404, "Reservation not found.");
  }

  if (user.role !== "admin" && String(reservation.userId) !== user.id) {
    throw new HttpError(403, "Reservation access denied.");
  }

  return serializeReservation(reservation);
}

async function createReservation(payload, user) {
  await assertBranchSupportsDepth(payload.branchId, payload.depthLevel);

  const reservation = await Reservation.create({
    userId: user.id,
    branchId: payload.branchId,
    scheduledAt: new Date(payload.scheduledAt),
    guests: payload.guests,
    depthLevel: payload.depthLevel,
    specialRequestEncrypted: encryptText(payload.specialRequest)
  });

  const hydratedReservation = await Reservation.findById(reservation._id)
    .populate("branchId", "name")
    .lean();

  return serializeReservation(hydratedReservation);
}

async function updateReservation(id, payload, user) {
  const reservation = await Reservation.findById(id);

  if (!reservation) {
    throw new HttpError(404, "Reservation not found.");
  }

  if (user.role !== "admin" && String(reservation.userId) !== user.id) {
    throw new HttpError(403, "Reservation access denied.");
  }

  const nextBranchId = payload.branchId || reservation.branchId;
  const nextDepthLevel = payload.depthLevel || reservation.depthLevel;

  if (payload.branchId || payload.depthLevel) {
    await assertBranchSupportsDepth(nextBranchId, nextDepthLevel);
  }

  if (payload.scheduledAt) {
    reservation.scheduledAt = new Date(payload.scheduledAt);
  }

  if (payload.guests !== undefined) {
    reservation.guests = payload.guests;
  }

  if (payload.depthLevel) {
    reservation.depthLevel = payload.depthLevel;
  }

  if (payload.branchId) {
    reservation.branchId = payload.branchId;
  }

  if (payload.status) {
    reservation.status = payload.status;
  }

  if (payload.specialRequest !== undefined) {
    reservation.specialRequestEncrypted = encryptText(payload.specialRequest);
  }

  await reservation.save();

  return getReservationById(id, user);
}

async function deleteReservation(id, user) {
  const reservation = await Reservation.findById(id);

  if (!reservation) {
    throw new HttpError(404, "Reservation not found.");
  }

  if (user.role !== "admin" && String(reservation.userId) !== user.id) {
    throw new HttpError(403, "Reservation access denied.");
  }

  await reservation.deleteOne();
}

module.exports = {
  createReservation,
  deleteReservation,
  getReservationById,
  listReservations,
  updateReservation
};
