const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader ) return res.status(401).json({ msg: "No token" });
  

  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } 
  catch(err) {
    if(err.name === 'TokenExpiredError') {
      return res.status(401).json({ msg: "Token expired" });
    }
    res.status(401).json({ msg: "Invalid token" });
  }
};

module.exports = { verifyToken };
