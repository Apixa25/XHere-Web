// server.js
const express = require('express');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const cors = require('cors');
const path = require('path');
const config = require('./config/config');
const sequelize = require('./config/database');
const initializeDatabase = require('./config/init-db');
const { authenticateToken } = require('./middleware/auth');
const fs = require('fs');
const { scheduleCleanup } = require('./scripts/cleanupExpiredLocations');

// Import models
const User = require('./models/User');
const Location = require('./models/Location');

const app = express();

// CORS middleware
app.use(cors({
  origin: ['http://localhost:3001', 'https://xhere-api.herokuapp.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Make sure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Initialize database
initializeDatabase()
  .then(() => {
    console.log('Database initialized successfully');
  })
  .catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });

// Add this before your routes
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Rest of the middleware and route configurations remain the same
// Reference existing configurations from:

// Update the media deletion endpoint for PostgreSQL
app.delete('/api/locations/:locationId/media/:mediaIndex', authenticateToken, async (req, res) => {
  try {
    const { locationId, mediaIndex } = req.params;
    
    const location = await Location.findByPk(locationId);
    
    if (!location) {
      return res.status(404).json({ message: 'Location not found' });
    }

    if (location.creatorId !== req.user.userId) {
      return res.status(403).json({ message: 'Unauthorized to delete this media' });
    }

    const index = parseInt(mediaIndex, 10);
    const content = location.content;
    
    if (index < 0 || index >= content.mediaUrls.length) {
      return res.status(400).json({ message: 'Invalid media index' });
    }

    content.mediaUrls.splice(index, 1);
    content.mediaTypes.splice(index, 1);
    location.content = content;
    
    await location.save();

    res.json({ message: 'Media deleted successfully' });
  } catch (error) {
    console.error('Error deleting media:', error);
    res.status(500).json({ message: 'Error deleting media', error: error.message });
  }
});

const authRoutes = require('./routes/authRoutes');
const locationRoutes = require('./routes/locationRoutes');
const userRoutes = require('./routes/userRoutes');
const voteRoutes = require('./routes/voteRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Register routes
app.use('/api/auth', authRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/votes', voteRoutes);
app.use('/api/admin', adminRoutes);

// Add this debug log
console.log('Available routes:', app._router.stack
  .filter(r => r.route)
  .map(r => ({
    path: r.route.path,
    methods: Object.keys(r.route.methods)
  }))
);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

try {
  scheduleCleanup();
  console.log('Cleanup scheduler initialized');
} catch (error) {
  console.error('Failed to initialize cleanup scheduler:', error);
}
