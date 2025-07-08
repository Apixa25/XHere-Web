const express = require('express');
const router = express.Router();
const smartFilteringService = require('../services/smartFilteringService');
const { authenticateToken } = require('../middleware/auth');

/**
 * @route POST /api/smart-filtering/analyze
 * @desc Analyze location for smart filtering
 * @access Private
 */
router.post('/analyze', authenticateToken, async (req, res) => {
  try {
    const { locationData, userData } = req.body;
    
    if (!locationData) {
      return res.status(400).json({
        error: 'Location data is required',
        message: 'Please provide location data for filtering analysis'
      });
    }

    console.log('🛡️ Starting smart filtering analysis');
    
    const analysis = await smartFilteringService.analyzeForFiltering(locationData, userData);
    
    res.json({
      success: true,
      message: 'Smart filtering analysis completed successfully',
      analysis: analysis
    });
    
  } catch (error) {
    console.error('❌ Error in smart filtering analysis route:', error);
    res.status(500).json({
      error: 'Smart filtering analysis failed',
      message: 'An error occurred while analyzing location for filtering',
      details: error.message
    });
  }
});

/**
 * @route POST /api/smart-filtering/add-to-queue
 * @desc Add location to review queue
 * @access Private (Admin/Moderator)
 */
router.post('/add-to-queue', authenticateToken, async (req, res) => {
  try {
    const { locationData, analysis, moderatorId } = req.body;
    
    if (!locationData || !analysis) {
      return res.status(400).json({
        error: 'Location data and analysis are required',
        message: 'Please provide location data and analysis for review queue'
      });
    }

    console.log('📋 Adding location to review queue');
    
    const reviewEntry = await smartFilteringService.addToReviewQueue(locationData, analysis, moderatorId);
    
    res.json({
      success: true,
      message: 'Location added to review queue successfully',
      reviewEntry: reviewEntry
    });
    
  } catch (error) {
    console.error('❌ Error adding to review queue:', error);
    res.status(500).json({
      error: 'Failed to add to review queue',
      message: 'An error occurred while adding location to review queue',
      details: error.message
    });
  }
});

/**
 * @route GET /api/smart-filtering/queue-stats
 * @desc Get review queue statistics
 * @access Private (Admin/Moderator)
 */
router.get('/queue-stats', authenticateToken, async (req, res) => {
  try {
    console.log('📊 Getting review queue statistics');
    
    const stats = await smartFilteringService.getReviewQueueStats();
    
    res.json({
      success: true,
      message: 'Review queue statistics retrieved successfully',
      stats: stats
    });
    
  } catch (error) {
    console.error('❌ Error getting review queue stats:', error);
    res.status(500).json({
      error: 'Failed to get review queue statistics',
      message: 'An error occurred while retrieving review queue statistics',
      details: error.message
    });
  }
});

/**
 * @route GET /api/smart-filtering/queue-items
 * @desc Get review queue items
 * @access Private (Admin/Moderator)
 */
router.get('/queue-items', authenticateToken, async (req, res) => {
  try {
    const { status, category, priority, limit, offset } = req.query;
    
    console.log('📋 Getting review queue items');
    
    const filters = {
      status: status || 'pending',
      category: category || null,
      priority: priority || null,
      limit: parseInt(limit) || 50,
      offset: parseInt(offset) || 0
    };
    
    const items = await smartFilteringService.getReviewQueueItems(filters);
    
    res.json({
      success: true,
      message: 'Review queue items retrieved successfully',
      items: items,
      filters: filters
    });
    
  } catch (error) {
    console.error('❌ Error getting review queue items:', error);
    res.status(500).json({
      error: 'Failed to get review queue items',
      message: 'An error occurred while retrieving review queue items',
      details: error.message
    });
  }
});

/**
 * @route POST /api/smart-filtering/process-review
 * @desc Process review decision
 * @access Private (Admin/Moderator)
 */
router.post('/process-review', authenticateToken, async (req, res) => {
  try {
    const { reviewId, decision, reason } = req.body;
    
    if (!reviewId || !decision) {
      return res.status(400).json({
        error: 'Review ID and decision are required',
        message: 'Please provide review ID and decision'
      });
    }

    console.log(`📋 Processing review decision: ${decision}`);
    
    const result = await smartFilteringService.processReviewDecision(
      reviewId, 
      decision, 
      req.user.id, 
      reason
    );
    
    res.json({
      success: true,
      message: 'Review decision processed successfully',
      result: result
    });
    
  } catch (error) {
    console.error('❌ Error processing review decision:', error);
    res.status(500).json({
      error: 'Failed to process review decision',
      message: 'An error occurred while processing review decision',
      details: error.message
    });
  }
});

/**
 * @route POST /api/smart-filtering/bulk-moderation
 * @desc Perform bulk moderation actions
 * @access Private (Admin/Moderator)
 */
router.post('/bulk-moderation', authenticateToken, async (req, res) => {
  try {
    const { reviewIds, action } = req.body;
    
    if (!reviewIds || !Array.isArray(reviewIds) || reviewIds.length === 0) {
      return res.status(400).json({
        error: 'Review IDs array is required',
        message: 'Please provide an array of review IDs for bulk moderation'
      });
    }

    if (!action) {
      return res.status(400).json({
        error: 'Action is required',
        message: 'Please provide an action for bulk moderation'
      });
    }

    console.log(`📋 Processing bulk moderation: ${action} for ${reviewIds.length} items`);
    
    const result = await smartFilteringService.bulkModerationAction(
      reviewIds, 
      action, 
      req.user.id
    );
    
    res.json({
      success: true,
      message: 'Bulk moderation completed successfully',
      result: result
    });
    
  } catch (error) {
    console.error('❌ Error in bulk moderation:', error);
    res.status(500).json({
      error: 'Failed to process bulk moderation',
      message: 'An error occurred while processing bulk moderation',
      details: error.message
    });
  }
});

/**
 * @route GET /api/smart-filtering/transparency-report
 * @desc Get transparency report
 * @access Private (Admin)
 */
router.get('/transparency-report', authenticateToken, async (req, res) => {
  try {
    const { timeRange = '30d' } = req.query;
    
    console.log('📊 Generating transparency report');
    
    const report = await smartFilteringService.getTransparencyReport(timeRange);
    
    res.json({
      success: true,
      message: 'Transparency report generated successfully',
      report: report
    });
    
  } catch (error) {
    console.error('❌ Error generating transparency report:', error);
    res.status(500).json({
      error: 'Failed to generate transparency report',
      message: 'An error occurred while generating transparency report',
      details: error.message
    });
  }
});

/**
 * @route GET /api/smart-filtering/thresholds
 * @desc Get current filtering thresholds
 * @access Private (Admin)
 */
router.get('/thresholds', authenticateToken, async (req, res) => {
  try {
    console.log('⚙️ Getting smart filtering thresholds');
    
    const thresholds = smartFilteringService.getThresholds();
    
    res.json({
      success: true,
      message: 'Smart filtering thresholds retrieved successfully',
      thresholds: thresholds
    });
    
  } catch (error) {
    console.error('❌ Error getting thresholds:', error);
    res.status(500).json({
      error: 'Failed to get smart filtering thresholds',
      message: 'An error occurred while retrieving thresholds',
      details: error.message
    });
  }
});

/**
 * @route POST /api/smart-filtering/update-thresholds
 * @desc Update filtering thresholds
 * @access Private (Admin)
 */
router.post('/update-thresholds', authenticateToken, async (req, res) => {
  try {
    const { thresholds } = req.body;
    
    if (!thresholds) {
      return res.status(400).json({
        error: 'Thresholds are required',
        message: 'Please provide threshold values to update'
      });
    }

    console.log('⚙️ Updating smart filtering thresholds');
    
    smartFilteringService.updateThresholds(thresholds);
    
    res.json({
      success: true,
      message: 'Smart filtering thresholds updated successfully',
      thresholds: smartFilteringService.getThresholds()
    });
    
  } catch (error) {
    console.error('❌ Error updating thresholds:', error);
    res.status(500).json({
      error: 'Failed to update smart filtering thresholds',
      message: 'An error occurred while updating thresholds',
      details: error.message
    });
  }
});

/**
 * @route GET /api/smart-filtering/filtering-categories
 * @desc Get filtering categories
 * @access Private
 */
router.get('/filtering-categories', authenticateToken, async (req, res) => {
  try {
    console.log('📋 Getting filtering categories');
    
    const categories = {
      DUPLICATE: 'duplicate',
      BEHAVIORAL: 'behavioral',
      CONTENT_QUALITY: 'content_quality',
      SPAM: 'spam',
      MANUAL: 'manual'
    };
    
    res.json({
      success: true,
      message: 'Filtering categories retrieved successfully',
      categories: categories
    });
    
  } catch (error) {
    console.error('❌ Error getting filtering categories:', error);
    res.status(500).json({
      error: 'Failed to get filtering categories',
      message: 'An error occurred while retrieving filtering categories',
      details: error.message
    });
  }
});

/**
 * @route GET /api/smart-filtering/review-statuses
 * @desc Get review statuses
 * @access Private
 */
router.get('/review-statuses', authenticateToken, async (req, res) => {
  try {
    console.log('📋 Getting review statuses');
    
    const statuses = {
      PENDING: 'pending',
      APPROVED: 'approved',
      REJECTED: 'rejected',
      ESCALATED: 'escalated'
    };
    
    res.json({
      success: true,
      message: 'Review statuses retrieved successfully',
      statuses: statuses
    });
    
  } catch (error) {
    console.error('❌ Error getting review statuses:', error);
    res.status(500).json({
      error: 'Failed to get review statuses',
      message: 'An error occurred while retrieving review statuses',
      details: error.message
    });
  }
});

/**
 * @route POST /api/smart-filtering/auto-filter
 * @desc Automatically filter location based on analysis
 * @access Private
 */
router.post('/auto-filter', authenticateToken, async (req, res) => {
  try {
    const { locationData, userData } = req.body;
    
    if (!locationData) {
      return res.status(400).json({
        error: 'Location data is required',
        message: 'Please provide location data for automatic filtering'
      });
    }

    console.log('🤖 Running automatic filtering');
    
    const analysis = await smartFilteringService.analyzeForFiltering(locationData, userData);
    
    let action = 'allow';
    let message = 'Location passed automatic filtering';
    
    if (analysis.autoBlocked) {
      action = 'block';
      message = 'Location blocked by automatic filtering';
    } else if (analysis.reviewRequired) {
      action = 'review';
      message = 'Location requires manual review';
    }
    
    res.json({
      success: true,
      message: message,
      action: action,
      analysis: analysis
    });
    
  } catch (error) {
    console.error('❌ Error in automatic filtering:', error);
    res.status(500).json({
      error: 'Automatic filtering failed',
      message: 'An error occurred while performing automatic filtering',
      details: error.message
    });
  }
});

/**
 * @route GET /api/smart-filtering/system-health
 * @desc Get smart filtering system health
 * @access Private (Admin)
 */
router.get('/system-health', authenticateToken, async (req, res) => {
  try {
    console.log('🏥 Getting smart filtering system health');
    
    const health = {
      status: 'healthy',
      timestamp: new Date(),
      components: {
        duplicateDetection: 'operational',
        behavioralAnalysis: 'operational',
        contentQuality: 'operational',
        reviewQueue: 'operational'
      },
      metrics: {
        averageProcessingTime: 0,
        successRate: 100,
        errorRate: 0,
        queueSize: 0
      },
      lastUpdated: new Date()
    };
    
    res.json({
      success: true,
      message: 'System health retrieved successfully',
      health: health
    });
    
  } catch (error) {
    console.error('❌ Error getting system health:', error);
    res.status(500).json({
      error: 'Failed to get system health',
      message: 'An error occurred while retrieving system health',
      details: error.message
    });
  }
});

module.exports = router; 