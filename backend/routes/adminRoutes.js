const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const User = require('../models/User');
const Location = require('../models/Location');
const { Sequelize, Op } = require('sequelize');
const sequelize = require('../config/database');

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

// Get all users with location counts
router.get('/users', authenticateToken, adminAuth, async (req, res) => {
  try {
    // Debug log
    console.log('Fetching users with location counts...');

    const users = await User.findAll({
      attributes: [
        'id',
        'email',
        'profile',
        'isAdmin',
        'credits',
        'createdAt',
        [
          sequelize.literal(`(
            SELECT COALESCE(COUNT(*), 0)
            FROM "Locations"
            WHERE "Locations"."creatorId" = "User"."id"
          )`),
          'locationCount'
        ]
      ],
      order: [['createdAt', 'DESC']]
    });

    // Debug log
    console.log(`Found ${users.length} users`);

    res.json(users);
  } catch (error) {
    console.error('Error in /admin/users:', error);
    res.status(500).json({ 
      error: 'Error fetching users',
      details: error.message 
    });
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

    switch (type) {
      case 'locations':
        results = await Location.findAll({
          where: {
            [Op.or]: [
              Sequelize.literal(`CAST("content"->>'text' AS TEXT) ILIKE '%${query}%'`)
            ]
          },
          include: [{
            model: User,
            as: 'creator',
            attributes: ['email', 'profile']
          }],
          order: [['createdAt', 'DESC']]
        });
        break;

      case 'users':
        results = await User.findAll({
          where: {
            [Op.or]: [
              { email: { [Op.iLike]: `%${query}%` } },
              Sequelize.literal(`CAST("profile"->>'name' AS TEXT) ILIKE '%${query}%'`)
            ]
          },
          attributes: [
            'id',
            'email',
            'profile',
            'isAdmin',
            'credits',
            'createdAt',
            [
              sequelize.literal(`(
                SELECT COALESCE(COUNT(*), 0)
                FROM "Locations"
                WHERE "Locations"."creatorId" = "User"."id"
              )`),
              'locationCount'
            ]
          ],
          order: [['createdAt', 'DESC']]
        });
        break;
    }

    console.log('Search results:', results);
    res.json(results);
  } catch (error) {
    console.error('Backend search error:', error);
    res.status(500).json({ error: error.message || 'Error performing search' });
  }
});

// Add this route for deleting locations
router.delete('/locations/:locationId', authenticateToken, adminAuth, async (req, res) => {
  try {
    const { locationId } = req.params;
    
    const location = await Location.findByPk(locationId);
    
    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }

    await location.destroy();
    
    res.json({ message: 'Location deleted successfully' });
  } catch (error) {
    console.error('Error deleting location:', error);
    res.status(500).json({ error: 'Failed to delete location' });
  }
});

// Add this new route alongside your existing routes
router.put('/locations/:locationId', authenticateToken, adminAuth, async (req, res) => {
  try {
    const { locationId } = req.params;
    const { content } = req.body;

    const location = await Location.findByPk(locationId);
    
    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }

    location.content = content;
    await location.save();

    res.json(location);
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({ error: 'Failed to update location' });
  }
});

// Add this new route to get user locations
router.get('/user-locations/:userId', authenticateToken, adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const locations = await Location.findAll({
      where: { creatorId: userId },
      order: [['createdAt', 'DESC']],
      include: [{
        model: User,
        as: 'creator',
        attributes: ['email', 'profile']
      }]
    });

    res.json(locations);
  } catch (error) {
    console.error('Error fetching user locations:', error);
    res.status(500).json({ error: 'Failed to fetch user locations' });
  }
});

module.exports = router; 