/**
 * utils/timeUtils.js
 * Utility functions for time manipulation.
 */

/**
 * Convert 'HH:MM:SS' to total minutes since midnight.
 * @param {string} timeStr
 * @returns {number}
 */
function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const parts = timeStr.split(':').map(Number);
  return parts[0] * 60 + parts[1] + (parts[2] || 0) / 60;
}

/**
 * Add minutes to a minute-since-midnight value.
 * @param {number} baseMins
 * @param {number} addMins
 * @returns {number}
 */
function addMinutes(baseMins, addMins) {
  return baseMins + addMins;
}

/**
 * Get total days in a month.
 * @param {number} year
 * @param {number} month  - 1-indexed
 * @returns {number}
 */
function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

/**
 * Validate 'YYYY-MM-DD' date format.
 * @param {string} dateStr
 * @returns {boolean}
 */
function isValidDate(dateStr) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const d = new Date(dateStr);
  return !isNaN(d.getTime());
}

/**
 * Validate 'HH:MM:SS' time format.
 * @param {string} timeStr
 * @returns {boolean}
 */
function isValidTime(timeStr) {
  if (!timeStr) return false;
  return /^\d{2}:\d{2}(:\d{2})?$/.test(timeStr);
}

/**
 * Calculate worked minutes between two time strings.
 * @param {string} punchIn   'HH:MM:SS'
 * @param {string} punchOut  'HH:MM:SS'
 * @returns {number}
 */
function workedMinutes(punchIn, punchOut) {
  return Math.max(0, Math.round(timeToMinutes(punchOut) - timeToMinutes(punchIn)));
}

module.exports = {
  timeToMinutes,
  addMinutes,
  getDaysInMonth,
  isValidDate,
  isValidTime,
  workedMinutes,
};
