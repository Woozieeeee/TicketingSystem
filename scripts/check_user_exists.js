(async () => {
  try {
    const db = require("../server/config/db");
    const rows = await db.$queryRawUnsafe(
      'SELECT id, username, dept FROM "User" WHERE id = $1',
      "u_1771752650431_2290",
    );
    console.log("User rows:", rows);
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(2);
  }
})();
