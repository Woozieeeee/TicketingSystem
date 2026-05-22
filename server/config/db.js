const mysql = require("mysql2/promise");
// Inii-load ang mga variable mula sa .env file kung mayroon man
require('dotenv').config();

const pool = mysql.createPool({
  // Kung may DB_HOST sa .env, yun ang gagamitin. Kung wala, "localhost".
  host: process.env.DB_HOST || "localhost",
  
  // Kung may DB_USER sa .env, yun ang gagamitin. Kung wala, "root".
  user: process.env.DB_USER || "root",
  
  // Gagamitin ang DB_PASSWORD mula sa .env. 
  // Kung wala, gagamitin ang local password mo bilang fallback para hindi mag-crash sa PC mo.
  password: process.env.DB_PASSWORD || "earl11022003_",
  
  // Case-insensitive o flexible handling para sa pangalan ng database
  database: process.env.DB_NAME || "TicketingSystem",
  
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = pool;