// Entrypoint for the backend when running from project root (e.g. `nodemon index.js`).
// This simply forwards to the server implementation in ./server/index.js
try {
  require("./server/index.js");
} catch (err) {
  console.error(
    "Failed to start server from root index.js:",
    err?.message ?? err,
  );
  process.exit(1);
}
