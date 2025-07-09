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
      isAdmin: user.isAdmin,
      trustLevel: user.trustLevel
    };
    console.log('🔍 Auth middleware - Setting req.user:', req.user);
    
    next();
  } catch (error) {
    res.status(401).json({ error: 'Authentication failed' });
  }
};

const requireAdmin = async (req, res, next) => {
  try {
    // First authenticate the user
    await authenticateToken(req, res, (err) => {
      if (err) {
        return res.status(401).json({ error: 'Authentication required' });
      }
    });

    // Then check if user is admin
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({ error: 'Admin privileges required' });
    }

    next();
  } catch (error) {
    res.status(403).json({ error: 'Admin privileges required' });
  }
};

const requireModerator = async (req, res, next) => {
  try {
    // First authenticate the user
    await authenticateToken(req, res, (err) => {
      if (err) {
        return res.status(401).json({ error: 'Authentication required' });
      }
    });

    // Then check if user is moderator or admin
    if (!req.user || (!req.user.isAdmin && req.user.trustLevel !== 'moderator')) {
      return res.status(403).json({ error: 'Moderator privileges required' });
    }

    next();
  } catch (error) {
    res.status(403).json({ error: 'Moderator privileges required' });
  }
};

module.exports = {
  authenticateToken: authenticateToken,
  requireAuth: authenticateToken,
  requireAdmin: requireAdmin,
  requireModerator: requireModerator
};
