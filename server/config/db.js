const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: "localhost",
  user: "root", // The username you set in Workbench
  password: "earl11022003_", // The password you set in Workbench
  database: "TicketingSystem",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = pool;
