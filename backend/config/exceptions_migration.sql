-- ============================================================
-- Migration: Create employee_exceptions table
-- Run this manually BEFORE restarting the backend server.
-- ============================================================

USE erp_attendance;

CREATE TABLE IF NOT EXISTS employee_exceptions (
  id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  employee_id         INT UNSIGNED NOT NULL,
  from_date           DATE NOT NULL,
  to_date             DATE NOT NULL,
  override_start_time TIME NOT NULL,
  note                VARCHAR(255) DEFAULT NULL,
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_exc_employee
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,

  INDEX idx_exc_employee (employee_id),
  INDEX idx_exc_dates    (from_date, to_date)
);

-- Verify
SELECT 'employee_exceptions table created.' AS status;
