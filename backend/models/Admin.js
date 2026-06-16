/**
 * models/Admin.js
 * Database queries for admins table.
 */
const db = require('../config/db');

class Admin {
  /**
   * Find an admin by email.
   * @param {string} email
   * @returns {Promise<Object|null>}
   */
  static async findByEmail(email) {
    const [rows] = await db.query(
      'SELECT * FROM admins WHERE email = ? LIMIT 1',
      [email]
    );
    return rows[0] || null;
  }

  /**
   * Find an admin by ID.
   * @param {number} id
   * @returns {Promise<Object|null>}
   */
  static async findById(id) {
    const [rows] = await db.query(
      'SELECT id, name, email, created_at, updated_at FROM admins WHERE id = ? LIMIT 1',
      [id]
    );
    return rows[0] || null;
  }

  /**
   * Update an admin by ID.
   */
  static async update(id, { name, email, password }) {
    if (password) {
      await db.query(
        'UPDATE admins SET name = ?, email = ?, password = ? WHERE id = ?',
        [name, email, password, id]
      );
    } else {
      await db.query(
        'UPDATE admins SET name = ?, email = ? WHERE id = ?',
        [name, email, id]
      );
    }
    return Admin.findById(id);
  }

  /**
   * Save reset token and expiration date for an admin.
   */
  static async updateResetToken(email, token, expiresAt) {
    await db.query(
      'UPDATE admins SET reset_token = ?, reset_token_expires = ? WHERE email = ?',
      [token, expiresAt, email]
    );
  }

  /**
   * Find an admin by active reset token.
   */
  static async findByResetToken(token) {
    const [rows] = await db.query(
      'SELECT * FROM admins WHERE reset_token = ? LIMIT 1',
      [token]
    );
    return rows[0] || null;
  }

  /**
   * Reset password and clear token columns.
   */
  static async resetPassword(id, hashedPassword) {
    await db.query(
      'UPDATE admins SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?',
      [hashedPassword, id]
    );
    return Admin.findById(id);
  }
}

module.exports = Admin;
