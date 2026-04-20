const { authRouter } = require("./auth/auth.routes");
const { branchesRouter } = require("./branches/branches.routes");
const { menuRouter } = require("./menu/menu.routes");
const { ordersRouter } = require("./orders/orders.routes");
const { reservationsRouter } = require("./reservations/reservations.routes");

function registerModules(app) {
  app.use("/api/auth", authRouter);
  app.use("/api/branches", branchesRouter);
  app.use("/api/menu", menuRouter);
  app.use("/api/orders", ordersRouter);
  app.use("/api/reservations", reservationsRouter);
}

module.exports = { registerModules };
