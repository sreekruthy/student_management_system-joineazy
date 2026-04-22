const router = require('express').Router();
const auth = require('../controllers/authController');

router.post('/register', auth.register);
router.post('/login', auth.login);
router.post('/logout', (req, res) => {
  res.json({ msg: 'Logged out' });
});
module.exports = router;