(async () => {
  try {
    const db = require("../server/config/db");
    console.log(
      "Setting up sequences and defaults for User and Ticket id columns...",
    );
    await db.$executeRawUnsafe(
      `CREATE SEQUENCE IF NOT EXISTS user_id_seq OWNED BY "User".id`,
    );
    await db.$executeRawUnsafe(
      `SELECT setval('user_id_seq', COALESCE((SELECT MAX(id) FROM "User"), 0))`,
    );
    await db.$executeRawUnsafe(
      `ALTER TABLE "User" ALTER COLUMN id SET DEFAULT nextval('user_id_seq')`,
    );

    await db.$executeRawUnsafe(
      `CREATE SEQUENCE IF NOT EXISTS ticket_id_seq OWNED BY "Ticket".id`,
    );
    await db.$executeRawUnsafe(
      `SELECT setval('ticket_id_seq', COALESCE((SELECT MAX(id) FROM "Ticket"), 0))`,
    );
    await db.$executeRawUnsafe(
      `ALTER TABLE "Ticket" ALTER COLUMN id SET DEFAULT nextval('ticket_id_seq')`,
    );

    console.log("Done.");
    process.exit(0);
  } catch (e) {
    console.error("ERROR", e);
    process.exit(2);
  }
})();
