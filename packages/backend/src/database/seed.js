const { Branch } = require("../modules/branches/branches.model");
const { MenuItem } = require("../modules/menu/menu.model");

const branches = [
  {
    name: "Abyssal Paulista",
    slug: "abyssal-paulista",
    city: "Sao Paulo",
    neighborhood: "Bela Vista",
    addressLine: "Av. Paulista, 1100",
    openHours: "18:00 - 23:30",
    reservationDepths: ["Zona Crepuscular", "Zona Mesopelagica", "Zona Abissal"]
  },
  {
    name: "Abyssal Pinheiros",
    slug: "abyssal-pinheiros",
    city: "Sao Paulo",
    neighborhood: "Pinheiros",
    addressLine: "Rua dos Corais, 245",
    openHours: "18:30 - 23:00",
    reservationDepths: ["Superficie", "Zona Crepuscular", "Zona Abissal"]
  },
  {
    name: "Abyssal Santos",
    slug: "abyssal-santos",
    city: "Santos",
    neighborhood: "Ponta da Praia",
    addressLine: "Av. do Oceano, 89",
    openHours: "19:00 - 00:00",
    reservationDepths: ["Zona Mesopelagica", "Zona Batipelagica", "Zona Abissal"]
  }
];

const menuItems = [
  ["Ostra Neon", "ostra-neon", "entradas", 4200, true, "ostra"],
  ["Ceviche de Lulas Prismatica", "ceviche-lulas-prismatica", "entradas", 4800, true, "lulas"],
  ["Bao de Camarao Fantasma", "bao-camarao-fantasma", "entradas", 3600, false, "bao"],
  ["Tartare de Atum Obscuro", "tartare-atum-obscuro", "entradas", 5100, false, "atum"],
  ["Lagosta Bioluminescente", "lagosta-bioluminescente", "principais", 12900, true, "lagosta"],
  ["Risoto de Polvo Ink", "risoto-polvo-ink", "principais", 7600, true, "polvo"],
  ["Bacalhau das Correntes Frias", "bacalhau-correntes-frias", "principais", 8400, false, "bacalhau"],
  ["Arroz Negro com Vieiras", "arroz-negro-vieiras", "principais", 9300, false, "vieiras"],
  ["Ramen de Mariscos Abissal", "ramen-mariscos-abissal", "principais", 6700, false, "ramen"],
  ["Brioche de Caranguejo Azul", "brioche-caranguejo-azul", "principais", 5900, false, "caranguejo"],
  ["Mousse de Algas Doces", "mousse-algas-doces", "sobremesas", 2900, false, "mousse"],
  ["Torta Lua de Perola", "torta-lua-de-perola", "sobremesas", 3400, true, "torta"],
  ["Pudim de Sal Marinho", "pudim-sal-marinho", "sobremesas", 2700, false, "pudim"],
  ["Elixir de Plancton", "elixir-de-plancton", "bebidas", 2200, true, "drink"],
  ["Soda de Agua-Viva", "soda-de-agua-viva", "bebidas", 1800, false, "soda"]
].map(([name, slug, category, priceCents, isFeatured, imageHint], index) => ({
  name,
  slug,
  category,
  priceCents,
  isFeatured,
  imageHint,
  description:
    "Composicao autoral com ingredientes do mar, finalizacao delicada e contraste luminoso inspirado na experiencia abissal.",
  availableForDelivery: category !== "entradas" || index % 2 === 0,
  availableForDineIn: true,
  accentColor: ["#31e7ff", "#8df9ff", "#1ad1c9", "#7ae1ff"][index % 4]
}));

async function seedDatabase() {
  const [branchCount, menuCount] = await Promise.all([
    Branch.countDocuments(),
    MenuItem.countDocuments()
  ]);

  if (branchCount === 0) {
    await Branch.insertMany(branches);
  }

  if (menuCount === 0) {
    await MenuItem.insertMany(menuItems);
  }
}

module.exports = { seedDatabase };
