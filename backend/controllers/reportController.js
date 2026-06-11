/**
 * controllers/reportController.js
 * Returns day-wise attendance reports with CSV export support.
 */
const { getMonthlyReport, getEmployeeReport, reportToCSV } = require('../services/reportService');

/**
 * GET /api/reports?month=YYYY-MM
 * Returns all-employee monthly report.
 */
const getAllReports = async (req, res, next) => {
  try {
    let { month } = req.query;
    if (!month) {
      const now = new Date();
      month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ success: false, message: 'month must be in YYYY-MM format.' });
    }

    const report = await getMonthlyReport(month);
    res.json({ success: true, data: { month, report } });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/reports/:employeeId?month=YYYY-MM&export=csv
 * Returns day-wise report for a single employee.
 * If ?export=csv, streams a CSV file for download.
 */
const getEmployeeReportCtrl = async (req, res, next) => {
  try {
    let { month, export: exportCSV } = req.query;
    const { employeeId } = req.params;

    if (!month) {
      const now = new Date();
      month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ success: false, message: 'month must be in YYYY-MM format.' });
    }

    const report = await getEmployeeReport(Number(employeeId), month);

    if (exportCSV === 'csv') {
      const csv = reportToCSV(report);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="attendance_${report.employee.employee_code}_${month}.csv"`
      );
      return res.send(csv);
    }

    res.json({ success: true, data: { month, ...report } });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllReports, getEmployeeReportCtrl };
