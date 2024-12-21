// server.js
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const cors = require('cors');
const path = require('path');

// Import models
const User = require('./models/User');
const Location = require('./models/Location');

// Add this at the top of server.js
mongoose.set('strictQuery', false);

const app = express();
app.use(express.json());
app.use(cors());
app.use('/uploads', express.static('uploads'));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Make sure uploads directory exists
const fs = require('fs');
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Add test route here
app.get('/test', (req, res) => {
  res.json({ message: 'Server is running!' });
});

// Debug routes
app.get('/test/auth', (req, res) => {
  const authHeader = req.headers.authorization;
  res.json({ 
    message: 'Auth header received',
    authHeader: authHeader
  });
});

app.get('/test/token', (req, res) => {
  const token = req.headers.authorization;
  res.json({ 
    message: 'Token received',
    token: token 
  });
});

// Update MongoDB connection with better error handling and options
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/location-app', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('Connected to MongoDB successfully');
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

mongoose.connection.on('error', err => {
  console.error('MongoDB error:', err);
});

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const locationRoutes = require('./routes/locationRoutes');

// Debug middleware should come after CORS but before routes
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  console.log('Headers:', req.headers);
  next();
});

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Add the location POST route directly in server.js for testing
app.post('/api/user/locations', authenticateToken, upload.array('media'), async (req, res) => {
  try {
    console.log('Auth user:', req.user);
    console.log('Received location data:', req.body);
    console.log('Received files:', req.files);

    // Validate required fields
    if (!req.body.latitude || !req.body.longitude) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const location = new Location({
      creator: req.user.userId,  // Changed from user to userId to match auth middleware
      location: {
        type: 'Point',
        coordinates: [parseFloat(req.body.longitude), parseFloat(req.body.latitude)]
      },
      content: {
        text: req.body.text || '',
        mediaUrls: req.files ? req.files.map(file => file.path) : []
      }
    });

    console.log('Created location object:', location);

    const savedLocation = await location.save();
    console.log('Saved location:', savedLocation);

    // Populate creator details before sending response
    await savedLocation.populate({
      path: 'creator',
      select: 'email profile.name _id'
    });

    res.status(201).json(savedLocation);
  } catch (error) {
    console.error('Error saving location:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route registrations
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);        // This will handle /api/user/locations
app.use('/api/locations', locationRoutes); // This will handle general location routes

// Separate server startup
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
