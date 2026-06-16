/**
 * services/reportService.js
 * Generates day-wise and monthly attendance reports using attendanceService logic.
 */
const Employee          = require('../models/Employee');
const Attendance        = require('../models/Attendance');
const EmployeeException = require('../models/EmployeeException');
const { buildEmployeeReport } = require('./attendanceService');

/**
 * Generate full month report for all employees.
 * @param {string} month  - 'YYYY-MM'
 * @returns {Promise<Object[]>}
 */
async function getMonthlyReport(month) {
  const employees          = await Employee.findAllSimple();
  const allAttendance      = await Attendance.findByMonth(month);
  const exceptionsByEmp    = await EmployeeException.findAllGroupedByEmployee();

  // Group attendance by employee_id
  const byEmployee = {};
  for (const row of allAttendance) {
    if (!byEmployee[row.employee_id]) byEmployee[row.employee_id] = [];
    byEmployee[row.employee_id].push(row);
  }

  return employees.map(emp => {
    const rows   = byEmployee[emp.id] || [];
    const report = buildEmployeeReport(emp, rows, month, exceptionsByEmp[emp.id] || []);

    return {
      employee: {
        id:            emp.id,
        employee_code: emp.employee_code,
        name:          emp.name,
      },
      ...report,
    };
  });
}

/**
 * Generate day-wise report for a single employee.
 * @param {number} employeeId
 * @param {string} month  - 'YYYY-MM'
 * @returns {Promise<Object>}
 */
async function getEmployeeReport(employeeId, month) {
  const emp = await Employee.findById(employeeId);
  if (!emp) throw Object.assign(new Error('Employee not found'), { status: 404 });

  const rows       = await Attendance.findByEmployeeAndMonth(employeeId, month);
  const exceptions = await EmployeeException.findByEmployee(employeeId);
  const report     = buildEmployeeReport(emp, rows, month, exceptions);

  return {
    employee: {
      id:                   emp.id,
      employee_code:        emp.employee_code,
      name:                 emp.name,
      office_start_time:    emp.office_start_time,
      grace_period_minutes: emp.grace_period_minutes,
    },
    ...report,
  };
}

/**
 * Convert a report to CSV string for download.
 * @param {Object} report - result from getEmployeeReport
 * @returns {string}
 */
function reportToCSV(report) {
  const header = 'Date,Punch In,Punch Out,Worked Minutes,Status,Day Count\n';
  const body   = report.days.map(d => [
    d.date,
    d.punch_in      || '',
    d.punch_out     || '',
    d.worked_minutes != null ? d.worked_minutes : '',
    d.status,
    d.day_count,
  ].join(',')).join('\n');

  return header + body;
}

module.exports = { getMonthlyReport, getEmployeeReport, reportToCSV };
