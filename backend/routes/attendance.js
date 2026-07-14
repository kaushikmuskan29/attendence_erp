const router = require('express').Router();
const auth   = require('../middleware/auth');
const upload = require('../middleware/upload');
const { uploadCSV, overrideStatus } = require('../controllers/attendanceController');

router.use(auth);

router.post('/upload',  upload.single('file'), uploadCSV);
router.post('/override', overrideStatus);

module.exports = router;
