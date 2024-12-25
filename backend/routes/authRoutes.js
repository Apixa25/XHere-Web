const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Register route
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    user = new User({
      email,
      password: hashedPassword,
      profile: { name }
    });

    await user.save();
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt:', { email, password }); // Debug log

    // Check if user exists
    const user = await User.findOne({ email });
    console.log('User found:', user ? 'Yes' : 'No'); // Debug log

    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Validate password
    const validPassword = await bcrypt.compare(password, user.password);
    console.log('Password valid:', validPassword ? 'Yes' : 'No'); // Debug log

    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Create and send token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'fallback_secret', // Add fallback for testing
      { expiresIn: '24h' }
    );

    console.log('Login successful, token created'); // Debug log

    res.json({
      token,
      user: {
        _id: user._id,
        email: user.email,
        name: user.profile?.name
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 