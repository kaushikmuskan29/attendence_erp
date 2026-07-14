/**
 * controllers/attendanceController.js
 * Handles CSV attendance upload.
 */
const { processCSV } = require('../services/csvService');
const fs = require('fs');

/**
 * POST /api/attendance/upload
 * Accepts a multipart/form-data CSV file with field name "file".
 */
const uploadCSV = async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No CSV file uploaded. Use field name "file".' });
  }

  try {
    const result = await processCSV(req.file.path);

    const hasErrors = result.errors.length > 0;
    const status    = hasErrors && result.inserted === 0 && result.updated === 0 ? 400 : 200;

    res.status(status).json({
      success:  status === 200,
      message:  `Processed ${result.total} row(s). Inserted: ${result.inserted}, Updated: ${result.updated}, Errors: ${result.errors.length}.`,
      data: {
        total:    result.total,
        inserted: result.inserted,
        updated:  result.updated,
        errors:   result.errors,
      },
    });
  } catch (err) {
    // Cleanup file if still on disk
    if (req.file && req.file.path) {
      try { fs.unlinkSync(req.file.path); } catch (_) {}
    }
    next(err);
  }
};

/**
 * POST /api/attendance/override
 * Allows admin to override employee attendance status for a given date.
 */
const overrideStatus = async (req, res, next) => {
  try {
    const { employee_id, attendance_date, status_override } = req.body;

    if (!employee_id || !attendance_date) {
      return res.status(400).json({ success: false, message: 'employee_id and attendance_date are required.' });
    }

    // Validate status_override value
    const validStatuses = ['Present', 'Late Free', 'Half Day', 'Absent', 'Leave', null, ''];
    if (status_override !== undefined && !validStatuses.includes(status_override)) {
      return res.status(400).json({ success: false, message: 'Invalid status override value.' });
    }

    const Attendance = require('../models/Attendance');
    const targetStatus = (status_override === '' || status_override === null) ? null : status_override;
    await Attendance.setOverride(employee_id, attendance_date, targetStatus);

    res.json({
      success: true,
      message: 'Attendance status override updated successfully.',
      data: {
        employee_id,
        attendance_date,
        status_override: targetStatus
      }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { uploadCSV, overrideStatus };
