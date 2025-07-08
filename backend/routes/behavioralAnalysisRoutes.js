const express = require('express');
const router = express.Router();
const behavioralAnalysisService = require('../services/behavioralAnalysisService');
const auth = require('../middleware/auth');

/**
 * @route POST /api/behavioral-analysis/analyze
 * @desc Analyze user behavior patterns
 * @access Private
 */
router.post('/analyze', auth, async (req, res) => {
  try {
    const { userId, locationData } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        error: 'User ID is required',
        message: 'Please provide a user ID for behavioral analysis'
      });
    }

    console.log('🔍 Starting behavioral analysis for user:', userId);
    
    const analysis = await behavioralAnalysisService.analyzeUserBehavior(userId, locationData);
    
    res.json({
      success: true,
      message: 'Behavioral analysis completed successfully',
      analysis: analysis
    });
    
  } catch (error) {
    console.error('❌ Error in behavioral analysis route:', error);
    res.status(500).json({
      error: 'Behavioral analysis failed',
      message: 'An error occurred while analyzing user behavior',
      details: error.message
    });
  }
});

/**
 * @route GET /api/behavioral-analysis/user/:userId
 * @desc Get behavioral analysis for a specific user
 * @access Private
 */
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log('🔍 Getting behavioral analysis for user:', userId);
    
    const analysis = await behavioralAnalysisService.analyzeUserBehavior(userId);
    
    res.json({
      success: true,
      message: 'User behavioral analysis retrieved successfully',
      analysis: analysis
    });
    
  } catch (error) {
    console.error('❌ Error getting user behavioral analysis:', error);
    res.status(500).json({
      error: 'Failed to get user behavioral analysis',
      message: 'An error occurred while retrieving user behavior data',
      details: error.message
    });
  }
});

/**
 * @route GET /api/behavioral-analysis/stats
 * @desc Get behavioral analysis statistics
 * @access Private (Admin only)
 */
router.get('/stats', auth, async (req, res) => {
  try {
    const { timeRange = '7d' } = req.query;
    
    console.log('📊 Getting behavioral analysis stats for time range:', timeRange);
    
    const stats = await behavioralAnalysisService.getBehavioralStats(timeRange);
    
    res.json({
      success: true,
      message: 'Behavioral statistics retrieved successfully',
      stats: stats,
      timeRange: timeRange
    });
    
  } catch (error) {
    console.error('❌ Error getting behavioral stats:', error);
    res.status(500).json({
      error: 'Failed to get behavioral statistics',
      message: 'An error occurred while retrieving behavioral statistics',
      details: error.message
    });
  }
});

/**
 * @route GET /api/behavioral-analysis/suspicious-users
 * @desc Get list of suspicious users
 * @access Private (Admin only)
 */
router.get('/suspicious-users', auth, async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    
    console.log('🚨 Getting suspicious users list, limit:', limit);
    
    const suspiciousUsers = await behavioralAnalysisService.getSuspiciousUsers(parseInt(limit));
    
    res.json({
      success: true,
      message: 'Suspicious users list retrieved successfully',
      users: suspiciousUsers,
      count: suspiciousUsers.length
    });
    
  } catch (error) {
    console.error('❌ Error getting suspicious users:', error);
    res.status(500).json({
      error: 'Failed to get suspicious users',
      message: 'An error occurred while retrieving suspicious users list',
      details: error.message
    });
  }
});

/**
 * @route POST /api/behavioral-analysis/check-posting-patterns
 * @desc Check posting patterns for a user
 * @access Private
 */
router.post('/check-posting-patterns', auth, async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        error: 'User ID is required',
        message: 'Please provide a user ID to check posting patterns'
      });
    }

    console.log('📊 Checking posting patterns for user:', userId);
    
    const patterns = await behavioralAnalysisService.analyzePostingPatterns(userId);
    
    res.json({
      success: true,
      message: 'Posting patterns analyzed successfully',
      patterns: patterns
    });
    
  } catch (error) {
    console.error('❌ Error checking posting patterns:', error);
    res.status(500).json({
      error: 'Failed to check posting patterns',
      message: 'An error occurred while analyzing posting patterns',
      details: error.message
    });
  }
});

/**
 * @route POST /api/behavioral-analysis/detect-suspicious-activity
 * @desc Detect suspicious activity for a user
 * @access Private
 */
router.post('/detect-suspicious-activity', auth, async (req, res) => {
  try {
    const { userId, locationData } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        error: 'User ID is required',
        message: 'Please provide a user ID to detect suspicious activity'
      });
    }

    console.log('🚨 Detecting suspicious activity for user:', userId);
    
    const suspiciousActivity = await behavioralAnalysisService.detectSuspiciousActivity(userId, locationData);
    
    res.json({
      success: true,
      message: 'Suspicious activity detection completed',
      suspiciousActivity: suspiciousActivity
    });
    
  } catch (error) {
    console.error('❌ Error detecting suspicious activity:', error);
    res.status(500).json({
      error: 'Failed to detect suspicious activity',
      message: 'An error occurred while detecting suspicious activity',
      details: error.message
    });
  }
});

/**
 * @route POST /api/behavioral-analysis/calculate-score
 * @desc Calculate behavior score for a user
 * @access Private
 */
router.post('/calculate-score', auth, async (req, res) => {
  try {
    const { userId, analysis } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        error: 'User ID is required',
        message: 'Please provide a user ID to calculate behavior score'
      });
    }

    console.log('🎯 Calculating behavior score for user:', userId);
    
    const behaviorScore = await behavioralAnalysisService.calculateBehaviorScore(userId, analysis || {});
    
    res.json({
      success: true,
      message: 'Behavior score calculated successfully',
      behaviorScore: behaviorScore
    });
    
  } catch (error) {
    console.error('❌ Error calculating behavior score:', error);
    res.status(500).json({
      error: 'Failed to calculate behavior score',
      message: 'An error occurred while calculating behavior score',
      details: error.message
    });
  }
});

/**
 * @route GET /api/behavioral-analysis/user/:userId/patterns
 * @desc Get detailed posting patterns for a user
 * @access Private
 */
router.get('/user/:userId/patterns', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log('📈 Getting detailed patterns for user:', userId);
    
    const patterns = await behavioralAnalysisService.analyzePostingPatterns(userId);
    
    res.json({
      success: true,
      message: 'User patterns retrieved successfully',
      patterns: patterns
    });
    
  } catch (error) {
    console.error('❌ Error getting user patterns:', error);
    res.status(500).json({
      error: 'Failed to get user patterns',
      message: 'An error occurred while retrieving user patterns',
      details: error.message
    });
  }
});

/**
 * @route GET /api/behavioral-analysis/user/:userId/flags
 * @desc Get behavioral flags for a user
 * @access Private
 */
router.get('/user/:userId/flags', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log('🚩 Getting behavioral flags for user:', userId);
    
    const suspiciousActivity = await behavioralAnalysisService.detectSuspiciousActivity(userId);
    
    res.json({
      success: true,
      message: 'User behavioral flags retrieved successfully',
      flags: suspiciousActivity.flags,
      count: suspiciousActivity.flags.length
    });
    
  } catch (error) {
    console.error('❌ Error getting user flags:', error);
    res.status(500).json({
      error: 'Failed to get user flags',
      message: 'An error occurred while retrieving user behavioral flags',
      details: error.message
    });
  }
});

/**
 * @route GET /api/behavioral-analysis/user/:userId/recommendations
 * @desc Get behavioral recommendations for a user
 * @access Private
 */
router.get('/user/:userId/recommendations', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log('💡 Getting behavioral recommendations for user:', userId);
    
    const analysis = await behavioralAnalysisService.analyzeUserBehavior(userId);
    
    res.json({
      success: true,
      message: 'User behavioral recommendations retrieved successfully',
      recommendations: analysis.recommendations,
      riskLevel: analysis.riskLevel,
      riskScore: analysis.riskScore
    });
    
  } catch (error) {
    console.error('❌ Error getting user recommendations:', error);
    res.status(500).json({
      error: 'Failed to get user recommendations',
      message: 'An error occurred while retrieving user behavioral recommendations',
      details: error.message
    });
  }
});

/**
 * @route POST /api/behavioral-analysis/update-thresholds
 * @desc Update behavioral analysis thresholds
 * @access Private (Admin only)
 */
router.post('/update-thresholds', auth, async (req, res) => {
  try {
    const { thresholds } = req.body;
    
    if (!thresholds) {
      return res.status(400).json({
        error: 'Thresholds are required',
        message: 'Please provide threshold values to update'
      });
    }

    console.log('⚙️ Updating behavioral analysis thresholds:', thresholds);
    
    // Update thresholds in the service
    Object.assign(behavioralAnalysisService.thresholds, thresholds);
    
    res.json({
      success: true,
      message: 'Behavioral analysis thresholds updated successfully',
      thresholds: behavioralAnalysisService.thresholds
    });
    
  } catch (error) {
    console.error('❌ Error updating thresholds:', error);
    res.status(500).json({
      error: 'Failed to update thresholds',
      message: 'An error occurred while updating behavioral analysis thresholds',
      details: error.message
    });
  }
});

/**
 * @route GET /api/behavioral-analysis/thresholds
 * @desc Get current behavioral analysis thresholds
 * @access Private (Admin only)
 */
router.get('/thresholds', auth, async (req, res) => {
  try {
    console.log('⚙️ Getting current behavioral analysis thresholds');
    
    res.json({
      success: true,
      message: 'Behavioral analysis thresholds retrieved successfully',
      thresholds: behavioralAnalysisService.thresholds
    });
    
  } catch (error) {
    console.error('❌ Error getting thresholds:', error);
    res.status(500).json({
      error: 'Failed to get thresholds',
      message: 'An error occurred while retrieving behavioral analysis thresholds',
      details: error.message
    });
  }
});

module.exports = router; 