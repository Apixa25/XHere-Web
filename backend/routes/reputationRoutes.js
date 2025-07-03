const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const ReputationService = require('../services/reputationService');

// Get user's reputation dashboard
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    // First, check if user's reputation needs to be updated
    const user = await require('../models/User').findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update reputation if it hasn't been calculated recently (older than 1 hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    if (!user.lastReputationUpdate || user.lastReputationUpdate < oneHourAgo) {
      console.log(`Updating reputation for user ${req.user.id} - last update was ${user.lastReputationUpdate}`);
      await ReputationService.updateUserReputation(req.user.id);
    }

    const dashboardData = await ReputationService.getReputationDashboard(req.user.id);
    res.json(dashboardData);
  } catch (error) {
    console.error('Error getting reputation dashboard:', error);
    res.status(500).json({ 
      error: 'Failed to get reputation dashboard',
      details: error.message 
    });
  }
});

// Update user's reputation (can be called after location creation/voting)
router.post('/update', authenticateToken, async (req, res) => {
  try {
    const reputationData = await ReputationService.updateUserReputation(req.user.id);
    res.json(reputationData);
  } catch (error) {
    console.error('Error updating reputation:', error);
    res.status(500).json({ 
      error: 'Failed to update reputation',
      details: error.message 
    });
  }
});

// Check if user can post a location
router.post('/can-post', authenticateToken, async (req, res) => {
  try {
    const { locationType = 'general' } = req.body;
    const postingCheck = await ReputationService.canUserPostLocation(req.user.id, locationType);
    res.json(postingCheck);
  } catch (error) {
    console.error('Error checking posting permissions:', error);
    res.status(500).json({ 
      error: 'Failed to check posting permissions',
      details: error.message 
    });
  }
});

// Get trust level information
router.get('/trust-levels', authenticateToken, async (req, res) => {
  try {
    res.json(ReputationService.TRUST_LEVELS);
  } catch (error) {
    console.error('Error getting trust levels:', error);
    res.status(500).json({ 
      error: 'Failed to get trust levels',
      details: error.message 
    });
  }
});

// Get user's current reputation details
router.get('/current', authenticateToken, async (req, res) => {
  try {
    const user = await require('../models/User').findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const trustLevel = user.trustLevel;
    const restrictions = ReputationService.TRUST_LEVELS[trustLevel.toUpperCase()].postingRestrictions;

    res.json({
      reputationScore: user.reputationScore,
      trustLevel: user.trustLevel,
      qualityLocationsCount: user.qualityLocationsCount,
      totalLocationsCount: user.totalLocationsCount,
      averageLocationRating: user.averageLocationRating,
      postingRestrictions: restrictions,
      lastReputationUpdate: user.lastReputationUpdate
    });
  } catch (error) {
    console.error('Error getting current reputation:', error);
    res.status(500).json({ 
      error: 'Failed to get current reputation',
      details: error.message 
    });
  }
});

// Admin route to update all user reputations
router.post('/admin/update-all', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    const user = await require('../models/User').findByPk(req.user.id);
    if (!user?.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Start the update process (this can be long-running)
    ReputationService.updateAllUserReputations()
      .then(() => {
        console.log('Background reputation update completed');
      })
      .catch((error) => {
        console.error('Background reputation update failed:', error);
      });

    res.json({ message: 'Reputation update process started' });
  } catch (error) {
    console.error('Error starting reputation update:', error);
    res.status(500).json({ 
      error: 'Failed to start reputation update',
      details: error.message 
    });
  }
});

module.exports = router; 