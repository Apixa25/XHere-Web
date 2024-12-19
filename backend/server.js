// server.js
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
app.use(express.json());

// MongoDB Models
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profile: {
    name: String,
    preferences: Object
  },
  createdAt: { type: Date, default: Date.now }
});

const locationDataSchema = new mongoose.Schema({
  location: {
    type: { type: String, default: 'Point' },
    coordinates: [Number] // [longitude, latitude]
  },
  content: {
    text: String,
    mediaUrls: [String],
    mediaTypes: [String] // ['image', 'video']
  },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

locationDataSchema.index({ location: '2dsphere' }); // Enable geospatial queries

const User = mongoose.model('User', userSchema);
const LocationData = mongoose.model('LocationData', locationDataSchema);

// Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// File Upload Configuration
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// Auth Routes
app.post('/api/register', async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const user = new User({
      email: req.body.email,
      password: hashedPassword,
      profile: { name: req.body.name }
    });
    await user.save();
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(400).json({ error: 'User not found' });

    const validPassword = await bcrypt.compare(req.body.password, user.password);
    if (!validPassword) return res.status(400).json({ error: 'Invalid password' });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Location Data Routes
app.post('/api/locations', authenticateToken, upload.array('media'), async (req, res) => {
  try {
    const mediaUrls = req.files ? req.files.map(file => file.path) : [];
    const mediaTypes = req.files ? req.files.map(file => file.mimetype.startsWith('image/') ? 'image' : 'video') : [];

    const locationData = new LocationData({
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
    await locationData.save();
    res.status(201).json(locationData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/locations/nearby', authenticateToken, async (req, res) => {
  try {
    const { longitude, latitude, maxDistance = 1000 } = req.query; // maxDistance in meters
    
    const nearbyLocations = await LocationData.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: parseInt(maxDistance)
        }
      }
    }).populate('creator', 'profile.name');
    
    res.json(nearbyLocations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    app.listen(process.env.PORT, () => {
      console.log(`Server running on port ${process.env.PORT}`);
    });
  })
  .catch(err => console.error('MongoDB connection error:', err));