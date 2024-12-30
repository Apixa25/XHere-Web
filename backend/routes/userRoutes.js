const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Location = require('../models/Location');
const multer = require('multer');
const path = require('path');
const { Op } = require('sequelize');

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
    console.log('Fetching profile for user:', req.user.userId);
    
    const user = await User.findByPk(req.user.userId, {
      attributes: { exclude: ['password'] }
    });
    
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
    const user = await User.findByPk(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update profile image if provided
    if (req.file) {
      user.profile = {
        ...user.profile,
        imageUrl: req.file.path.replace('\\', '/')
      };
    }

    // Update other fields if provided
    if (req.body.name) {
      user.profile = {
        ...user.profile,
        name: req.body.name
      };
    }
    if (req.body.email) user.email = req.body.email;

    await user.save();
    res.json(user);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/locations - Fetch all locations
router.get('/locations', auth, async (req, res) => {
  try {
    console.log('Fetching all locations. User:', req.user.userId);
    
    const locations = await Location.find()
      .populate({
        path: 'creator',
        select: 'email profile.name _id'
      })
      .sort({ createdAt: -1 });
    
    console.log(`Found ${locations.length} total locations`);
    res.json(locations);
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/locations/:id - Update location
router.put('/locations/:id', auth, upload.array('media'), async (req, res) => {
  try {
    console.log('Update request for location:', req.params.id);
    console.log('Request body:', req.body);
    console.log('Files:', req.files);
    
    const location = await Location.findById(req.params.id);
    
    if (!location) {
      console.log('Location not found');
      return res.status(404).json({ error: 'Location not found' });
    }

    // Check authorization
    if (!req.user.isAdmin && location.creator.toString() !== req.user.userId) {
      console.log('Authorization failed');
      return res.status(403).json({ error: 'Not authorized to modify this location' });
    }

    // Update text if provided
    if (req.body.text !== undefined) {
      location.content.text = req.body.text;
    }

    // Handle media deletions
    if (req.body.deleteMediaIndexes) {
      try {
        const deleteIndexes = JSON.parse(JSON.parse(req.body.deleteMediaIndexes));
        console.log('Deleting media at indexes:', deleteIndexes);
        
        if (Array.isArray(deleteIndexes)) {
          location.content.mediaUrls = location.content.mediaUrls.filter((_, index) => 
            !deleteIndexes.includes(index)
          );
          location.content.mediaTypes = location.content.mediaTypes.filter((_, index) => 
            !deleteIndexes.includes(index)
          );
        }
      } catch (error) {
        console.error('Error parsing deleteMediaIndexes:', error);
        return res.status(400).json({ error: 'Invalid deleteMediaIndexes format' });
      }
    }

    // Add new media files
    if (req.files && req.files.length > 0) {
      const newMediaUrls = req.files.map(file => file.path.replace('\\', '/'));
      const newMediaTypes = req.files.map(file => file.mimetype);
      
      location.content.mediaUrls = [...location.content.mediaUrls, ...newMediaUrls];
      location.content.mediaTypes = [...location.content.mediaTypes, ...newMediaTypes];
    }

    await location.save();
    console.log('Location updated successfully');
    
    // Populate creator info before sending response
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

// DELETE /api/locations/:id - Delete location
router.delete('/locations/:id', auth, async (req, res) => {
  try {
    console.log('Delete request for location:', req.params.id);
    console.log('User:', req.user);
    
    const location = await Location.findById(req.params.id);
    
    if (!location) {
      console.log('Location not found');
      return res.status(404).json({ error: 'Location not found' });
    }

    console.log('Location creator:', location.creator);
    console.log('User ID:', req.user.userId);
    console.log('Is admin:', req.user.isAdmin);

    // Check if user is authorized to delete this location
    if (!req.user.isAdmin && location.creator.toString() !== req.user.userId) {
      console.log('Authorization failed');
      return res.status(403).json({ error: 'Not authorized to delete this location' });
    }

    await Location.findByIdAndDelete(req.params.id);
    console.log('Location deleted successfully');
    res.json({ message: 'Location deleted successfully' });
  } catch (error) {
    console.error('Error deleting location:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/user/locations - Fetch user's own locations
router.get('/user/locations', auth, async (req, res) => {
  try {
    console.log('Fetching locations for user:', req.user.userId);
    
    const locations = await Location.findAll({ 
      where: { creatorId: req.user.userId },
      include: [{
        model: User,
        as: 'creator',
        attributes: ['email', 'profile', 'id']
      }],
      order: [['createdAt', 'DESC']]
    });
    
    console.log(`Found ${locations.length} locations for user`);
    res.json(locations);
  } catch (error) {
    console.error('Error fetching user locations:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 