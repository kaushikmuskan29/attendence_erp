/**
 * controllers/authController.js
 * Handles admin authentication.
 */
const bcrypt = require('bcrypt');
const jwt    = require('jsonwebtoken');
const crypto = require('crypto');
const Admin  = require('../models/Admin');
const nodemailer = require('nodemailer');

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

/**
 * Send password reset email helper
 */
const sendResetEmail = async (email, resetUrl) => {
  const hasSMTP = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;
  
  if (!hasSMTP) {
    console.log(`=========================================`);
    console.log(`RESET PASSWORD EMAIL (LOCAL DEV LOG)`);
    console.log(`To: ${email}`);
    console.log(`Link: ${resetUrl}`);
    console.log(`=========================================`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const mailOptions = {
    from: process.env.SMTP_FROM || '"AttendERP" <noreply@erpattendance.com>',
    to: email,
    subject: 'Password Reset Request - AttendERP',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #F57C00;">Password Reset Request</h2>
        <p>You are receiving this email because a password reset request was made for your AttendERP admin account.</p>
        <p>Please click the button below to reset your password. This link is valid for 1 hour:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #F57C00; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Reset Password</a>
        </div>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #4B5563;">${resetUrl}</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #9CA3AF;">If you did not request this, you can safely ignore this email.</p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};

/**
 * POST /api/auth/forgot-password
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }

    const admin = await Admin.findByEmail(email.trim());
    
    // We show success even if the email doesn't exist to prevent email enumeration
    if (admin) {
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 3600000); // 1 hour expiry

      await Admin.updateResetToken(admin.email, token, expiresAt);

      const frontendUrl = req.headers.origin || 'http://localhost:5173';
      const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

      await sendResetEmail(admin.email, resetUrl);
    }

    res.json({
      success: true,
      message: 'If this email is registered, a reset link has been sent'
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/reset-password
 */
const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ success: false, message: 'Token and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    const admin = await Admin.findByResetToken(token);
    if (!admin) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token.' });
    }

    const expiryTime = new Date(admin.reset_token_expires).getTime();
    if (Date.now() > expiryTime) {
      return res.status(400).json({ success: false, message: 'Reset token has expired.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await Admin.resetPassword(admin.id, hashedPassword);

    res.json({
      success: true,
      message: 'Password reset successful. Please log in.'
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { login, logout, me, updateProfile, forgotPassword, resetPassword };
