const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const LeaderboardService = require('../services/leaderboardService');

// Get weekly leaderboard
router.get('/weekly', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const leaderboard = await LeaderboardService.getWeeklyLeaderboard(limit);
    
    res.json({
      success: true,
      data: leaderboard,
      category: 'Weekly Quality Contributors',
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting weekly leaderboard:', error);
    res.status(500).json({ 
      error: 'Failed to get weekly leaderboard',
      details: error.message 
    });
  }
});

// Get user's achievements
router.get('/achievements', authenticateToken, async (req, res) => {
  try {
    const achievements = await LeaderboardService.getUserAchievements(req.user.id);
    
    res.json({
      success: true,
      data: achievements
    });
  } catch (error) {
    console.error('Error getting user achievements:', error);
    res.status(500).json({ 
      error: 'Failed to get achievements',
      details: error.message 
    });
  }
});

// Get public profile for any user
router.get('/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const profile = await LeaderboardService.getPublicProfile(userId);
    
    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error('Error getting public profile:', error);
    res.status(500).json({ 
      error: 'Failed to get public profile',
      details: error.message 
    });
  }
});

// Get leaderboard categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await LeaderboardService.getLeaderboardCategories();
    
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error getting leaderboard categories:', error);
    res.status(500).json({ 
      error: 'Failed to get leaderboard categories',
      details: error.message 
    });
  }
});

// Get user's weekly rank
router.get('/rank', authenticateToken, async (req, res) => {
  try {
    const leaderboard = await LeaderboardService.getWeeklyLeaderboard(100);
    const userRank = leaderboard.find(u => u.userId === req.user.id);
    
    res.json({
      success: true,
      data: {
        rank: userRank?.rank || null,
        totalParticipants: leaderboard.length,
        score: userRank?.qualityScore || 0
      }
    });
  } catch (error) {
    console.error('Error getting user rank:', error);
    res.status(500).json({ 
      error: 'Failed to get user rank',
      details: error.message 
    });
  }
});

// Update weekly champion (admin only)
router.post('/update-champion', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    const User = require('../models/User');
    const user = await User.findByPk(req.user.id);
    
    if (!user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const champion = await LeaderboardService.updateWeeklyChampion();
    
    res.json({
      success: true,
      data: champion,
      message: 'Weekly champion updated successfully'
    });
  } catch (error) {
    console.error('Error updating weekly champion:', error);
    res.status(500).json({ 
      error: 'Failed to update weekly champion',
      details: error.message 
    });
  }
});

module.exports = router; 