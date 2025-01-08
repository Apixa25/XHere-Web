const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const User = require('../models/User');
const Location = require('../models/Location');

// Admin middleware
const adminAuth = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.userId);
    if (!user?.isAdmin) {
      return res.status(403).json({ error: 'Admin access denied' });
    }
    next();
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Get all users
router.get('/users', authenticateToken, adminAuth, async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'email', 'profile', 'isAdmin', 'credits', 'createdAt']
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching users' });
  }
});

// Delete user
router.delete('/users/:userId', authenticateToken, adminAuth, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Delete user's locations
    await Location.destroy({ where: { creatorId: req.params.userId } });
    
    // Delete user
    await user.destroy();
    res.json({ message: 'User and associated content deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting user' });
  }
});

// Search content
router.get('/search', authenticateToken, adminAuth, async (req, res) => {
  try {
    const { query, type } = req.query;
    let results = [];
    
    if (type === 'locations') {
      results = await Location.findAll({
        where: {
          content: {
            text: {
              [Sequelize.Op.iLike]: `%${query}%`
            }
          }
        },
        include: [{
          model: User,
          as: 'creator',
          attributes: ['email', 'profile']
        }]
      });
    }
    
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Error searching content' });
  }
});

module.exports = router; 