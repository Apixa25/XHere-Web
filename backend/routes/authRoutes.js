const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');

// Initialize Google OAuth client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Register route
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ 
      where: { email } 
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      email,
      password: hashedPassword,
      profile: { name }
    });

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
    console.log('Login attempt for:', email);

    const user = await User.findOne({ 
      where: { email },
      attributes: ['id', 'email', 'password', 'profile', 'credits']
    });

    if (!user) {
      console.log('User not found');
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    console.log('Stored password hash:', user.password);
    console.log('Attempting to compare with provided password');
    
    const validPassword = await bcrypt.compare(password, user.password);
    console.log('Password validation result:', validPassword);

    if (!validPassword) {
      console.log('Invalid password for user:', email);
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.profile?.name,
        credits: user.credits
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Test endpoint to check if the route is working
router.get('/test', (req, res) => {
  res.json({ 
    message: 'Auth routes are working',
    googleClientId: process.env.GOOGLE_CLIENT_ID ? 'Present' : 'Missing',
    jwtSecret: process.env.JWT_SECRET ? 'Present' : 'Missing'
  });
});

// Google OAuth route
router.post('/google', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ error: 'Google token is required' });
    }

    console.log('🔍 Starting Google OAuth verification...');
    console.log('🔑 Using Google Client ID:', process.env.GOOGLE_CLIENT_ID);

    // Verify the Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const { email, name, picture, sub: googleId } = payload;

    console.log('✅ Google OAuth payload:', { email, name, googleId });

    // Check if user exists
    let user = await User.findOne({ 
      where: { email },
      attributes: ['id', 'email', 'profile', 'credits', 'googleId', 'password']
    });

    if (user) {
      console.log('👤 Existing user found:', user.email);
      // User exists - update Google ID if not set
      if (!user.googleId) {
        console.log('🔄 Updating user with Google ID...');
        await user.update({ googleId });
      }
    } else {
      console.log('🆕 Creating new user for:', email);
      // Create new user
      user = await User.create({
        email,
        googleId,
        profile: { 
          name,
          picture: picture || null
        },
        credits: 100 // Starting credits for new users
      });
      console.log('✅ New user created:', user.id);
    }

    // Generate JWT token
    const jwtToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('🎫 JWT token generated for user:', user.id);

    res.json({
      token: jwtToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.profile?.name,
        picture: user.profile?.picture,
        credits: user.credits
      }
    });

  } catch (error) {
    console.error('❌ Google OAuth error:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ error: 'Google authentication failed', details: error.message });
  }
});

module.exports = router; 