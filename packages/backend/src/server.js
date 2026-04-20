const { createApp } = require("./app");
const { connectDatabase } = require("./database/mongoose");
const { seedDatabase } = require("./database/seed");

async function startServer() {
  const app = createApp();
  const { env } = require("./config/env");

  await connectDatabase();

  if (env.autoSeed) {
    await seedDatabase();
  }

  app.listen(env.port, () => {
    console.log(`[server] API running on port ${env.port}`);
  });
}

startServer().catch((error) => {
  console.error("[bootstrap]", error.message);
  process.exit(1);
});
