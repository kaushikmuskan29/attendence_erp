-- ============================================================
-- Migration: Add override_end_time to employee_exceptions
-- Run this if you already ran exceptions_migration.sql
-- ============================================================

USE erp_attendance;

ALTER TABLE employee_exceptions
  ADD COLUMN IF NOT EXISTS override_end_time TIME DEFAULT NULL
  AFTER override_start_time;

SELECT 'override_end_time column added.' AS status;
