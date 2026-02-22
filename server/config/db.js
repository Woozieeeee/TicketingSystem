const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

console.log(
  "Initializing Prisma with DATABASE_URL:",
  process.env.DATABASE_URL ? "✓ set" : "✗ not set",
);

if (!global.__prisma) {
  try {
    // create pg adapter with the connection string
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL,
    });
    global.__prisma = new PrismaClient({ adapter });
    console.log("✓ Prisma client created with pg adapter");
  } catch (err) {
    console.error("✗ Failed to create Prisma client:", err.message);
    throw err;
  }
}

module.exports = global.__prisma;
