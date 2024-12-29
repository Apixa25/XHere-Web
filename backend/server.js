// server.js
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const cors = require('cors');
const path = require('path');
const config = require('./config/config');  // We'll create this

// Import models
const User = require('./models/User');
const Location = require('./models/Location');

// Add this at the top of server.js
mongoose.set('strictQuery', false);

const app = express();
app.use(express.json());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://xhere-api-d83e35dea954.herokuapp.com'
    : 'http://localhost:3001',
  credentials: true
}));
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

// Near the top, after mongoose is required
mongoose.connection.on('connected', () => {
  console.log('MongoDB Connected!');
  // Log the list of collections to verify database content
  mongoose.connection.db.listCollections().toArray((err, collections) => {
    if (err) {
      console.error('Error listing collections:', err);
    } else {
      console.log('Available collections:', collections.map(c => c.name));
    }
  });
});

// Update your MongoDB connection
mongoose.connect(config.mongodb, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(async () => {
  console.log('Connected to MongoDB successfully');
  // Log connection details
  console.log('Database name:', mongoose.connection.name);
  console.log('Connection state:', mongoose.connection.readyState);
  
  // Check if users collection exists and has data
  try {
    const usersCount = await User.countDocuments();
    console.log('Number of users in database:', usersCount);
  } catch (err) {
    console.error('Error counting users:', err);
  }
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

mongoose.connection.on('error', err => {
  console.error('MongoDB error:', err);
});

// Import routes - uncomment authRoutes
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

// Add this before your route registrations
app.use((req, res, next) => {
  console.log('==== REQUEST DEBUG ====');
  console.log('Method:', req.method);
  console.log('Path:', req.path);
  console.log('Full URL:', req.originalUrl);
  console.log('Headers:', req.headers);
  if (req.path === '/api/login') {
    console.log('Login attempt body:', {
      ...req.body,
      password: req.body.password ? '[REDACTED]' : undefined
    });
  }
  console.log('====================');
  next();
});

// Add this before your route registrations
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message });
});

// Add this before route registrations
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  console.error('Stack:', err.stack);
  res.status(500).json({ 
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Route registrations - update these lines
app.use('/api/auth', authRoutes);  // This will handle /api/auth/register and /api/auth/login
app.use('/api/user', userRoutes);  // This will handle user-related routes like /api/user/profile
app.use('/api/locations', locationRoutes);

app.delete('/api/locations/:locationId/media/:mediaIndex', authenticateToken, async (req, res) => {
  try {
    const { locationId, mediaIndex } = req.params;
    
    // Find the location
    const location = await Location.findById(locationId);
    
    if (!location) {
      return res.status(404).json({ message: 'Location not found' });
    }

    // Verify ownership
    if (location.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized to delete this media' });
    }

    // Convert mediaIndex to number and verify it's valid
    const index = parseInt(mediaIndex, 10);
    if (index < 0 || index >= location.media.length) {
      return res.status(400).json({ message: 'Invalid media index' });
    }

    // Get the media item to delete
    const mediaToDelete = location.media[index];

    // Remove the media from the array
    location.media.splice(index, 1);
    
    // Save the updated location
    await location.save();

    res.json({ message: 'Media deleted successfully' });
  } catch (error) {
    console.error('Error deleting media:', error);
    res.status(500).json({ message: 'Error deleting media', error: error.message });
  }
});

// Separate server startup
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
  });
}
