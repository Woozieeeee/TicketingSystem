const http = require("http");

function get(path) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      { hostname: "localhost", port: 3001, path, method: "GET" },
      (res) => {
        let b = "";
        res.on("data", (c) => (b += c));
        res.on("end", () => {
          try {
            resolve(JSON.parse(b || "[]"));
          } catch (e) {
            resolve(b);
          }
        });
      },
    );
    req.on("error", reject);
    req.end();
  });
}

(async () => {
  try {
    const tickets = await get("/api/tickets/");
    console.log(
      "Total tickets from API:",
      Array.isArray(tickets) ? tickets.length : 0,
    );
    console.log("Sample tickets:");
    tickets
      .slice(0, 5)
      .forEach((t) =>
        console.log({
          id: t.id,
          createdBy: t.createdBy,
          dept: t.dept,
          status: t.status,
          createdAt: t.createdAt,
        }),
      );

    const headUser = { username: "mark1", role: "Head", dept: "IT" };
    const visible = tickets.filter((t) => t.dept === headUser.dept);
    console.log("\nTickets visible to head (dept match):", visible.length);
    visible
      .slice(0, 5)
      .forEach((t) =>
        console.log({ id: t.id, createdBy: t.createdBy, dept: t.dept }),
      );

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(2);
  }
})();
