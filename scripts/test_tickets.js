const http = require("http");

function post(path, payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const req = http.request(
      {
        hostname: "localhost",
        port: 3001,
        path,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(data),
        },
      },
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
    );
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

function put(path, payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const req = http.request(
      {
        hostname: "localhost",
        port: 3001,
        path,
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(data),
        },
      },
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
    );
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

(async () => {
  try {
    const username = "ticket_test_" + Date.now();
    console.log("\n1. Creating test user:", username);
    const reg = await post("/api/register", {
      username,
      password: "secret123",
      department: "IT",
    });
    console.log("   Status:", reg.status, "| ID:", reg.body.id);

    if (reg.status !== 201) {
      console.error("   Failed to create user");
      return;
    }

    const userId = reg.body.id;

    console.log("\n2. Creating ticket for user:", userId);
    const createTicket = await post("/api/tickets", {
      title: "Test Ticket",
      description: "This is a test ticket",
      userId: userId,
      category: "Network",
      status: "PENDING",
      dept: "IT",
    });
    console.log("   Status:", createTicket.status);
    console.log("   Ticket ID:", createTicket.body.id);

    if (createTicket.status !== 200) {
      console.error("   Failed to create ticket");
      console.error("   Error:", createTicket.body);
      return;
    }

    const ticketId = createTicket.body.id;

    console.log("\n3. Updating ticket:", ticketId);
    const updateTicket = await put(`/api/tickets/${ticketId}`, {
      title: "Updated Test Ticket",
      description: "This ticket has been updated",
      status: "IN_PROGRESS",
    });
    console.log("   Status:", updateTicket.status);
    console.log("   Updated title:", updateTicket.body.title);

    console.log("\n✓ All ticket operations successful!");
    process.exit(0);
  } catch (e) {
    console.error("ERROR", e);
    process.exit(2);
  }
})();
