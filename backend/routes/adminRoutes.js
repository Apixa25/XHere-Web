const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const User = require('../models/User');
const Location = require('../models/Location');
const { Sequelize } = require('sequelize');

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
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Error fetching users' });
  }
});

// Delete user and their content
router.delete('/users/:userId', authenticateToken, adminAuth, async (req, res) => {
  const transaction = await User.sequelize.transaction();
  
  try {
    const userToDelete = await User.findByPk(req.params.userId);
    
    if (!userToDelete) {
      await transaction.rollback();
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent deleting yourself
    if (userToDelete.id === req.user.userId) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Cannot delete your own admin account' });
    }

    // Delete all locations created by the user
    await Location.destroy({
      where: { creatorId: req.params.userId },
      transaction
    });

    // Delete the user
    await userToDelete.destroy({ transaction });

    await transaction.commit();
    
    console.log(`User ${req.params.userId} and their content deleted successfully`);
    res.json({ message: 'User and associated content deleted successfully' });
  } catch (error) {
    await transaction.rollback();
    console.error('Error deleting user:', error);
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