/**
 * routes/exceptions.js
 * Schedule-exception routes, mounted at /api/employees by server.js.
 */
const router = require('express').Router();
const auth   = require('../middleware/auth');
const {
  getActiveExceptions,
  getExceptions,
  createException,
  deleteException,
} = require('../controllers/exceptionController');

router.use(auth);

// IMPORTANT: static segment must come before /:id to avoid being captured as an id param
router.get('/exceptions/active', getActiveExceptions);

router.get('/:id/exceptions',                   getExceptions);
router.post('/:id/exceptions',                  createException);
router.delete('/:id/exceptions/:exceptionId',   deleteException);

module.exports = router;
