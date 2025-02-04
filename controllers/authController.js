// controllers/authController.js
require('dotenv').config(); // นำเข้า dotenv
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

// Secret key for JWT
const secret = process.env.JWT_SECRET; // ใช้ค่า secret จากไฟล์ .env

// Register
exports.register = (req, res) => {
    const { username, password } = req.body;

    db.query('SELECT username FROM users WHERE username = ?', [username], (err, result) => {
        if (err) return res.status(500).json({ message: 'Database error' });

        if (result.length > 0) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        const hashedPassword = bcrypt.hashSync(password, 8);

        db.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword], (err) => {
            if (err) return res.status(500).json({ message: 'Database error' });
            return res.status(201).json({ message: 'สมัครสมาชิคสำเร็จ' });
        });
    });
};

// Login
exports.login = (req, res) => {
    const { username, password } = req.body;

    db.query('SELECT * FROM users WHERE username = ?', [username], (err, result) => {
        if (err) return res.status(500).json({ message: 'Database error' });

        if (result.length === 0) {
            return res.status(400).json({ message: 'Invalid username or password' });
        }

        const user = result[0];
        const passwordIsValid = bcrypt.compareSync(password, user.password);

        if (!passwordIsValid) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        // สร้าง JWT
        const token = jwt.sign({ id: user.id, username: user.username }, secret, { expiresIn: '24h' });
        return res.status(200).json({ message: 'Login successful', token });
    });
};
