(async () => {
  try {
    const db = require("../server/config/db");
    const tables =
      await db.$queryRaw`SELECT table_name FROM information_schema.tables WHERE table_schema='public'`;
    console.log(
      "TABLES:",
      tables.map((t) => t.table_name),
    );

    // Try common table names
    const candidateNames = ["User", "user", "users", '"User"', '"users"'];
    for (const name of candidateNames) {
      try {
        const cols = await db.$queryRawUnsafe(
          `SELECT column_name,is_nullable,data_type,column_default FROM information_schema.columns WHERE table_name=${db._utils.encodeRaw ? db._utils.encodeRaw(name) : `'${name.replace("'", "''")}'`}`,
        );
        if (cols && cols.length) {
          console.log("COLUMNS for", name, cols);
        }
      } catch (e) {
        /* ignore */
      }
    }
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(2);
  }
})();
