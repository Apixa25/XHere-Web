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

// Import models
const User = require('./models/User');
const Location = require('./models/Location');

const app = express();

// Initialize database
initializeDatabase()
  .then(() => {
    console.log('Database initialized successfully');
  })
  .catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
