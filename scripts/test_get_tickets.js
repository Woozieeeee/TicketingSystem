const http = require("http");

function get(path) {
  return new Promise((resolve, reject) => {
    http
      .request(
        { hostname: "localhost", port: 3001, path, method: "GET" },
        (res) => {
          let b = "";
          res.on("data", (c) => (b += c));
          res.on("end", () => {
            try {
              const json = JSON.parse(b || "{}");
              resolve({ status: res.statusCode, body: json });
            } catch (e) {
              resolve({ status: res.statusCode, body: b });
            }
          });
        },
      )
      .on("error", reject)
      .end();
  });
}

(async () => {
  try {
    console.log("\nFetching all tickets...\n");
    const tickets = await get("/api/tickets/");
    console.log("Status:", tickets.status);
    console.log(
      "Tickets count:",
      Array.isArray(tickets.body) ? tickets.body.length : 0,
    );
    if (Array.isArray(tickets.body) && tickets.body.length > 0) {
      console.log("\nFirst ticket:");
      console.log(JSON.stringify(tickets.body[0], null, 2));
    }
    process.exit(0);
  } catch (e) {
    console.error("ERROR", e);
    process.exit(2);
  }
})();
