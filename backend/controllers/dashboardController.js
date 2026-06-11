/**
 * controllers/dashboardController.js
 * Returns monthly dashboard statistics.
 */
const Employee   = require('../models/Employee');
const Attendance = require('../models/Attendance');
const { buildDashboardStats } = require('../services/attendanceService');

/**
 * GET /api/dashboard?month=YYYY-MM
 */
const getDashboard = async (req, res, next) => {
  try {
    let { month } = req.query;

    // Default to current month
    if (!month) {
      const now = new Date();
      month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }

    if (!/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ success: false, message: 'month must be in YYYY-MM format.' });
    }

    const employees     = await Employee.findAllSimple();
    const allAttendance = await Attendance.findByMonth(month);

    const stats = buildDashboardStats(employees, allAttendance, month);

    // Build per-employee summary for the overview table
    const { buildEmployeeReport } = require('../services/attendanceService');
    const byEmployee = {};
    for (const row of allAttendance) {
      if (!byEmployee[row.employee_id]) byEmployee[row.employee_id] = [];
      byEmployee[row.employee_id].push(row);
    }

    const employeeOverview = employees.map(emp => {
      const rows    = byEmployee[emp.id] || [];
      const report  = buildEmployeeReport(emp, rows, month);
      return {
        id:            emp.id,
        employee_code: emp.employee_code,
        name:          emp.name,
        ...report.summary,
      };
    });

    res.json({
      success: true,
      data: {
        month,
        stats,
        employees: employeeOverview,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getDashboard };
