const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const ctrl = require('../controllers/assignmentController');

router.post('/', auth, ctrl.createAssignment);
router.get('/', auth, ctrl.getAssignments);

module.exports = router;