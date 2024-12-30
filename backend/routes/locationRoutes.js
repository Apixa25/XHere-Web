const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Location = require('../models/Location');
const User = require('../models/User');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Basic test route to verify router is working
router.get('/test', (req, res) => {
  res.json({ message: 'Test route working' });
});

// Simple post route without middleware
router.post('/test', (req, res) => {
  res.json({ message: 'Post test working' });
});

// Create location - Update this route
router.post('/', auth, multer().array('media'), async (req, res) => {
  try {
    console.log('Received location creation request:', req.body);
    
    // Create the location
    const location = await Location.create({
      location: {
        type: 'Point',
        coordinates: [parseFloat(req.body.longitude), parseFloat(req.body.latitude)]
      },
      content: {
        text: req.body.text || '',
        mediaUrls: [],
        mediaTypes: [],
        isAnonymous: req.body.isAnonymous === 'true'
      },
      creatorId: req.user.userId
    });

    // Handle media files if any
    if (req.files && req.files.length > 0) {
      const mediaUrls = req.files.map(file => file.path.replace('\\', '/'));
      const mediaTypes = req.files.map(file => file.mimetype);
      
      location.content.mediaUrls = mediaUrls;
      location.content.mediaTypes = mediaTypes;
      await location.save();
    }

    // Fetch the complete location with creator info
    const completeLocation = await Location.findByPk(location.id, {
      include: [{
        model: User,
        as: 'creator',
        attributes: ['email', 'profile', 'id']
      }]
    });

    // Transform the location data for frontend consumption
    const responseLocation = {
      id: completeLocation.id,
      location: completeLocation.location,
      content: completeLocation.content,
      creator: completeLocation.creator,
      createdAt: completeLocation.createdAt,
      updatedAt: completeLocation.updatedAt
    };

    res.status(201).json(responseLocation);
  } catch (error) {
    console.error('Error creating location:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all locations - simplified version
router.get('/', auth, async (req, res) => {
  try {
    const locations = await Location.findAll({
      include: [{
        model: User,
        as: 'creator',
        attributes: ['email', 'profile', 'id']
      }],
      order: [['createdAt', 'DESC']]
    });
    
    console.log('Sending locations:', locations);
    res.json(locations || []); // Ensure we always send an array
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 