const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { authenticateToken } = require('../middleware/auth');
const User = require('../models/User');
const Location = require('../models/Location');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { checkAndAwardBadges } = require('../utils/badgeChecker');

// Configure multer for all uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = 'uploads/profile-pictures';
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `profile-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
  if (!allowedTypes.includes(file.mimetype)) {
    cb(new Error('Invalid file type'));
    return;
  }
  cb(null, true);
};

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter
});

// User registration
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const user = await User.create({
      email,
      password: hashedPassword,
      profile: {
        name: name
      }
    });

    // Generate token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({ token, user: { id: user.id, email: user.email } });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Error registering user' });
  }
});

// User login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ 
      where: { email },
      attributes: ['id', 'email', 'password', 'isAdmin', 'profile', 'credits']
    });
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { 
        userId: user.id,
        isAdmin: user.isAdmin
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ 
      token, 
      user: { 
        id: user.id, 
        email: user.email,
        profile: user.profile,
        isAdmin: user.isAdmin,
        credits: user.credits
      } 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Error logging in' });
  }
});

// Get user's locations
router.get('/locations', authenticateToken, async (req, res) => {
  try {
    const locations = await Location.findAll({
      where: { creatorId: req.user.userId },
      include: [{
        model: User,
        as: 'creator',
        attributes: ['email', 'profile', 'id']
      }],
      order: [['createdAt', 'DESC']]
    });
    
    res.json(locations);
  } catch (error) {
    console.error('Error fetching user locations:', error);
    res.status(500).json({ error: 'Error fetching locations' });
  }
});

// Update location
router.put('/locations/:id', authenticateToken, upload.array('media'), async (req, res) => {
  try {
    const location = await Location.findByPk(req.params.id);
    
    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }

    // Check authorization
    if (location.creatorId !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized to modify this location' });
    }

    // Update text if provided
    if (req.body.text !== undefined) {
      location.content = {
        ...location.content,
        text: req.body.text
      };
    }

    // Handle media deletions
    if (req.body.deleteMediaIndexes) {
      const deleteIndexes = JSON.parse(req.body.deleteMediaIndexes);
      if (Array.isArray(deleteIndexes)) {
        location.content = {
          ...location.content,
          mediaUrls: location.content.mediaUrls.filter((_, index) => !deleteIndexes.includes(index)),
          mediaTypes: location.content.mediaTypes.filter((_, index) => !deleteIndexes.includes(index))
        };
      }
    }

    // Handle new media uploads
    if (req.files && req.files.length > 0) {
      const newMediaUrls = req.files.map(file => file.path);
      const newMediaTypes = req.files.map(file => file.mimetype);
      
      location.content = {
        ...location.content,
        mediaUrls: [...location.content.mediaUrls, ...newMediaUrls],
        mediaTypes: [...location.content.mediaTypes, ...newMediaTypes]
      };
    }

    await location.save();
    res.json(location);
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({ error: 'Error updating location' });
  }
});

// Add this new route
router.post('/google', async (req, res) => {
  try {
    const user = await User.findOne({
      where: { email: req.body.email },
      attributes: ['id', 'email', 'isAdmin', 'profile', 'credits']
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const token = jwt.sign(
      { 
        userId: user.id,
        isAdmin: user.isAdmin
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        profile: user.profile,
        isAdmin: user.isAdmin,
        credits: user.credits
      }
    });
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// Add this new route
router.put('/make-admin', async (req, res) => {
  try {
    const user = await User.findOne({ 
      where: { 
        email: 'stevensills2@gmail.com' 
      } 
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.isAdmin = true;
    await user.save();

    res.json({ message: 'Admin status updated successfully' });
  } catch (error) {
    console.error('Error updating admin status:', error);
    res.status(500).json({ error: 'Error updating admin status' });
  }
});

// Add this new route
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.userId, {
      attributes: ['id', 'email', 'profile', 'isAdmin', 'credits']
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      email: user.email,
      profile: user.profile,
      name: user.profile?.name || user.email,
      isAdmin: user.isAdmin,
      credits: user.credits
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Error fetching user data' });
  }
});

router.get('/profile/:userId', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.userId);
    const locations = await Location.findAll({
      where: { creatorId: req.params.userId }
    });
    
    // Calculate total points from all user locations
    const totalPoints = locations.reduce((sum, location) => 
      sum + (location.upvotes - location.downvotes), 0
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update user's points in database
    user.points = totalPoints;
    await user.save();

    res.json({ 
      user: {
        ...user.toJSON(),
        points: totalPoints
      }
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Error fetching user profile' });
  }
});

router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.userId);
    console.log('User data from DB:', JSON.stringify(user, null, 2));
    
    // Check and award badges in one place only
    const badges = await checkAndAwardBadges(req.user.userId);
    console.log('Badges checked:', badges);
    
    res.json({ 
      user: {
        ...user.toJSON(),
        badges,
        credits: user.credits || 0
      }
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Error fetching profile' });
  }
});

// Add this new route to handle profile picture uploads
router.post('/profile-picture', 
  authenticateToken, 
  upload.single('profilePicture'), 
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const user = await User.findByPk(req.user.userId);
      user.profile = {
        ...user.profile,
        pictureUrl: req.file.path.replace(/\\/g, '/')
      };
      await user.save();

      res.json({ pictureUrl: user.profile.pictureUrl });
    } catch (error) {
      console.error('Profile picture upload error:', error);
      res.status(500).json({ error: 'Failed to update profile picture' });
    }
  }
);

module.exports = router; 