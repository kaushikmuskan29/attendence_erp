-- ============================================================
-- Seed Data for Employee Attendance Tracking System
-- ============================================================
-- Run schema.sql first, then this file.

USE erp_attendance;

-- -------------------------------------------------------
-- Default Admin
-- Password: password123  (bcrypt hash below)
-- -------------------------------------------------------
INSERT INTO admins (name, email, password) VALUES
('System Admin', 'admin@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- -------------------------------------------------------
-- Sample Employees
-- -------------------------------------------------------
INSERT INTO employees (employee_code, name, office_start_time, office_end_time, working_minutes, grace_period_minutes, free_lates_allowed) VALUES
('EMP001', 'Alice Johnson',   '09:00:00', '18:00:00', 540, 15, 2),
('EMP002', 'Bob Williams',    '09:00:00', '18:00:00', 540, 10, 3),
('EMP003', 'Carol Davis',     '09:30:00', '18:30:00', 540, 15, 2),
('EMP004', 'David Martinez',  '08:30:00', '17:30:00', 540, 20, 5),
('EMP005', 'Eve Thompson',    '10:00:00', '19:00:00', 540, 10, 1)
ON DUPLICATE KEY UPDATE
  name                 = VALUES(name),
  office_start_time    = VALUES(office_start_time),
  office_end_time      = VALUES(office_end_time),
  working_minutes      = VALUES(working_minutes),
  grace_period_minutes = VALUES(grace_period_minutes),
  free_lates_allowed   = VALUES(free_lates_allowed);


-- -------------------------------------------------------
-- Sample Attendance (June 2026)
-- -------------------------------------------------------
INSERT INTO attendance (employee_id, attendance_date, punch_in, punch_out, worked_minutes) VALUES
-- Alice: Mostly on time
(1, '2026-06-01', '09:05:00', '18:00:00', 535),
(1, '2026-06-02', '09:10:00', '17:45:00', 515),
(1, '2026-06-03', '09:20:00', '18:05:00', 525),
(1, '2026-06-04', '10:00:00', '18:00:00', 480),
(1, '2026-06-05', '09:00:00', '17:30:00', 510),
-- Bob: Some late arrivals
(2, '2026-06-01', '09:40:00', '18:10:00', 510),
(2, '2026-06-02', '09:15:00', '17:50:00', 515),
(2, '2026-06-03', '10:30:00', '18:00:00', 450),
(2, '2026-06-04', '09:05:00', '17:55:00', 530),
-- Carol: Mixed
(3, '2026-06-01', '09:30:00', '18:00:00', 510),
(3, '2026-06-02', '09:45:00', '17:30:00', 465),
(3, '2026-06-03', '10:00:00', '18:15:00', 495),
-- David: Early bird
(4, '2026-06-01', '08:25:00', '17:00:00', 515),
(4, '2026-06-02', '08:30:00', '17:30:00', 540),
(4, '2026-06-03', '09:10:00', '18:00:00', 530),
(4, '2026-06-04', '08:45:00', '17:15:00', 510),
(4, '2026-06-05', '08:50:00', '17:20:00', 510),
-- Eve: Late starts
(5, '2026-06-01', '10:05:00', '18:30:00', 505),
(5, '2026-06-02', '10:15:00', '18:00:00', 465)
ON DUPLICATE KEY UPDATE
  punch_in       = VALUES(punch_in),
  punch_out      = VALUES(punch_out),
  worked_minutes = VALUES(worked_minutes);
