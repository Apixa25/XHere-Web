const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticateToken = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('🔍 Auth middleware - JWT decoded:', decoded);
    console.log('🔍 Auth middleware - Looking for user with ID:', decoded.userId);
    
    const user = await User.findByPk(decoded.userId);
    console.log('🔍 Auth middleware - User found:', user ? { id: user.id, email: user.email } : 'NOT FOUND');
    
    if (!user) {
      throw new Error();
    }

    req.user = {
      id: user.id,
      email: user.email,
      isAdmin: user.isAdmin
    };
    console.log('🔍 Auth middleware - Setting req.user:', req.user);
    
    next();
  } catch (error) {
    res.status(401).json({ error: 'Authentication failed' });
  }
};

module.exports = {
  authenticateToken: authenticateToken
};
