const mongoose = require("mongoose");

const { connectDatabase } = require("./mongoose");
const { seedDatabase } = require("./seed");

async function runSeed() {
  await connectDatabase();
  await seedDatabase();
  await mongoose.disconnect();
  console.log("[seed] Finished populating sample data.");
}

runSeed().catch((error) => {
  console.error("[seed]", error.message);
  process.exit(1);
});
