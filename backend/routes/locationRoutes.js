const express = require('express');
const router = express.Router();
const Location = require('../models/Location');
const User = require('../models/User');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

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

// Add DELETE endpoint
router.delete('/:id', auth.authenticateToken, async (req, res) => {
  try {
    const location = await Location.findByPk(req.params.id);
    
    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }

    // Check if user is authorized to delete (either admin or creator)
    if (!req.user.isAdmin && location.creatorId !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized to delete this location' });
    }

    await location.destroy();
    res.json({ message: 'Location deleted successfully' });
  } catch (error) {
    console.error('Error deleting location:', error);
    res.status(500).json({ error: 'Error deleting location' });
  }
});

// Add POST endpoint
router.post('/', auth.authenticateToken, upload.array('media'), async (req, res) => {
  try {
    const { latitude, longitude, text, isAnonymous } = req.body;
    
    const location = await Location.create({
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)]
      },
      content: {
        text: text || '',
        mediaUrls: req.files ? req.files.map(file => file.path) : [],
        mediaTypes: req.files ? req.files.map(file => file.mimetype) : [],
        isAnonymous: isAnonymous === 'true'
      },
      creatorId: req.user.userId
    });

    // Fetch the created location with creator info
    const locationWithCreator = await Location.findByPk(location.id, {
      include: [{
        model: User,
        as: 'creator',
        attributes: ['email', 'profile', 'id']
      }]
    });

    res.status(201).json(locationWithCreator);
  } catch (error) {
    console.error('Error creating location:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 