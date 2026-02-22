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
    req.on("error", (e) => reject(e));
    req.write(data);
    req.end();
  });
}

(async () => {
  try {
    const username = "test_user_" + Date.now();
    console.log("Registering as", username);
    const reg = await post("/api/register", {
      username,
      password: "secret123",
      department: "IT",
    });
    console.log("REGISTER:", reg.status, reg.body);

    console.log("Logging in as", username);
    const login = await post("/api/login", { username, password: "secret123" });
    console.log("LOGIN:", login.status, login.body);
  } catch (e) {
    console.error("ERROR", e);
    process.exitCode = 2;
  }
})();
