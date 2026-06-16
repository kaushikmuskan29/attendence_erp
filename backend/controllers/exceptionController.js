/**
 * controllers/exceptionController.js
 * CRUD for employee schedule exceptions + active-exception bulk lookup.
 */
const Employee          = require('../models/Employee');
const EmployeeException = require('../models/EmployeeException');

/* ── Helpers ──────────────────────────────────────────────── */

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}(:\d{2})?$/;

/* ── Controllers ──────────────────────────────────────────── */

/**
 * GET /api/employees/exceptions/active?date=YYYY-MM-DD
 * Returns all employee IDs and their exception records active on the given date.
 * If no date query param, defaults to today.
 */
const getActiveExceptions = async (req, res, next) => {
  try {
    const date = req.query.date || new Date().toISOString().slice(0, 10);
    if (!DATE_RE.test(date)) {
      return res.status(400).json({ success: false, message: 'date must be YYYY-MM-DD.' });
    }
    const rows        = await EmployeeException.findActiveByDate(date);
    const employeeIds = [...new Set(rows.map(r => r.employee_id))];
    res.json({ success: true, data: { date, employee_ids: employeeIds, exceptions: rows } });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/employees/:id/exceptions
 */
const getExceptions = async (req, res, next) => {
  try {
    const emp = await Employee.findById(req.params.id);
    if (!emp) return res.status(404).json({ success: false, message: 'Employee not found.' });

    const exceptions = await EmployeeException.findByEmployee(req.params.id);
    res.json({ success: true, data: exceptions });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/employees/:id/exceptions
 * Body: { from_date, to_date, override_start_time, note? }
 */
const createException = async (req, res, next) => {
  try {
    const { id } = req.params;
    const emp = await Employee.findById(id);
    if (!emp) return res.status(404).json({ success: false, message: 'Employee not found.' });

    const { from_date, to_date, override_start_time, override_end_time, note } = req.body;

    // Required field checks
    if (!from_date)           return res.status(400).json({ success: false, message: 'from_date is required.' });
    if (!to_date)             return res.status(400).json({ success: false, message: 'to_date is required.' });
    if (!override_start_time) return res.status(400).json({ success: false, message: 'override_start_time is required.' });

    // Format checks
    if (!DATE_RE.test(from_date)) return res.status(400).json({ success: false, message: 'from_date must be YYYY-MM-DD.' });
    if (!DATE_RE.test(to_date))   return res.status(400).json({ success: false, message: 'to_date must be YYYY-MM-DD.' });
    if (!TIME_RE.test(override_start_time)) {
      return res.status(400).json({ success: false, message: 'override_start_time must be HH:MM or HH:MM:SS.' });
    }
    if (override_end_time && !TIME_RE.test(override_end_time)) {
      return res.status(400).json({ success: false, message: 'override_end_time must be HH:MM or HH:MM:SS.' });
    }

    // from_date must not exceed to_date
    if (from_date > to_date) {
      return res.status(400).json({ success: false, message: 'from_date cannot be after to_date.' });
    }

    // override_end_time must be after override_start_time if provided
    if (override_end_time) {
      const toMins = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
      if (toMins(override_end_time) <= toMins(override_start_time)) {
        return res.status(400).json({ success: false, message: 'override_end_time must be after override_start_time.' });
      }
    }

    // Overlap check
    const overlapping = await EmployeeException.findOverlapping(id, from_date, to_date);
    if (overlapping.length > 0) {
      const o = overlapping[0];
      return res.status(409).json({
        success: false,
        message: `This overlaps with an existing exception from ${o.from_date} to ${o.to_date}.`,
      });
    }

    // Normalise HH:MM → HH:MM:SS
    const norm = (t) => t && t.length === 5 ? `${t}:00` : t;

    const exc = await EmployeeException.create({
      employee_id:         id,
      from_date,
      to_date,
      override_start_time: norm(override_start_time),
      override_end_time:   norm(override_end_time) || null,
      note:                note?.trim() || null,
    });


    res.status(201).json({ success: true, message: 'Exception created.', data: exc });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/employees/:id/exceptions/:exceptionId
 */
const deleteException = async (req, res, next) => {
  try {
    const { exceptionId } = req.params;
    const deleted = await EmployeeException.delete(exceptionId);
    if (!deleted) return res.status(404).json({ success: false, message: 'Exception not found.' });
    res.json({ success: true, message: 'Exception deleted.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getActiveExceptions, getExceptions, createException, deleteException };
