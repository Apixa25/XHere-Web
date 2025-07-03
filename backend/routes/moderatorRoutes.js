const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const ModeratorService = require('../services/moderatorService');

/**
 * Middleware to check moderator privileges
 */
const requireModerator = async (req, res, next) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Moderator privileges required'
      });
    }
    next();
  } catch (error) {
    console.error('Moderator privilege check error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking moderator privileges'
    });
  }
};

/**
 * @route GET /api/moderator/review-queue
 * @desc Get pending locations for review
 * @access Moderator only
 */
router.get('/review-queue', 
  authenticateToken, 
  requireModerator,
  async (req, res) => {
    try {
      const { limit = 20, offset = 0, locationType } = req.query;
      
      const reviewQueue = await ModeratorService.getReviewQueue({
        limit: parseInt(limit),
        offset: parseInt(offset),
        locationType
      });
      
      res.json({
        success: true,
        ...reviewQueue
      });
    } catch (error) {
      console.error('Error getting review queue:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

/**
 * @route POST /api/moderator/approve/:locationId
 * @desc Approve a pending location
 * @access Moderator only
 */
router.post('/approve/:locationId',
  authenticateToken,
  requireModerator,
  async (req, res) => {
    try {
      const { locationId } = req.params;
      const { reason = 'Approved by moderator' } = req.body;
      
      const result = await ModeratorService.moderateLocation(
        locationId,
        req.user.id,
        'approve',
        reason
      );
      
      res.json({
        success: true,
        message: 'Location approved successfully',
        ...result
      });
    } catch (error) {
      console.error('Error approving location:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
);

/**
 * @route POST /api/moderator/reject/:locationId
 * @desc Reject a pending location
 * @access Moderator only
 */
router.post('/reject/:locationId',
  authenticateToken,
  requireModerator,
  async (req, res) => {
    try {
      const { locationId } = req.params;
      const { reason } = req.body;
      
      if (!reason) {
        return res.status(400).json({
          success: false,
          message: 'Rejection reason is required'
        });
      }
      
      const result = await ModeratorService.moderateLocation(
        locationId,
        req.user.id,
        'reject',
        reason
      );
      
      res.json({
        success: true,
        message: 'Location rejected successfully',
        ...result
      });
    } catch (error) {
      console.error('Error rejecting location:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
);

/**
 * @route POST /api/moderator/bulk-moderate
 * @desc Bulk approve or reject multiple locations
 * @access Moderator only
 */
router.post('/bulk-moderate',
  authenticateToken,
  requireModerator,
  async (req, res) => {
    try {
      const { locationIds, action, reason = '' } = req.body;
      
      if (!locationIds || !Array.isArray(locationIds) || locationIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Location IDs array is required'
        });
      }
      
      if (!['approve', 'reject'].includes(action)) {
        return res.status(400).json({
          success: false,
          message: 'Action must be "approve" or "reject"'
        });
      }
      
      const result = await ModeratorService.bulkModerate(
        locationIds,
        req.user.id,
        action,
        reason
      );
      
      res.json({
        success: true,
        message: `Bulk ${action} completed`,
        ...result
      });
    } catch (error) {
      console.error('Error in bulk moderation:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
);

/**
 * @route GET /api/moderator/stats
 * @desc Get moderation statistics
 * @access Moderator only
 */
router.get('/stats',
  authenticateToken,
  requireModerator,
  async (req, res) => {
    try {
      const stats = await ModeratorService.getModerationStats();
      
      res.json({
        success: true,
        stats
      });
    } catch (error) {
      console.error('Error getting moderation stats:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

/**
 * @route GET /api/moderator/locations-by-trust/:trustLevel
 * @desc Get locations by trust level for analysis
 * @access Moderator only
 */
router.get('/locations-by-trust/:trustLevel',
  authenticateToken,
  requireModerator,
  async (req, res) => {
    try {
      const { trustLevel } = req.params;
      
      const locations = await ModeratorService.getLocationsByTrustLevel(trustLevel);
      
      res.json({
        success: true,
        trustLevel,
        locations,
        count: locations.length
      });
    } catch (error) {
      console.error('Error getting locations by trust level:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

/**
 * @route GET /api/moderator/pending-locations
 * @desc Get pending locations with filters
 * @access Moderator only
 */
router.get('/pending-locations',
  authenticateToken,
  requireModerator,
  async (req, res) => {
    try {
      const { limit = 50, offset = 0, locationType } = req.query;
      
      const pendingLocations = await ModeratorService.getPendingLocations({
        limit: parseInt(limit),
        offset: parseInt(offset),
        locationType
      });
      
      res.json({
        success: true,
        pendingLocations,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          count: pendingLocations.length
        }
      });
    } catch (error) {
      console.error('Error getting pending locations:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

module.exports = router; 