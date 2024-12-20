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

// Get all locations
router.get('/', auth, async (req, res) => {
  try {
    const locations = await Location.find()
      .populate('creator', 'email profile.name');
    res.json(locations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create location
router.post('/', auth, upload.array('media'), async (req, res) => {
  try {
    const mediaUrls = req.files ? req.files.map(file => file.path) : [];
    const mediaTypes = req.files ? req.files.map(file => 
      file.mimetype.startsWith('image/') ? 'image' : 'video'
    ) : [];

    const location = new Location({
      location: {
        type: 'Point',
        coordinates: [req.body.longitude, req.body.latitude]
      },
      content: {
        text: req.body.text,
        mediaUrls,
        mediaTypes
      },
      creator: req.user.userId
    });

    await location.save();
    res.status(201).json(location);
  } catch (error) {
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

module.exports = router; 