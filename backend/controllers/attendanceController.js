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

module.exports = { uploadCSV };
