/**
 * controllers/authController.js
 * Handles admin authentication.
 */
const bcrypt = require('bcrypt');
const jwt    = require('jsonwebtoken');
const Admin  = require('../models/Admin');

/**
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const admin = await Admin.findByEmail(email);
    if (!admin) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const payload = { id: admin.id, email: admin.email, name: admin.name };
    const token   = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });

    res.json({
      success: true,
      message: 'Login successful.',
      data: {
        token,
        admin: { id: admin.id, name: admin.name, email: admin.email },
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/logout
 * (JWT is stateless – client discards token; we acknowledge here.)
 */
const logout = (_req, res) => {
  res.json({ success: true, message: 'Logged out successfully.' });
};

/**
 * GET /api/auth/me
 * Returns the current authenticated admin.
 */
const me = async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.admin.id);
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found.' });
    }
    res.json({ success: true, data: admin });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/auth/update
 * Updates the current admin name, email, or password.
 */
const updateProfile = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const adminId = req.admin.id;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Name is required.' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }

    // Check conflict
    const existing = await Admin.findByEmail(email.trim());
    if (existing && existing.id !== adminId) {
      return res.status(409).json({ success: false, message: 'Email address is already in use.' });
    }

    let hashedPassword = null;
    if (password && password.trim()) {
      if (password.length < 6) {
        return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
      }
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const updated = await Admin.update(adminId, {
      name: name.trim(),
      email: email.trim(),
      password: hashedPassword,
    });

    res.json({
      success: true,
      message: 'Profile updated successfully.',
      data: {
        admin: { id: updated.id, name: updated.name, email: updated.email }
      }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { login, logout, me, updateProfile };
