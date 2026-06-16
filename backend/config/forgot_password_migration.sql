-- ============================================================
-- Migration: Add reset password columns to admins table
-- ============================================================

USE erp_attendance;

ALTER TABLE admins
  ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255) DEFAULT NULL AFTER password,
  ADD COLUMN IF NOT EXISTS reset_token_expires DATETIME DEFAULT NULL AFTER reset_token;

SELECT 'reset_token and reset_token_expires columns checked/added.' AS status;
