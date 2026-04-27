(async () => {
  try {
    const db = require("../server/config/db");
    const users = await db.user.findMany({
      where: { username: { contains: "test_user_" } },
      take: 10,
    });
    console.log("FOUND USERS:", users.length);
    users.forEach((u) => console.log(u.username, u.id));
    process.exit(0);
  } catch (e) {
    console.error("ERROR", e);
    process.exit(2);
  }
})();
