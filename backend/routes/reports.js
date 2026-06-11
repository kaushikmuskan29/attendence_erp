const router = require('express').Router();
const auth   = require('../middleware/auth');
const { getAllReports, getEmployeeReportCtrl } = require('../controllers/reportController');

router.use(auth);
router.get('/',               getAllReports);
router.get('/:employeeId',    getEmployeeReportCtrl);

module.exports = router;
