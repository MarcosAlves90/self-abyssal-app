const mongoose = require("mongoose");

const { env } = require("../config/env");

async function connectDatabase() {
  mongoose.set("strictQuery", true);

  await mongoose.connect(env.mongoUri, {
    serverSelectionTimeoutMS: 5000
  });
}

module.exports = { connectDatabase };
