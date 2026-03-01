const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: "localhost",
  user: "Woozie", // The username you set in Workbench
  password: "@Woozieeeee12345_", // The password you set in Workbench
  database: "ticketingsystem",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = pool;
