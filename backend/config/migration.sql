-- ============================================================
-- Migration: Add new fields to employees table
-- Run this on existing databases AFTER the original schema.sql
-- ============================================================

USE erp_attendance;

-- Add office_end_time (default 18:00)
ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS office_end_time TIME NOT NULL DEFAULT '18:00:00'
  AFTER office_start_time;

-- Add working_minutes (auto-computed = end - start in minutes)
ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS working_minutes SMALLINT UNSIGNED NOT NULL DEFAULT 540
  AFTER office_end_time;

-- Add free_lates_allowed per employee (replaces global hard-coded 2)
ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS free_lates_allowed TINYINT UNSIGNED NOT NULL DEFAULT 2
  AFTER grace_period_minutes;

-- Back-fill working_minutes from existing start/end times
UPDATE employees
SET working_minutes = TIMESTAMPDIFF(MINUTE,
  CAST(CONCAT('2000-01-01 ', office_start_time) AS DATETIME),
  CAST(CONCAT('2000-01-01 ', office_end_time)   AS DATETIME)
)
WHERE working_minutes = 540;  -- only update rows still at default

-- Verify
SELECT id, employee_code, name, office_start_time, office_end_time,
       working_minutes, grace_period_minutes, free_lates_allowed
FROM employees
LIMIT 10;
