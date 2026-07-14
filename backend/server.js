/**
 * server.js
 * Express application entry point for Employee Attendance Tracking System.
 */
require('dotenv').config();

const express      = require('express');
const cors         = require('cors');
const path         = require('path');
const helmet       = require('helmet');
const rateLimit    = require('express-rate-limit');
const errorHandler = require('./middleware/errorHandler');

// Validate required environment variables at boot time
const requiredEnvVars = ['JWT_SECRET', 'DB_HOST', 'DB_NAME', 'DB_USER'];
const missingEnvVars = requiredEnvVars.filter((varName) => !process.env[varName]);
if (missingEnvVars.length > 0) {
  console.error(`❌ Missing required environment variables: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

// Route imports
const authRoutes        = require('./routes/auth');
const employeeRoutes    = require('./routes/employees');
const attendanceRoutes  = require('./routes/attendance');
const dashboardRoutes   = require('./routes/dashboard');
const reportRoutes      = require('./routes/reports');
const exceptionRoutes   = require('./routes/exceptions');

// Initialise DB connection (side-effect: verifies connection)
require('./config/db');

const app  = express();
const PORT = process.env.PORT || 5000;

/* ── Security Middlewares ─────────────────────────────────── */
app.use(helmet());

// Rate limiters
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: { success: false, message: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // Limit each IP to 15 login/forgot-password attempts per window
  message: { success: false, message: 'Too many login attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(generalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);

/* ── CORS & Body Parsing ──────────────────────────────────── */
const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS
  ? process.env.CORS_ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173', 'https://attendence-erp.vercel.app'];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ── Routes ───────────────────────────────────────────────── */
app.use('/api/auth',       authRoutes);
app.use('/api/employees',  exceptionRoutes);   // MUST be before employeeRoutes — static /exceptions/active beats /:id
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
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
