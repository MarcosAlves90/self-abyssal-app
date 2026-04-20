const { HttpError } = require("../../shared/httpError");
const { MenuItem } = require("./menu.model");

function serializeMenuItem(item) {
  return {
    id: String(item._id),
    name: item.name,
    slug: item.slug,
    description: item.description,
    category: item.category,
    priceCents: item.priceCents,
    isFeatured: item.isFeatured,
    imageHint: item.imageHint,
    availableForDelivery: item.availableForDelivery,
    availableForDineIn: item.availableForDineIn,
    accentColor: item.accentColor
  };
}

async function listMenu(filters) {
  const query = {};

  if (filters.category) {
    query.category = filters.category;
  }

  if (filters.featured) {
    query.isFeatured = filters.featured === "true";
  }

  const items = await MenuItem.find(query).sort({ category: 1, name: 1 }).lean();
  return items.map(serializeMenuItem);
}

async function getMenuItemById(id) {
  const item = await MenuItem.findById(id).lean();

  if (!item) {
    throw new HttpError(404, "Menu item not found.");
  }

  return serializeMenuItem(item);
}

async function createMenuItem(payload) {
  const item = await MenuItem.create(payload);
  return serializeMenuItem(item);
}

async function updateMenuItem(id, payload) {
  const item = await MenuItem.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true
  }).lean();

  if (!item) {
    throw new HttpError(404, "Menu item not found.");
  }

  return serializeMenuItem(item);
}

async function deleteMenuItem(id) {
  const item = await MenuItem.findByIdAndDelete(id).lean();

  if (!item) {
    throw new HttpError(404, "Menu item not found.");
  }
}

module.exports = {
  createMenuItem,
  deleteMenuItem,
  getMenuItemById,
  listMenu,
  updateMenuItem
};
