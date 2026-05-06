// server/controllers/userController.js
const db = require('../db');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid'); // for generating unique IDs

exports.getAllUsers = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, username, role, dept, login_count FROM users');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getUserById = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT id, username, role, dept, login_count FROM users WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ message: 'User not found' });
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.registerUser = async (req, res) => {
  try {
    const { username, password, role, dept } = req.body;
    if (!username || !password || !role) {
      return res.status(400).json({ error: 'username, password and role are required' });
    }

    const id = uuidv4();
    const cleanDept = dept ? dept.trim() : 'General';
    const hashedPassword = await bcrypt.hash(password, 10);

    await db.query(
      'INSERT INTO users (id, username, password, role, dept, login_count) VALUES (?, ?, ?, ?, ?, 0)',
      [id, username, hashedPassword, role, cleanDept],
    );

    res.status(201).json({ message: 'User registered successfully', userId: id });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const { username, role, dept } = req.body;

  if (!username || !role) {
    return res.status(400).json({ error: 'username and role are required' });
  }

  try {
    const cleanDept = dept ? dept.trim() : 'General';
    const [result] = await db.query(
      'UPDATE users SET username = ?, role = ?, dept = ? WHERE id = ?',
      [username, role, cleanDept, id],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM users WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;
    const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: 'Incorrect password' });

    const token = uuidv4();
    const tokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiry

    await db.query('UPDATE users SET auth_token = ?, token_expires = ? WHERE id = ?', [token, tokenExpires, user.id]);

    res.json({ message: 'Login successful', token, userId: user.id });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: error.message });
  }
};