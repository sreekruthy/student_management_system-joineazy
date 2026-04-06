const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const group = require('../controllers/groupController');

router.post('/', auth, group.createGroup);
router.post('/add', auth, group.addMember);
router.get('/my', auth, group.getMyGroup);
router.get('/', auth, group.getAllGroups); 

module.exports = router;