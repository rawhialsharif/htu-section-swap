const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const router = express.Router();
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRY = '7d';

// POST /auth/register
router.post('/register', async (req, res) => {
  try {
    const { phone, name, password } = req.body;
    if (!phone || !name || !password) {
      return res.status(400).json({ error: 'Phone, name, and password are required.' });
    }
    if (!/^\+?[\d\s\-]{7,15}$/.test(phone)) {
      return res.status(400).json({ error: 'Invalid phone number format.' });
    }

    const existing = await db.getAsync('SELECT id FROM students WHERE phone = ?', [phone]);
    if (existing) {
      return res.status(409).json({ error: 'Phone number already registered.' });
    }

    const hash = await bcrypt.hash(password, 12);
    const result = await db.runAsync(
      'INSERT INTO students (phone, name, password_hash) VALUES (?, ?, ?)',
      [phone, name.trim(), hash]
    );

    const token = jwt.sign({ id: result.lastID, phone, name: name.trim() }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
    res.status(201).json({ token, user: { id: result.lastID, phone, name: name.trim() } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// POST /auth/login
router.post('/login', async (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) {
      return res.status(400).json({ error: 'Phone and password required.' });
    }

    // Admin login
    if (phone === 'admin') {
      if (password === process.env.ADMIN_PASSWORD) {
        const token = jwt.sign(
          { id: 'admin', phone: 'admin', name: 'Administrator', role: 'admin' },
          JWT_SECRET,
          { expiresIn: JWT_EXPIRY }
        );
        return res.json({ token, user: { id: 'admin', phone: 'admin', name: 'Administrator', role: 'admin' } });
      } else {
        return res.status(401).json({ error: 'Invalid admin credentials.' });
      }
    }

    const student = await db.getAsync('SELECT * FROM students WHERE phone = ?', [phone]);
    if (!student) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const valid = await bcrypt.compare(password, student.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const token = jwt.sign(
      { id: student.id, phone: student.phone, name: student.name },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );
    res.json({ token, user: { id: student.id, phone: student.phone, name: student.name } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
