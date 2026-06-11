-- ============================================================
-- Employee Attendance Tracking System - Database Schema
-- ============================================================

CREATE DATABASE IF NOT EXISTS erp_attendance
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE erp_attendance;

-- -------------------------------------------------------
-- Table: admins
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS admins (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(100)  NOT NULL,
  email        VARCHAR(150)  NOT NULL UNIQUE,
  password     VARCHAR(255)  NOT NULL,
  created_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------
-- Table: employees
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS employees (
  id                    INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  employee_code         VARCHAR(50)   NOT NULL UNIQUE,
  name                  VARCHAR(100)  NOT NULL,
  office_start_time     TIME          NOT NULL DEFAULT '09:00:00',
  office_end_time       TIME          NOT NULL DEFAULT '18:00:00',
  working_minutes       SMALLINT UNSIGNED NOT NULL DEFAULT 540,
  grace_period_minutes  SMALLINT UNSIGNED NOT NULL DEFAULT 15,
  free_lates_allowed    TINYINT UNSIGNED  NOT NULL DEFAULT 2,
  created_at            TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- -------------------------------------------------------
-- Table: attendance
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS attendance (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  employee_id      INT UNSIGNED  NOT NULL,
  attendance_date  DATE          NOT NULL,
  punch_in         TIME          NULL,
  punch_out        TIME          NULL,
  worked_minutes   SMALLINT UNSIGNED NULL,
  created_at       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_attendance_employee
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,

  CONSTRAINT uq_employee_date
    UNIQUE (employee_id, attendance_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------
-- Indexes for query performance
-- -------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_attendance_date     ON attendance (attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_emp_date ON attendance (employee_id, attendance_date);
