// server.js
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const cors = require('cors');

// Import models
const User = require('./models/User');
const Location = require('./models/Location');

// Add this at the top of server.js
mongoose.set('strictQuery', false);

const app = express();
app.use(express.json());
app.use(cors());
app.use('/uploads', express.static('uploads'));

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
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/your_database_name', {
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

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const locationRoutes = require('./routes/locationRoutes');

// Route registrations
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);        // Changed from users to user
app.use('/api/location', locationRoutes); // Changed from locations to location

// Separate server startup
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
