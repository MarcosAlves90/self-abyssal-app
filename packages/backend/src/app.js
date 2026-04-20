const cors = require("cors");
const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");

const { env } = require("./config/env");
const { errorHandler } = require("./middlewares/errorHandler");
const { notFound } = require("./middlewares/notFound");
const { registerModules } = require("./modules");

function createApp() {
  const app = express();

  app.disable("x-powered-by");
  if (env.trustProxy !== false) {
    app.set("trust proxy", env.trustProxy);
  }
  app.use(helmet());
  app.use(
    cors({
      origin: env.corsOrigin === "*" ? true : env.corsOrigin.split(",")
    })
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(morgan("tiny"));
  app.use((request, response, next) => {
    const forwardedProto = request.headers["x-forwarded-proto"];

    if (env.nodeEnv === "production" && forwardedProto !== "https") {
      return response.status(426).json({
        message: "HTTPS is required in production."
      });
    }

    return next();
  });

  app.get("/health", (request, response) => {
    response.json({
      status: "ok"
    });
  });

  registerModules(app);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
