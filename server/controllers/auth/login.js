const User = require("../../models/user");
const { generateAndSaveToken } = require("../../middleware/authMiddleware");

module.exports = async (req, res) => {
  try {
    const { username, password } = req.body;

    // 🔍 DEBUG LOG 1: Tingnan kung ano ang tine-text mula sa login form input fields
    console.log("====== 🛰️ LOGIN ATTEMPT ======");
    console.log("Input Username:", username);
    console.log("Input Password:", password);

    const user = await User.findByUsername(username);

    if (!user) {
      console.log("❌ DEBUG: Walang nahanap na user sa DB na may ganyang username!");
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // 🔍 DEBUG LOG 2: Tingnan kung ano ang eksaktong nakuha sa MySQL user row
    console.log("📂 USER FOUND IN DB:");
    console.log("Database ID:", user.id);
    console.log("Database Username:", user.username);
    console.log("Database Password Hash:", user.password);
    console.log("Database Status:", user.status);

    // TEMPORARILY DISABLED: Allow login to create initial Head account
    // if (user.status === 'Pending') {
    //   console.log("⚠️ DEBUG: Harang dahil PENDING status!");
    //   return res.status(403).json({ 
    //     message: "Your account is still pending approval. Please wait for your Department Head to activate it." 
    //   });
    // }

    if (user.status === 'Suspended') {
      console.log("⚠️ DEBUG: Harang dahil SUSPENDED status!");
      return res.status(403).json({ 
        message: "Your account has been suspended. Please contact the IT Department." 
      });
    }

    // 🔍 DEBUG LOG 3: Bago pumasok sa bcrypt.compare logic block checker
    console.log("⚙️ Verifying password via bcrypt...");
    const isValidPassword = await User.verifyPassword(password, user.password);
    console.log("📊 Is Password Valid? Result:", isValidPassword);

    if (!isValidPassword) {
      console.log("❌ DEBUG: Hindi nagmatch ang text input password sa database secure hash string!");
      return res.status(401).json({ message: "Invalid username or password" });
    }

    console.log("🟢 DEBUG: Password match successful! Processing authentication triggers token creation...");

    await User.incrementLoginCount(user.id);
    const { token, expires } = await generateAndSaveToken(user.id);
    const updatedUser = await User.findById(user.id);

    console.log("✨ LOGIN SUCCESSFUL FOR USER:", updatedUser.username);
    console.log("===============================");

    return res.status(200).json({
      id: updatedUser.id,
      username: updatedUser.username,
      role: updatedUser.role,
      dept: updatedUser.dept,
      login_count: updatedUser.login_count,
      token: token,
      token_expires: expires,
    });
  } catch (error) {
    console.error("❌ Login Error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};