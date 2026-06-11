/**
 * models/Employee.js
 * Database queries for employees table.
 */
const db = require('../config/db');

class Employee {
  /**
   * Get all employees with optional search and pagination.
   */
  static async findAll({ search = '', page = 1, limit = 10 } = {}) {
    const offset = (page - 1) * limit;
    const like   = `%${search}%`;

    const [rows] = await db.query(
      `SELECT * FROM employees
       WHERE name LIKE ? OR employee_code LIKE ?
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [like, like, Number(limit), Number(offset)]
    );

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM employees
       WHERE name LIKE ? OR employee_code LIKE ?`,
      [like, like]
    );

    return { data: rows, total, page: Number(page), limit: Number(limit) };
  }

  /** Find one employee by ID. */
  static async findById(id) {
    const [rows] = await db.query('SELECT * FROM employees WHERE id = ? LIMIT 1', [id]);
    return rows[0] || null;
  }

  /** Find one employee by employee_code. */
  static async findByCode(code) {
    const [rows] = await db.query(
      'SELECT * FROM employees WHERE employee_code = ? LIMIT 1',
      [code]
    );
    return rows[0] || null;
  }

  /** Create a new employee. */
  static async create({
    employee_code,
    name,
    office_start_time,
    office_end_time,
    working_minutes,
    grace_period_minutes,
    free_lates_allowed,
  }) {
    const [result] = await db.query(
      `INSERT INTO employees
         (employee_code, name, office_start_time, office_end_time, working_minutes, grace_period_minutes, free_lates_allowed)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [employee_code, name, office_start_time, office_end_time, working_minutes, grace_period_minutes, free_lates_allowed]
    );
    return Employee.findById(result.insertId);
  }

  /** Update an employee by ID. */
  static async update(id, {
    employee_code,
    name,
    office_start_time,
    office_end_time,
    working_minutes,
    grace_period_minutes,
    free_lates_allowed,
  }) {
    await db.query(
      `UPDATE employees
       SET employee_code        = ?,
           name                 = ?,
           office_start_time    = ?,
           office_end_time      = ?,
           working_minutes      = ?,
           grace_period_minutes = ?,
           free_lates_allowed   = ?
       WHERE id = ?`,
      [employee_code, name, office_start_time, office_end_time, working_minutes, grace_period_minutes, free_lates_allowed, id]
    );
    return Employee.findById(id);
  }

  /** Delete an employee by ID. */
  static async delete(id) {
    const [result] = await db.query('DELETE FROM employees WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  /** Get all employees (no pagination) – used internally by services. */
  static async findAllSimple() {
    const [rows] = await db.query('SELECT * FROM employees ORDER BY employee_code');
    return rows;
  }
}

module.exports = Employee;
