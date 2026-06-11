/**
 * services/attendanceService.js
 *
 * Core business logic for attendance status calculation.
 *
 * Rules:
 *  Grace Deadline = office_start_time + grace_period_minutes
 *  - punch_in <= grace_deadline   → Present      (day = 1.0)
 *  - punch_in > grace_deadline:
 *      if late_count_before_today < employee.free_lates_allowed → Late Free (day = 1.0)
 *      else                                                     → Half Day  (day = 0.5)
 *  - No attendance record          → Absent       (day = 0)
 *
 * Status is NEVER stored in the DB – always computed here.
 */

const { timeToMinutes, addMinutes, getDaysInMonth } = require('../utils/timeUtils');

/**
 * Calculate status for a single attendance record.
 *
 * @param {string|null} punchIn              - 'HH:MM:SS' or null
 * @param {string}      officeStartTime      - 'HH:MM:SS'
 * @param {number}      gracePeriodMinutes
 * @param {number}      lateCountBeforeToday - running count of late days before this date in the month
 * @param {number}      freeLatesAllowed     - per-employee free late allowance (default 2)
 * @returns {{ status: string, dayCount: number }}
 */
function calculateStatus(punchIn, officeStartTime, gracePeriodMinutes, lateCountBeforeToday, freeLatesAllowed = 2) {
  if (!punchIn) {
    return { status: 'Absent', dayCount: 0 };
  }

  const startMins    = timeToMinutes(officeStartTime);
  const deadlineMins = addMinutes(startMins, gracePeriodMinutes);
  const punchInMins  = timeToMinutes(punchIn);

  if (punchInMins <= deadlineMins) {
    return { status: 'Present', dayCount: 1 };
  }

  // Employee is late – check how many late days occurred before this date
  if (lateCountBeforeToday < freeLatesAllowed) {
    return { status: 'Late Free', dayCount: 1 };
  }

  return { status: 'Half Day', dayCount: 0.5 };
}

/**
 * Build the full day-wise attendance report for one employee in a month.
 *
 * @param {Object}   employee        - employee row from DB
 * @param {Object[]} attendanceRows  - attendance rows for this employee in the month
 * @param {string}   month           - 'YYYY-MM'
 * @returns {{ days: Object[], summary: Object }}
 */
function buildEmployeeReport(employee, attendanceRows, month) {
  const [year, mon] = month.split('-').map(Number);
  const totalDays   = getDaysInMonth(year, mon);

  // Index attendance by date string
  const attendanceMap = {};
  for (const row of attendanceRows) {
    attendanceMap[row.attendance_date] = row;
  }

  let lateCount = 0;   // running count of confirmed-late days (for ordering within month)
  const days    = [];

  for (let d = 1; d <= totalDays; d++) {
    const dayStr = `${month}-${String(d).padStart(2, '0')}`;
    const rec    = attendanceMap[dayStr] || null;

    const { status, dayCount } = calculateStatus(
      rec ? rec.punch_in : null,
      employee.office_start_time,
      employee.grace_period_minutes,
      lateCount,
      employee.free_lates_allowed != null ? employee.free_lates_allowed : 2
    );

    // A "late" day is one where status is Late Free or Half Day
    if (rec && rec.punch_in) {
      const startMins    = timeToMinutes(employee.office_start_time);
      const deadlineMins = addMinutes(startMins, employee.grace_period_minutes);
      if (timeToMinutes(rec.punch_in) > deadlineMins) {
        lateCount++;
      }
    }

    days.push({
      date:          dayStr,
      punch_in:      rec ? rec.punch_in   : null,
      punch_out:     rec ? rec.punch_out  : null,
      worked_minutes: rec ? rec.worked_minutes : null,
      status,
      day_count:     dayCount,
    });
  }

  // Build summary
  const summary = {
    total_days:      totalDays,
    present:         days.filter(d => d.status === 'Present').length,
    late_free:       days.filter(d => d.status === 'Late Free').length,
    half_day:        days.filter(d => d.status === 'Half Day').length,
    absent:          days.filter(d => d.status === 'Absent').length,
    total_day_count: days.reduce((s, d) => s + d.day_count, 0),
  };

  return { days, summary };
}

/**
 * Build dashboard statistics for a month across all employees.
 *
 * @param {Object[]} employees      - all employee rows
 * @param {Object[]} allAttendance  - all attendance rows for the month (from Attendance.findByMonth)
 * @param {string}   month          - 'YYYY-MM'
 * @returns {Object}
 */
function buildDashboardStats(employees, allAttendance, month) {
  const [year, mon] = month.split('-').map(Number);
  const totalDays   = getDaysInMonth(year, mon);

  // Group attendance by employee_id
  const byEmployee = {};
  for (const row of allAttendance) {
    if (!byEmployee[row.employee_id]) byEmployee[row.employee_id] = [];
    byEmployee[row.employee_id].push(row);
  }

  let presentCount  = 0;
  let lateFreeCount = 0;
  let halfDayCount  = 0;
  let absentCount   = 0;
  let totalDayCount = 0;

  for (const emp of employees) {
    const rows   = byEmployee[emp.id] || [];
    const report = buildEmployeeReport(emp, rows, month);

    presentCount  += report.summary.present;
    lateFreeCount += report.summary.late_free;
    halfDayCount  += report.summary.half_day;
    absentCount   += report.summary.absent;
    totalDayCount += report.summary.total_day_count;
  }

  const maxPossibleDays    = employees.length * totalDays;
  const attendancePercent  = maxPossibleDays > 0
    ? parseFloat(((totalDayCount / maxPossibleDays) * 100).toFixed(2))
    : 0;

  return {
    total_employees:      employees.length,
    total_days:           totalDays,
    present_count:        presentCount,
    late_free_count:      lateFreeCount,
    half_day_count:       halfDayCount,
    absent_count:         absentCount,
    total_day_count:      parseFloat(totalDayCount.toFixed(1)),
    attendance_percentage: attendancePercent,
  };
}

module.exports = {
  calculateStatus,
  buildEmployeeReport,
  buildDashboardStats,
};
