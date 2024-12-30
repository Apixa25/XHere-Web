const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Location = require('../models/Location');
const User = require('../models/User');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { Op } = require('sequelize');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024,
    files: 5
  }
});

// Get all locations
router.get('/', auth, async (req, res) => {
  try {
    const locations = await Location.findAll({
      include: [{
        model: User,
        as: 'creator',
        attributes: ['id', 'email', 'profile'],
        where: {
          '$Location.content.isAnonymous$': false
        },
        required: false
      }],
      order: [['createdAt', 'DESC']]
    });
    
    res.json(locations);
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create location
router.post('/', auth, upload.array('media'), async (req, res) => {
  try {
    if (!req.body.latitude || !req.body.longitude) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const mediaUrls = req.files ? req.files.map(file => file.path) : [];
    const mediaTypes = req.files ? req.files.map(file => file.mimetype) : [];

    const location = await Location.create({
      location: {
        type: 'Point',
        coordinates: [parseFloat(req.body.longitude), parseFloat(req.body.latitude)]
      },
      content: {
        text: req.body.text || '',
        mediaUrls,
        mediaTypes,
        isAnonymous: req.body.isAnonymous === 'true'
      },
      creatorId: req.user.userId
    });

    // If not anonymous, include creator details
    if (!req.body.isAnonymous) {
      await location.reload({
        include: [{
          model: User,
          as: 'creator',
          attributes: ['email', 'profile', 'id']
        }]
      });
    }

    res.status(201).json(location);
  } catch (error) {
    console.error('Error creating location:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update location
router.put('/:id', auth, upload.array('media'), async (req, res) => {
  try {
    const location = await Location.findByPk(req.params.id);
    
    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }

    if (!req.user.isAdmin && location.creatorId !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized to modify this location' });
    }

    // Handle media deletions
    if (req.body.deleteMediaIndexes) {
      const deleteIndexes = JSON.parse(req.body.deleteMediaIndexes);
      const content = location.content;
      content.mediaUrls = content.mediaUrls.filter((_, index) => !deleteIndexes.includes(index));
      content.mediaTypes = content.mediaTypes.filter((_, index) => !deleteIndexes.includes(index));
      location.content = content;
    }

    // Add new media
    if (req.files?.length > 0) {
      const newMediaUrls = req.files.map(file => file.path.replace('\\', '/'));
      const newMediaTypes = req.files.map(file => file.mimetype);
      const content = location.content;
      content.mediaUrls = [...content.mediaUrls, ...newMediaUrls];
      content.mediaTypes = [...content.mediaTypes, ...newMediaTypes];
      location.content = content;
    }

    // Update text if provided
    if (req.body.text !== undefined) {
      location.content = {
        ...location.content,
        text: req.body.text
      };
    }

    await location.save();

    // Reload with creator details
    await location.reload({
      include: [{
        model: User,
        as: 'creator',
        attributes: ['email', 'profile', 'id']
      }]
    });

    res.json(location);
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete location
router.delete('/:id', auth, async (req, res) => {
  try {
    const location = await Location.findByPk(req.params.id);
    
    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }

    if (!req.user.isAdmin && location.creatorId !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized to delete this location' });
    }

    await location.destroy();
    res.json({ message: 'Location deleted successfully' });
  } catch (error) {
    console.error('Error deleting location:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 