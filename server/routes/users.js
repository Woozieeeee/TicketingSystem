// server/routes/user.js
const express = require("express");
const router = express.Router();
const db = require("../config/db"); // 🟢 Idinagdag: I-require ang database connection mo

// I-import ang authMiddleware mo (Mananatili ang sa iyo)
const { verifyToken, requireITHead } = require("../middleware/authMiddleware");

// 🟢 Kunin ang lahat ng users (Para lang sa IT Head) — Naka-sync sa frontend dashboard requirement fallback
router.get("/", verifyToken, requireITHead, async (req, res) => {
  try {
    // 🟢 Kukunin natin ang mga fields na eksaktong hinahanap ng useMemo dashboard mapper ng frontend mo
    const [users] = await db.query(
      "SELECT id, username, role, dept, login_count, created_at AS createdAt FROM users"
    );
    
    // Dahil sa project ng coworker mo ay array agad ang binabato o kaya naman ay may success wrapper,
    // I-return natin ang array para direktang mabasa ng .map() ng frontend mo kapag nag-fallback
    res.json(users); 
    
  } catch (error) {
    console.error("❌ Error fetching users for dashboard fallback:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// 🟢 Mag-register ng bagong account (Para lang sa IT Head) — Mananatili ang kasalukuyan mong setup
router.post("/register", verifyToken, requireITHead, async (req, res) => {
  // Ang kasalukuyan mong logic para sa pag-add ng bagong user sa database...
});

module.exports = router;