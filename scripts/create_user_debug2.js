(async () => {
  try {
    const db = require("../server/config/db");
    const username = "manual_test2_" + Date.now();
    console.log("Creating user", username);
    const u = await db.user.create({
      data: {
        id: "manual_" + Date.now(),
        username,
        password: "pw",
        role: "Head",
        dept: "IT",
      },
    });
    console.log("CREATED", u);
    process.exit(0);
  } catch (e) {
    console.error("CREATE ERROR", e);
    process.exit(2);
  }
})();
