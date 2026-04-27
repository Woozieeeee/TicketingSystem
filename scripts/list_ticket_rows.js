(async () => {
  try {
    const db = require("../server/config/db");
    const rows =
      await db.$queryRaw`SELECT id, title, description, status, "userId", "createdAt", "updatedAt" FROM "Ticket" ORDER BY "createdAt" DESC`;
    console.log("Ticket rows count:", rows.length);
    rows.slice(0, 10).forEach((r) => console.log(r));
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(2);
  }
})();
