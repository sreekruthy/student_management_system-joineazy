const router = require('express').Router();
const {verifyToken: auth} = require('../middleware/authMiddleware');
console.log('auth type:', typeof auth);
const group = require('../controllers/groupController');
console.log('EXPORTS:', JSON.stringify(Object.keys(group)));
const adminOnly = (req, res, next) => {
    if (req.user?.role !== 'ADMIN') {
        return res.status(403).json({ msg: "Admin access required" });
    }
    next();
};

router.post('/', auth, group.createGroup);
console.log('group exports:', Object.keys(group)); // add this
router.post('/add', auth, group.addMember);
router.get('/my', auth, group.getMyGroup);
router.get('/', auth, adminOnly, group.getAllGroups); 

module.exports = router;