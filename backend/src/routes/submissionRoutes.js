const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const ctrl = require('../controllers/submissionController');

router.post('/confirm', auth, ctrl.confirmSubmission);
router.get('/', auth, ctrl.getSubmissions);
router.get('/progress', auth, ctrl.getGroupProgress);

module.exports = router;