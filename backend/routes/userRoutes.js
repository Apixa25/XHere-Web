const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Location = require('../models/Location');
const multer = require('multer');
const path = require('path');
const mongoose = require('mongoose');

// Configure multer for profile image uploads
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'uploads/profiles/');
  },
  filename: function(req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only jpeg, jpg, and png files are allowed!'));
  }
});

// GET /api/user/profile - Fetch user profile
router.get('/profile', auth, async (req, res) => {
  try {
    console.log('Fetching profile for user:', req.user.userId); // Debug log
    
    const user = await User.findById(req.user.userId)
      .select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/user/profile - Update user profile
router.put('/profile', auth, upload.single('profileImage'), async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update profile image if provided
    if (req.file) {
      user.profileImage = req.file.path.replace('\\', '/'); // Normalize path for Windows
    }

    // Update other fields if provided
    if (req.body.name) user.name = req.body.name;
    if (req.body.email) user.email = req.body.email;

    await user.save();
    res.json(user);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/user/locations - Fetch user's locations
router.get('/locations', auth, async (req, res) => {
  console.log('GET /locations route hit');
  try {
    console.log('Auth middleware user:', req.user);
    console.log('User ID type:', typeof req.user.userId);
    
    // Convert string ID to ObjectId if needed
    const userId = mongoose.Types.ObjectId.isValid(req.user.userId) 
      ? new mongoose.Types.ObjectId(req.user.userId)
      : req.user.userId;
    
    console.log('Looking for locations with creator:', userId);
    
    // Debug: Find all locations first
    const allLocations = await Location.find({});
    console.log('Total locations in database:', allLocations.length);
    console.log('Sample location creator:', allLocations[0]?.creator);
    
    // Find locations for specific user
    const userLocations = await Location.find({ 
      creator: userId 
    }).populate({
      path: 'creator',
      select: 'email profile.name _id'
    });
    
    console.log('Found locations for user:', userLocations.length);
    
    if (userLocations.length === 0) {
      // Debug: Check if direct ID match works
      const directMatch = allLocations.filter(loc => 
        loc.creator.toString() === req.user.userId.toString()
      );
      console.log('Direct match found:', directMatch.length);
    }
    
    res.json(userLocations);
  } catch (error) {
    console.error('Error fetching user locations:', error);
    console.error('Full error:', error.stack);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 