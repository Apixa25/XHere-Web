const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const User = require('../models/User');
const Location = require('../models/Location');
const { checkAndAwardBadges } = require('../utils/badgeChecker');

// Debug middleware
router.use((req, res, next) => {
  console.log('Badge route hit:', req.method, req.path);
  next();
});

router.post('/check', authenticateToken, async (req, res) => {
  try {
    console.log('Check badges route hit for user:', req.user.userId);
    const user = await User.findByPk(req.user.userId);
    const locations = await Location.findAll({ 
      where: { creatorId: req.user.userId }
    });
    
    console.log('Badge check stats:', {
      totalLocations: locations.length,
      verifiedLocations: locations.filter(l => l.verificationStatus === 'verified').length,
      currentBadges: user.badges || []
    });
    
    const newBadges = await checkAndAwardBadges(req.user.userId);
    console.log('New badges awarded:', newBadges);
    
    res.json({ newBadges });
  } catch (error) {
    console.error('Error in check-badges:', error);
    res.status(500).json({ error: 'Error checking badges' });
  }
});

// Get user's current badges
router.get('/user/badges', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.userId);
    res.json({ badges: user.badges || [] });
  } catch (error) {
    console.error('Error fetching user badges:', error);
    res.status(500).json({ error: 'Error fetching badges' });
  }
});

module.exports = router; 