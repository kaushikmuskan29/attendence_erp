/**
 * controllers/employeeController.js
 * Full CRUD for employees with search, pagination, and validation.
 * Includes: office_end_time, working_minutes (auto-calculated), free_lates_allowed.
 */
const Employee = require('../models/Employee');
const { timeToMinutes } = require('../utils/timeUtils');

/* ── Helpers ──────────────────────────────────────────────── */

/**
 * Auto-calculate working minutes from start/end times.
 * @param {string} start  'HH:MM' or 'HH:MM:SS'
 * @param {string} end    'HH:MM' or 'HH:MM:SS'
 * @returns {number}
 */
function calcWorkingMinutes(start, end) {
  const s = timeToMinutes(start);
  const e = timeToMinutes(end);
  return Math.max(0, Math.round(e - s));
}

function validateEmployeeBody(body) {
  const errors = [];
  const { employee_code, name, office_start_time, office_end_time, grace_period_minutes, free_lates_allowed } = body;

  if (!employee_code || !employee_code.trim())
    errors.push('employee_code is required.');
  if (!name || !name.trim())
    errors.push('name is required.');

  if (!office_start_time)
    errors.push('office_start_time is required (HH:MM or HH:MM:SS).');
  else if (!/^\d{2}:\d{2}(:\d{2})?$/.test(office_start_time))
    errors.push('office_start_time must be in HH:MM or HH:MM:SS format.');

  if (!office_end_time)
    errors.push('office_end_time is required (HH:MM or HH:MM:SS).');
  else if (!/^\d{2}:\d{2}(:\d{2})?$/.test(office_end_time))
    errors.push('office_end_time must be in HH:MM or HH:MM:SS format.');

  if (office_start_time && office_end_time) {
    if (timeToMinutes(office_end_time) <= timeToMinutes(office_start_time))
      errors.push('office_end_time must be after office_start_time.');
  }

  if (grace_period_minutes === undefined || grace_period_minutes === null || grace_period_minutes === '')
    errors.push('grace_period_minutes is required.');
  else if (isNaN(grace_period_minutes) || Number(grace_period_minutes) < 0)
    errors.push('grace_period_minutes must be a non-negative number.');

  if (free_lates_allowed === undefined || free_lates_allowed === null || free_lates_allowed === '')
    errors.push('free_lates_allowed is required.');
  else if (isNaN(free_lates_allowed) || Number(free_lates_allowed) < 0)
    errors.push('free_lates_allowed must be a non-negative number.');

  return errors;
}

/* ── Controllers ──────────────────────────────────────────── */

/**
 * GET /api/employees
 */
const getAll = async (req, res, next) => {
  try {
    const { search = '', page = 1, limit = 10 } = req.query;
    const result = await Employee.findAll({
      search,
      page:  Math.max(1, parseInt(page,  10)),
      limit: Math.min(100, Math.max(1, parseInt(limit, 10))),
    });

    res.json({
      success: true,
      data:    result.data,
      pagination: {
        total:       result.total,
        page:        result.page,
        limit:       result.limit,
        total_pages: Math.ceil(result.total / result.limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/employees/:id
 */
const getOne = async (req, res, next) => {
  try {
    const emp = await Employee.findById(req.params.id);
    if (!emp) return res.status(404).json({ success: false, message: 'Employee not found.' });
    res.json({ success: true, data: emp });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/employees
 */
const create = async (req, res, next) => {
  try {
    const errors = validateEmployeeBody(req.body);
    if (errors.length) return res.status(400).json({ success: false, message: errors.join(' ') });

    const { employee_code, name, office_start_time, office_end_time, grace_period_minutes, free_lates_allowed } = req.body;

    // Duplicate code check
    const existing = await Employee.findByCode(employee_code.trim());
    if (existing) {
      return res.status(409).json({ success: false, message: `Employee code "${employee_code}" already exists.` });
    }

    // Auto-calculate working_minutes
    const working_minutes = calcWorkingMinutes(office_start_time, office_end_time);

    const emp = await Employee.create({
      employee_code:       employee_code.trim(),
      name:                name.trim(),
      office_start_time,
      office_end_time,
      working_minutes,
      grace_period_minutes: parseInt(grace_period_minutes, 10),
      free_lates_allowed:   parseInt(free_lates_allowed,   10),
    });

    res.status(201).json({ success: true, message: 'Employee created.', data: emp });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/employees/:id
 */
const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await Employee.findById(id);
    if (!existing) return res.status(404).json({ success: false, message: 'Employee not found.' });

    const errors = validateEmployeeBody(req.body);
    if (errors.length) return res.status(400).json({ success: false, message: errors.join(' ') });

    const { employee_code, name, office_start_time, office_end_time, grace_period_minutes, free_lates_allowed } = req.body;

    // Duplicate code check (exclude self)
    const conflict = await Employee.findByCode(employee_code.trim());
    if (conflict && conflict.id !== Number(id)) {
      return res.status(409).json({ success: false, message: `Employee code "${employee_code}" already exists.` });
    }

    // Auto-calculate working_minutes
    const working_minutes = calcWorkingMinutes(office_start_time, office_end_time);

    const emp = await Employee.update(id, {
      employee_code:       employee_code.trim(),
      name:                name.trim(),
      office_start_time,
      office_end_time,
      working_minutes,
      grace_period_minutes: parseInt(grace_period_minutes, 10),
      free_lates_allowed:   parseInt(free_lates_allowed,   10),
    });

    res.json({ success: true, message: 'Employee updated.', data: emp });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/employees/:id
 */
const remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await Employee.findById(id);
    if (!existing) return res.status(404).json({ success: false, message: 'Employee not found.' });

    await Employee.delete(id);
    res.json({ success: true, message: 'Employee deleted.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, getOne, create, update, remove };
