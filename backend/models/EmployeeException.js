/**
 * models/EmployeeException.js
 * Database queries for employee_exceptions table.
 */
const db = require('../config/db');

class EmployeeException {
  /**
   * All exceptions for one employee, ordered by from_date ascending.
   */
  static async findByEmployee(employeeId) {
    const [rows] = await db.query(
      `SELECT * FROM employee_exceptions
       WHERE employee_id = ?
       ORDER BY from_date ASC`,
      [employeeId]
    );
    return rows;
  }

  /**
   * All exceptions whose window covers a specific date (used for the active-badge endpoint).
   */
  static async findActiveByDate(date) {
    const [rows] = await db.query(
      `SELECT id, employee_id, from_date, to_date, override_start_time, override_end_time, note
       FROM employee_exceptions
       WHERE from_date <= ? AND to_date >= ?`,
      [date, date]
    );
    return rows;
  }

  /**
   * Find exceptions for an employee that overlap with [fromDate, toDate].
   * Optionally exclude a specific exception id (for future edit flows).
   */
  static async findOverlapping(employeeId, fromDate, toDate, excludeId = null) {
    let sql = `SELECT * FROM employee_exceptions
               WHERE employee_id = ?
                 AND from_date <= ?
                 AND to_date   >= ?`;
    const params = [employeeId, toDate, fromDate];
    if (excludeId) {
      sql += ` AND id != ?`;
      params.push(excludeId);
    }
    const [rows] = await db.query(sql, params);
    return rows;
  }

  /**
   * All exceptions grouped by employee_id — used by report/dashboard services
   * to do a single bulk fetch instead of N per-employee queries.
   */
  static async findAllGroupedByEmployee() {
    const [rows] = await db.query(
      `SELECT * FROM employee_exceptions ORDER BY employee_id, from_date ASC`
    );
    const grouped = {};
    for (const row of rows) {
      if (!grouped[row.employee_id]) grouped[row.employee_id] = [];
      grouped[row.employee_id].push(row);
    }
    return grouped;
  }

  /** Insert a new exception row and return the full inserted record. */
  static async create({ employee_id, from_date, to_date, override_start_time, override_end_time, note }) {
    const [result] = await db.query(
      `INSERT INTO employee_exceptions
         (employee_id, from_date, to_date, override_start_time, override_end_time, note)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [employee_id, from_date, to_date, override_start_time, override_end_time || null, note || null]
    );
    const [rows] = await db.query(
      `SELECT * FROM employee_exceptions WHERE id = ?`,
      [result.insertId]
    );
    return rows[0];
  }

  /** Delete an exception by primary key. Returns true if a row was removed. */
  static async delete(id) {
    const [result] = await db.query(
      `DELETE FROM employee_exceptions WHERE id = ?`,
      [id]
    );
    return result.affectedRows > 0;
  }
}

module.exports = EmployeeException;
