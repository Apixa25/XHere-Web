const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Location = require('../models/Location');
const multer = require('multer');

// Configure multer for media uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Add at the top of the file, after imports
router.use((req, res, next) => {
  console.log('Location route hit:', req.method, req.path);
  next();
});

// Add this at the top of your routes (after the middleware)
router.get('/test', (req, res) => {
  res.json({ message: 'Location routes are working' });
});

// Get all locations
router.get('/', auth, async (req, res) => {
  try {
    const locations = await Location.find()
      .populate({
        path: 'creator',
        select: 'email profile.name _id'
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

    const location = new Location({
      location: {
        type: 'Point',
        coordinates: [req.body.longitude, req.body.latitude]
      },
      content: {
        text: req.body.text || '',
        mediaUrls,
        mediaTypes
      },
      creator: req.user.userId
    });

    await location.save();
    
    await location.populate({
      path: 'creator',
      select: 'email profile.name _id'
    });
    
    res.status(201).json(location);
  } catch (error) {
    console.error('Error creating location:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete location
router.delete('/:id', auth, async (req, res) => {
  try {
    const location = await Location.findById(req.params.id);
    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }
    if (location.creator.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    await location.deleteOne();
    res.json({ message: 'Location deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update location route
router.put('/:id', auth, upload.array('media'), async (req, res) => {
  console.log('==== PUT REQUEST DEBUG ====');
  console.log('Route hit:', req.method, req.path);
  console.log('Location ID:', req.params.id);
  console.log('Auth token:', req.headers.authorization);
  console.log('Request body:', req.body);
  console.log('========================');
  
  try {
    const location = await Location.findById(req.params.id);
    console.log('Found location:', location);
    
    if (!location) {
      console.log('Location not found');
      return res.status(404).json({ error: 'Location not found' });
    }
    
    if (location.creator.toString() !== req.user.userId) {
      console.log('Not authorized. Creator:', location.creator, 'User:', req.user.userId);
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Update text content if provided
    if (req.body.text !== undefined) {
      location.content.text = req.body.text;
    }

    // Add new media files if any
    if (req.files && req.files.length > 0) {
      const newMediaUrls = req.files.map(file => file.path);
      const newMediaTypes = req.files.map(file => file.mimetype);
      
      location.content.mediaUrls = [...location.content.mediaUrls, ...newMediaUrls];
      location.content.mediaTypes = [...location.content.mediaTypes, ...newMediaTypes];
    }

    await location.save();
    console.log('Location updated successfully');
    
    // Populate creator information before sending response
    await location.populate({
      path: 'creator',
      select: 'email profile.name _id'
    });
    
    res.json(location);
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 