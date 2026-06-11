/**
 * services/csvService.js
 * Handles CSV file parsing, validation, and bulk upsert into attendance table.
 */
const fs      = require('fs');
const csvParser = require('csv-parser');
const Employee  = require('../models/Employee');
const Attendance = require('../models/Attendance');
const { isValidDate, isValidTime, workedMinutes, timeToMinutes } = require('../utils/timeUtils');

/**
 * Process an uploaded CSV file.
 *
 * @param {string} filePath - absolute path to the uploaded CSV
 * @returns {Promise<{
 *   inserted: number,
 *   updated: number,
 *   errors: Array<{row: number, error: string}>
 * }>}
 */
async function processCSV(filePath) {
  // 1. Parse CSV into rows
  const rows = await parseCSV(filePath);

  // 2. Load all employees into a code→employee map
  const employees   = await Employee.findAllSimple();
  const employeeMap = {};
  for (const emp of employees) {
    employeeMap[emp.employee_code] = emp;
  }

  // 3. Track duplicates within the file itself
  const seenKeys = new Set();

  let inserted = 0;
  let updated  = 0;
  const errors = [];

  for (let i = 0; i < rows.length; i++) {
    const rowNum = i + 2; // 1-indexed + header row
    const raw    = rows[i];

    // Normalise column names (trim & lowercase)
    const row = {};
    for (const key of Object.keys(raw)) {
      row[key.trim().toLowerCase()] = typeof raw[key] === 'string' ? raw[key].trim() : raw[key];
    }

    const { employee_code, date, punch_in, punch_out } = row;

    // ---- Validation ----
    if (!employee_code) {
      errors.push({ row: rowNum, error: 'employee_code is required' });
      continue;
    }

    const employee = employeeMap[employee_code];
    if (!employee) {
      errors.push({ row: rowNum, error: `Employee with code "${employee_code}" not found` });
      continue;
    }

    if (!isValidDate(date)) {
      errors.push({ row: rowNum, error: `Invalid date format "${date}". Expected YYYY-MM-DD` });
      continue;
    }

    if (!isValidTime(punch_in)) {
      errors.push({ row: rowNum, error: `Invalid punch_in time "${punch_in}". Expected HH:MM:SS` });
      continue;
    }

    if (!isValidTime(punch_out)) {
      errors.push({ row: rowNum, error: `Invalid punch_out time "${punch_out}". Expected HH:MM:SS` });
      continue;
    }

    if (timeToMinutes(punch_out) <= timeToMinutes(punch_in)) {
      errors.push({ row: rowNum, error: `punch_out must be after punch_in for date "${date}"` });
      continue;
    }

    // Duplicate within file
    const key = `${employee_code}_${date}`;
    if (seenKeys.has(key)) {
      errors.push({ row: rowNum, error: `Duplicate row for employee "${employee_code}" on date "${date}"` });
      continue;
    }
    seenKeys.add(key);

    // ---- Upsert ----
    const worked = workedMinutes(punch_in, punch_out);
    const result = await Attendance.upsert({
      employee_id:     employee.id,
      attendance_date: date,
      punch_in,
      punch_out,
      worked_minutes:  worked,
    });

    // affectedRows=1 → insert, affectedRows=2 → update (ON DUPLICATE KEY UPDATE)
    if (result.affectedRows === 1) inserted++;
    else updated++;
  }

  // Clean up uploaded file
  try { fs.unlinkSync(filePath); } catch (_) {}

  return { inserted, updated, errors, total: rows.length };
}

/**
 * Parse a CSV file into an array of row objects.
 * @param {string} filePath
 * @returns {Promise<Object[]>}
 */
function parseCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('data', row => results.push(row))
      .on('end',  ()  => resolve(results))
      .on('error', err => reject(err));
  });
}

module.exports = { processCSV };
