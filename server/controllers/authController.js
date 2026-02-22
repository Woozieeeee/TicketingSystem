const prisma = require("../config/db");

exports.register = async (req, res) => {
  const { username, password, role, dept } = req.body;
  try {
    const user = await prisma.user.create({
      data: { username, password, role, dept },
    });
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: "Registration failed" });
  }
};

exports.login = async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { username } });
    if (user && user.password === password) {
      res.json(user);
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};
