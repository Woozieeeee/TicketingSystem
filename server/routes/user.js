const express = require("express");
const router = express.Router();

// I-import ang authMiddleware mo
const { verifyToken, requireITHead } = require("../middleware/authMiddleware");

// 🟢 Halimbawang endpoint: Kunin ang lahat ng users (Para lang sa IT Head)
router.get("/", verifyToken, requireITHead, async (req, res) => {
  try {
    // Dito mo ilalagay ang database query mo o tatawagin ang controller mo
    // Halimbawa: const [users] = await db.query("SELECT id, username, role, dept FROM users");
    
    res.json({
      success: true,
      message: "Users list fetched successfully (IT Head authorized).",
      // data: users
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// 🟢 Halimbawang endpoint: Mag-register ng bagong account (Para lang sa IT Head)
router.post("/register", verifyToken, requireITHead, async (req, res) => {
  // Ang logic mo para sa pag-add ng bagong user sa database...
});

module.exports = router;