const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  console.log('Auth middleware triggered');
  console.log('Headers:', req.headers);

  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    console.log('Token received:', token ? `${token.substring(0, 20)}...` : 'No token');

    if (!token) {
      throw new Error('No token provided');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    console.log('Decoded token:', decoded);

    req.user = decoded;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    res.status(401).json({ error: 'Authentication failed' });
  }
};

module.exports = auth;
