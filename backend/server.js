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

// Add this before your route registrations
app.use((req, res, next) => {
  console.log('==== REQUEST DEBUG ====');
  console.log('Method:', req.method);
  console.log('Path:', req.path);
  console.log('Full URL:', req.originalUrl);
  console.log('Headers:', req.headers);
  console.log('====================');
  next();
});

// Add this before your route registrations
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message });
});

// Route registrations
app.use('/api/auth', authRoutes);
app.use('/api/locations', locationRoutes);  // This handles all location CRUD operations
app.use('/api/user', userRoutes);          // This handles user-specific routes

// Separate server startup
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
