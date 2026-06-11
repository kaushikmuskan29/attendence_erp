const router = require('express').Router();
const { login, logout, me, updateProfile } = require('../controllers/authController');
const auth = require('../middleware/auth');

router.post('/login',  login);
router.post('/logout', auth, logout);
router.get('/me',      auth, me);
router.put('/update',  auth, updateProfile);

module.exports = router;
