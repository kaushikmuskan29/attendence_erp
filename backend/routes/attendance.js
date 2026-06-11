const router = require('express').Router();
const auth   = require('../middleware/auth');
const upload = require('../middleware/upload');
const { uploadCSV } = require('../controllers/attendanceController');

router.use(auth);

router.post('/upload', upload.single('file'), uploadCSV);

module.exports = router;
