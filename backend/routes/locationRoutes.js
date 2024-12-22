const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Location = require('../models/Location');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Add these constants at the top of the file
const MAX_FILES = 5;  // Maximum number of files allowed
const MAX_FILE_SIZE = 50 * 1024 * 1024;  // 50MB in bytes

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
    fileSize: MAX_FILE_SIZE,  // 50MB file size limit
    files: MAX_FILES  // Maximum number of files
  },
  fileFilter: (req, file, cb) => {
    // Check file types
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and videos are allowed.'));
    }
  }
});

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
  console.log('Request body:', req.body);
  console.log('Delete Media Indexes:', req.body.deleteMediaIndexes);
  
  try {
    const location = await Location.findById(req.params.id);
    
    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }
    
    if (location.creator.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Update text content if provided
    if (req.body.text !== undefined) {
      location.content.text = req.body.text;
    }

    // Handle media deletions if any
    if (req.body.deleteMediaIndexes) {
      console.log('Processing media deletions');
      const indexesToDelete = JSON.parse(req.body.deleteMediaIndexes);
      console.log('Indexes to delete:', indexesToDelete);
      console.log('Current media URLs:', location.content.mediaUrls);
      
      const newMediaUrls = location.content.mediaUrls.filter((_, index) => 
        !indexesToDelete.includes(index)
      );
      const newMediaTypes = location.content.mediaTypes.filter((_, index) => 
        !indexesToDelete.includes(index)
      );
      
      console.log('New media URLs after deletion:', newMediaUrls);
      
      location.content.mediaUrls = newMediaUrls;
      location.content.mediaTypes = newMediaTypes;
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