(async () => {
  try {
    const db = require("../server/config/db");
    const cols =
      await db.$queryRaw`SELECT column_name,is_nullable,data_type,column_default FROM information_schema.columns WHERE table_name='User' ORDER BY ordinal_position`;
    console.log("User columns:");
    cols.forEach((c) =>
      console.log(c.column_name, c.is_nullable, c.data_type, c.column_default),
    );
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(2);
  }
})();
