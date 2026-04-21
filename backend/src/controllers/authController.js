const pool = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const ALLOWED_ROLES =['STUDENT','ADMIN'];

// Helpers
function validate(fields) {

  const missing = Object.entries(fields)

    .filter(([, v]) => !v || String(v).trim() === '')

    .map(([k]) => k);

  return missing.length ? missing : null;

}

function signToken(user) {

  return jwt.sign(

    { id: user.id, email: user.email, role: user.role },

    process.env.JWT_SECRET,

    { expiresIn: '7d' }

  );

}

exports.register = async (req, res) => {
  const { name, email, password, role } = req.body;

  //Validate required fields

  const missing = validate({ name, email, password });

  if (missing) {

    return res.status(400).json({

      msg: `Missing required fields: ${missing.join(', ')}`

    });

  }

 

  // Validate email format

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {

    return res.status(400).json({ msg: 'Invalid email format' });

  }

  //  Validate password length

  if (password.length < 8) {

    return res.status(400).json({ msg: 'Password must be at least 8 characters' });

  }

  // 4Role validation — client cannot self-assign ADMIN

  const assignedRole = ALLOWED_ROLES.includes(role) ? role : 'STUDENT';

  try {

    const hashed = await bcrypt.hash(password, 12);

    const user = await pool.query(

      `INSERT INTO users (name, email, password, role)

       VALUES ($1,$2,$3,$4)

       RETURNING id, name, email, role`,

      [name.trim(), email.toLowerCase().trim(), hashed, assignedRole]
    );

    const newUser = user.rows[0];

    const token   = signToken(newUser);

    res.status(201).json({ token, user: newUser });
 

  } catch (err) {

    // Postgres unique violation code = 23505

    if (err.code === '23505') {

      return res.status(409).json({ msg: 'Email already in use' });

    }

    console.error('Register error:', err.message);

    res.status(500).json({ msg: 'Registration failed. Please try again.' });

  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

   // Validate required fields

  const missing = validate({ email, password });

  if (missing) {

    return res.status(400).json({ msg: 'Email and password are required' });

  }

 

  try {

    const result = await pool.query(

      'SELECT * FROM users WHERE email = $1',

      [email.toLowerCase().trim()]

    );

    // Always run bcrypt even if user not found — prevents timing attack

    const user         = result.rows[0];

    const dummyHash    = '$2a$12$invalidhashfortimingprotectiononly000000000000000000000';

    const hashToCheck  = user ? user.password : dummyHash;

    const valid        = await bcrypt.compare(password, hashToCheck);
 

    //Same error message for both bad email and bad password — don't hint which

    if (!user || !valid) {

      return res.status(401).json({ msg: 'Invalid email or password' });
    }

 

    const token = signToken(user);
 

    // Never send password hash back to client

    const { password: _omit, ...safeUser } = user;

    res.json({ token, user: safeUser });

  } catch (err) {

    console.error('Login error:', err.message);

    res.status(500).json({ msg: 'Login failed. Please try again.' });

  }

};   

