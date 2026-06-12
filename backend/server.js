/**
 * server.js
 * Express application entry point for Employee Attendance Tracking System.
 */
require('dotenv').config();

const express      = require('express');
const cors         = require('cors');
const path         = require('path');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes       = require('./routes/auth');
const employeeRoutes   = require('./routes/employees');
const attendanceRoutes = require('./routes/attendance');
const dashboardRoutes  = require('./routes/dashboard');
const reportRoutes     = require('./routes/reports');

// Initialise DB connection (side-effect: verifies connection)
require('./config/db');

const app  = express();
const PORT = process.env.PORT || 5000;

/* ── Middleware ───────────────────────────────────────────── */
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://attendence-erp.vercel.app"
    ],
    credentials: true
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ── Routes ───────────────────────────────────────────────── */
app.use('/api/auth',       authRoutes);
app.use('/api/employees',  employeeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/dashboard',  dashboardRoutes);
app.use('/api/reports',    reportRoutes);

/* ── Health check ─────────────────────────────────────────── */
app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'ERP Attendance API is running.', timestamp: new Date().toISOString() });
});

/* ── 404 handler ──────────────────────────────────────────── */
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found.' });
});

/* ── Central error handler ────────────────────────────────── */
app.use(errorHandler);

/* ── Start server ─────────────────────────────────────────── */
app.listen(PORT, () => {
  console.log(`🚀  Server running on http://localhost:${PORT}`);
  console.log(`📋  Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
