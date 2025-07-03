const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const DownvoteTrackingService = require('../services/downvoteTrackingService');

// Get user's downvote statistics
router.get('/stats/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Users can only view their own stats, or admins can view any
    if (req.user.id !== userId && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const stats = await DownvoteTrackingService.getUserDownvoteStats(userId);
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error getting downvote stats:', error);
    res.status(500).json({ error: 'Error getting downvote statistics' });
  }
});

// Get user's posting permission based on penalty level
router.get('/posting-permission', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const permission = await DownvoteTrackingService.checkPostingPermission(userId);
    
    res.json({
      success: true,
      permission
    });
  } catch (error) {
    console.error('Error checking posting permission:', error);
    res.status(500).json({ error: 'Error checking posting permission' });
  }
});

// Admin routes for managing penalties
router.get('/admin/users-with-penalties', authenticateToken, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { limit = 50, offset = 0 } = req.query;
    const users = await DownvoteTrackingService.getUsersWithPenalties({
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    res.json({
      success: true,
      users,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        count: users.length
      }
    });
  } catch (error) {
    console.error('Error getting users with penalties:', error);
    res.status(500).json({ error: 'Error getting users with penalties' });
  }
});

// Admin route to manually adjust user penalty
router.post('/admin/adjust-penalty/:userId', authenticateToken, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { userId } = req.params;
    const { penaltyLevel, reason } = req.body;

    if (!penaltyLevel || !reason) {
      return res.status(400).json({ error: 'Penalty level and reason are required' });
    }

    const validLevels = ['none', 'warning', 'restricted', 'suspended', 'banned'];
    if (!validLevels.includes(penaltyLevel)) {
      return res.status(400).json({ error: 'Invalid penalty level' });
    }

    const result = await DownvoteTrackingService.manuallyAdjustPenalty(
      userId, 
      penaltyLevel, 
      reason
    );
    
    res.json({
      success: true,
      result
    });
  } catch (error) {
    console.error('Error adjusting penalty:', error);
    res.status(500).json({ error: 'Error adjusting penalty' });
  }
});

// Get penalty thresholds and restrictions
router.get('/penalty-thresholds', authenticateToken, async (req, res) => {
  try {
    const thresholds = DownvoteTrackingService.PENALTY_THRESHOLDS;
    
    res.json({
      success: true,
      thresholds
    });
  } catch (error) {
    console.error('Error getting penalty thresholds:', error);
    res.status(500).json({ error: 'Error getting penalty thresholds' });
  }
});

// Get user's downvote history
router.get('/history/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Users can only view their own history, or admins can view any
    if (req.user.id !== userId && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const stats = await DownvoteTrackingService.getUserDownvoteStats(userId);
    
    res.json({
      success: true,
      history: stats.downvotedLocations,
      downvoteHistory: stats.downvoteHistory || []
    });
  } catch (error) {
    console.error('Error getting downvote history:', error);
    res.status(500).json({ error: 'Error getting downvote history' });
  }
});

module.exports = router; 