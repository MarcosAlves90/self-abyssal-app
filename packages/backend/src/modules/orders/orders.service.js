const { Branch } = require("../branches/branches.model");
const { MenuItem } = require("../menu/menu.model");
const { Reservation } = require("../reservations/reservations.model");
const { HttpError } = require("../../shared/httpError");
const { decryptText, encryptText } = require("../../shared/security/fieldEncryption");
const { Order } = require("./orders.model");

function serializeOrder(order) {
  return {
    id: String(order._id),
    userId: String(order.userId),
    branchId:
      typeof order.branchId === "object" && order.branchId?._id
        ? String(order.branchId._id)
        : order.branchId
          ? String(order.branchId)
          : undefined,
    branchName:
      typeof order.branchId === "object" && order.branchId?.name
        ? order.branchId.name
        : undefined,
    reservationId: order.reservationId ? String(order.reservationId) : undefined,
    fulfillmentType: order.fulfillmentType,
    status: order.status,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    totalCents: order.totalCents,
    deliveryAddress: decryptText(order.deliveryAddressEncrypted),
    contactName: decryptText(order.contactNameEncrypted),
    items: order.items.map((item) => ({
      menuItemId: String(item.menuItemId),
      name: item.nameSnapshot,
      quantity: item.quantity,
      unitPriceCents: item.unitPriceCents,
      note: decryptText(item.noteEncrypted)
    })),
    createdAt: order.createdAt
  };
}

async function prepareOrderItems(items) {
  const menuIds = items.map((item) => item.menuItemId);
  const menuItems = await MenuItem.find({ _id: { $in: menuIds } }).lean();
  const menuMap = new Map(menuItems.map((item) => [String(item._id), item]));

  if (menuItems.length !== items.length) {
    throw new HttpError(400, "One or more menu items are invalid.");
  }

  return items.map((item) => {
    const menuItem = menuMap.get(item.menuItemId);

    return {
      menuItemId: item.menuItemId,
      nameSnapshot: menuItem.name,
      quantity: item.quantity,
      unitPriceCents: menuItem.priceCents,
      noteEncrypted: encryptText(item.note)
    };
  });
}

function calculateTotalCents(items) {
  return items.reduce((sum, item) => sum + item.quantity * item.unitPriceCents, 0);
}

async function assertOrderRelationships(payload, user) {
  if (payload.branchId) {
    const branch = await Branch.findById(payload.branchId).lean();

    if (!branch) {
      throw new HttpError(404, "Selected branch not found.");
    }
  }

  if (payload.reservationId) {
    const reservation = await Reservation.findById(payload.reservationId).lean();

    if (!reservation) {
      throw new HttpError(404, "Selected reservation not found.");
    }

    if (user.role !== "admin" && String(reservation.userId) !== user.id) {
      throw new HttpError(403, "Reservation access denied for this order.");
    }
  }
}

async function listOrders(user, filters) {
  const query = user.role === "admin" ? {} : { userId: user.id };

  if (filters.status) {
    query.status = filters.status;
  }

  const orders = await Order.find(query)
    .populate("branchId", "name")
    .sort({ createdAt: -1 })
    .lean();

  return orders.map(serializeOrder);
}

async function getOrderById(id, user) {
  const order = await Order.findById(id).populate("branchId", "name").lean();

  if (!order) {
    throw new HttpError(404, "Order not found.");
  }

  if (user.role !== "admin" && String(order.userId) !== user.id) {
    throw new HttpError(403, "Order access denied.");
  }

  return serializeOrder(order);
}

async function createOrder(payload, user) {
  await assertOrderRelationships(payload, user);

  const preparedItems = await prepareOrderItems(payload.items);
  const totalCents = calculateTotalCents(preparedItems);

  const order = await Order.create({
    userId: user.id,
    branchId: payload.branchId,
    reservationId: payload.reservationId,
    fulfillmentType: payload.fulfillmentType,
    items: preparedItems,
    paymentMethod: payload.paymentMethod,
    paymentStatus:
      payload.paymentMethod === "in_app_card_tokenized" ? "authorized" : "pending",
    deliveryAddressEncrypted: encryptText(payload.deliveryAddress),
    contactNameEncrypted: encryptText(payload.contactName),
    totalCents
  });

  return getOrderById(order._id, user);
}

async function updateOrder(id, payload, user) {
  const order = await Order.findById(id);

  if (!order) {
    throw new HttpError(404, "Order not found.");
  }

  if (user.role !== "admin" && String(order.userId) !== user.id) {
    throw new HttpError(403, "Order access denied.");
  }

  if (payload.status) {
    order.status = payload.status;
  }

  if (payload.paymentStatus) {
    order.paymentStatus = payload.paymentStatus;
  }

  await order.save();

  return getOrderById(id, user);
}

async function deleteOrder(id, user) {
  const order = await Order.findById(id);

  if (!order) {
    throw new HttpError(404, "Order not found.");
  }

  if (user.role !== "admin" && String(order.userId) !== user.id) {
    throw new HttpError(403, "Order access denied.");
  }

  await order.deleteOne();
}

module.exports = {
  createOrder,
  deleteOrder,
  getOrderById,
  listOrders,
  updateOrder
};
