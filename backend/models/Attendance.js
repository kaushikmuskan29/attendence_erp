/**
 * models/Attendance.js
 * Database queries for attendance table.
 */
const db = require('../config/db');

class Attendance {
  /**
   * Upsert a single attendance record (INSERT or UPDATE).
   */
  static async upsert({ employee_id, attendance_date, punch_in, punch_out, worked_minutes }) {
    const [result] = await db.query(
      `INSERT INTO attendance (employee_id, attendance_date, punch_in, punch_out, worked_minutes)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         punch_in       = VALUES(punch_in),
         punch_out      = VALUES(punch_out),
         worked_minutes = VALUES(worked_minutes)`,
      [employee_id, attendance_date, punch_in, punch_out, worked_minutes]
    );
    return result;
  }

  /**
   * Get attendance records for a specific employee and month.
   * @param {number} employeeId
   * @param {string} month  - format 'YYYY-MM'
   */
  static async findByEmployeeAndMonth(employeeId, month) {
    const [rows] = await db.query(
      `SELECT * FROM attendance
       WHERE employee_id = ?
         AND DATE_FORMAT(attendance_date, '%Y-%m') = ?
       ORDER BY attendance_date`,
      [employeeId, month]
    );
    return rows;
  }

  /**
   * Get all attendance records for a given month.
   * @param {string} month  - format 'YYYY-MM'
   */
  static async findByMonth(month) {
    const [rows] = await db.query(
      `SELECT a.*, e.employee_code, e.name AS employee_name,
              e.office_start_time, e.grace_period_minutes
       FROM attendance a
       JOIN employees e ON e.id = a.employee_id
       WHERE DATE_FORMAT(a.attendance_date, '%Y-%m') = ?
       ORDER BY a.attendance_date, e.employee_code`,
      [month]
    );
    return rows;
  }

  /**
   * Count late records within the same month for an employee
   * BEFORE the given date (exclusive). Used to determine if Late Free applies.
   * @param {number} employeeId
   * @param {string} month      - 'YYYY-MM'
   * @param {string} beforeDate - 'YYYY-MM-DD' (exclude current date)
   */
  static async countLateInMonth(employeeId, month, beforeDate) {
    const [rows] = await db.query(
      `SELECT COUNT(*) AS cnt
       FROM attendance
       WHERE employee_id = ?
         AND DATE_FORMAT(attendance_date, '%Y-%m') = ?
         AND attendance_date < ?
         AND punch_in IS NOT NULL`,
      [employeeId, month, beforeDate]
    );
    // We can't store status – we'll compute late count differently in the service
    return rows[0].cnt;
  }

  /**
   * Get punch-in times for all attendance records in a month
   * for a given employee (used by attendanceService to count late days).
   */
  static async findPunchInsForMonth(employeeId, month) {
    const [rows] = await db.query(
      `SELECT attendance_date, punch_in
       FROM attendance
       WHERE employee_id = ?
         AND DATE_FORMAT(attendance_date, '%Y-%m') = ?
         AND punch_in IS NOT NULL
       ORDER BY attendance_date`,
      [employeeId, month]
    );
    return rows;
  }
}

module.exports = Attendance;
