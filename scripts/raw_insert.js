(async () => {
  try {
    const db = require("../server/config/db");
    const username = "raw_" + Date.now();
    const id = "raw_" + Date.now();
    const sql = `INSERT INTO "User" (id, username, password, role, dept) VALUES ($1,$2,$3,$4,$5) RETURNING *`;
    console.log("SQL:", sql);
    const res = await db.$queryRawUnsafe(sql, id, username, "pw", "Head", "IT");
    console.log("INSERTED:", res);
    process.exit(0);
  } catch (e) {
    console.error("RAW INSERT ERROR", e);
    process.exit(2);
  }
})();
