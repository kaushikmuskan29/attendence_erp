const router = require('express').Router();
const { login, logout, me, updateProfile, forgotPassword, resetPassword } = require('../controllers/authController');
const auth = require('../middleware/auth');

router.post('/login',           login);
router.post('/logout',          auth, logout);
router.get('/me',               auth, me);
router.put('/update',           auth, updateProfile);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password',  resetPassword);

module.exports = router;
