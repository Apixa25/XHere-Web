const express = require('express');
const router = express.Router();
const Location = require('../models/Location');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Get all locations
router.get('/', auth.authenticateToken, async (req, res) => {
  try {
    const locations = await Location.findAll({
      include: [{
        model: User,
        as: 'creator',
        attributes: ['email', 'profile', 'id']
      }],
      order: [['createdAt', 'DESC']]
    });
    res.json(locations);
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 