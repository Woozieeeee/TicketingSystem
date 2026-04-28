const express = require("express");
const router = express.Router();
<<<<<<< HEAD
const authController = require("../controllers/authController");

router.post("/register", authController.register);
router.post("/login", authController.login);
=======
const auth = require("../controllers/auth");
const { validateSession } = require("../middleware/authMiddleware");

router.post("/register", auth.register);
router.post("/login", auth.login);
router.post("/logout", auth.logout);
router.get("/validate", validateSession);  // Check if session is valid
>>>>>>> 89fb20978258dae2dd36356715b60a344714bc97

module.exports = router;
