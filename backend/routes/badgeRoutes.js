const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const User = require('../models/User');
const Location = require('../models/Location');

// Check and award badges
const checkAndAwardBadges = async (userId) => {
  const user = await User.findByPk(userId);
  const locations = await Location.findAll({ where: { creatorId: userId }});
  const verifiedLocations = locations.filter(l => l.verificationStatus === 'verified');
  
  const currentBadges = user.badges || [];
  const newBadges = [];

  // First Contribution Badge
  if (locations.length >= 1 && !currentBadges.find(b => b.id === 'first_contribution')) {
    newBadges.push({
      id: 'first_contribution',
      name: 'First Contribution',
      description: 'Posted your first location',
      color: '#4CAF50'
    });
  }

  // Verified Contributor Badge
  if (verifiedLocations.length >= 5 && !currentBadges.find(b => b.id === 'verified_contributor')) {
    newBadges.push({
      id: 'verified_contributor',
      name: 'Verified Contributor',
      description: 'Have 5 verified locations',
      color: '#2196F3'
    });
  }

  // Explorer Badge
  if (locations.length >= 10 && !currentBadges.find(b => b.id === 'explorer')) {
    newBadges.push({
      id: 'explorer',
      name: 'Explorer',
      description: 'Posted 10 locations',
      color: '#FFC107'
    });
  }

  if (newBadges.length > 0) {
    user.badges = [...currentBadges, ...newBadges];
    await user.save();
  }

  return newBadges;
};

// Get user badges
router.get('/user/badges', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.userId);
    res.json({ badges: user.badges || [] });
  } catch (error) {
    console.error('Error fetching badges:', error);
    res.status(500).json({ error: 'Error fetching badges' });
  }
});

// Check for new badges
router.post('/check-badges', authenticateToken, async (req, res) => {
  try {
    const newBadges = await checkAndAwardBadges(req.user.userId);
    res.json({ newBadges });
  } catch (error) {
    console.error('Error checking badges:', error);
    res.status(500).json({ error: 'Error checking badges' });
  }
});

module.exports = {
  router,
  checkAndAwardBadges // Export for use in other routes
}; 