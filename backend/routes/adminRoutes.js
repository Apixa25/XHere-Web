const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const User = require('../models/User');
const Location = require('../models/Location');
const { Sequelize, Op } = require('sequelize');
const sequelize = require('../config/database');
const cleanupService = require('../services/cleanupService');
const locationStatusService = require('../services/locationStatusService');

// Admin middleware
const adminAuth = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user?.isAdmin) {
      return res.status(403).json({ error: 'Admin access denied' });
    }
    next();
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Get all users with location counts
router.get('/users', authenticateToken, adminAuth, async (req, res) => {
  try {
    // Debug log
    console.log('Fetching users with location counts...');

    const users = await User.findAll({
      attributes: [
        'id',
        'email',
        'profile',
        'isAdmin',
        'credits',
        'createdAt',
        [
          sequelize.literal(`(
            SELECT COALESCE(COUNT(*), 0)
            FROM "Locations"
            WHERE "Locations"."creatorId" = "User"."id"
          )`),
          'locationCount'
        ]
      ],
      order: [['createdAt', 'DESC']]
    });

    // Debug log
    console.log(`Found ${users.length} users`);

    res.json(users);
  } catch (error) {
    console.error('Error in /admin/users:', error);
    res.status(500).json({ 
      error: 'Error fetching users',
      details: error.message 
    });
  }
});

// Delete user and their content
router.delete('/users/:userId', authenticateToken, adminAuth, async (req, res) => {
  const transaction = await User.sequelize.transaction();
  
  try {
    const userToDelete = await User.findByPk(req.params.userId);
    
    if (!userToDelete) {
      await transaction.rollback();
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent deleting yourself
    if (userToDelete.id === req.user.id) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Cannot delete your own admin account' });
    }

    console.log(`Starting deletion process for user: ${req.params.userId}`);

    // Delete all credit transactions for the user
    const CreditTransaction = require('../models/CreditTransaction');
    await CreditTransaction.destroy({
      where: { userId: req.params.userId },
      transaction
    });
    console.log('Deleted credit transactions');

    // Delete user credit stats
    const UserCreditStats = require('../models/UserCreditStats');
    await UserCreditStats.destroy({
      where: { userId: req.params.userId },
      transaction
    });
    console.log('Deleted user credit stats');

    // Delete user badges
    const UserBadge = require('../models/UserBadge');
    await UserBadge.destroy({
      where: { userId: req.params.userId },
      transaction
    });
    console.log('Deleted user badges');

    // Delete location comments by the user
    const LocationComment = require('../models/LocationComment');
    await LocationComment.destroy({
      where: { authorId: req.params.userId },
      transaction
    });
    console.log('Deleted user comments');

    // Delete messages sent by the user
    const Message = require('../models/Message');
    await Message.destroy({
      where: { senderId: req.params.userId },
      transaction
    });
    console.log('Deleted sent messages');

    // Delete messages received by the user
    await Message.destroy({
      where: { recipientId: req.params.userId },
      transaction
    });
    console.log('Deleted received messages');

    // Delete nomination votes by the user
    const NominationVote = require('../models/NominationVote');
    await NominationVote.destroy({
      where: { voterId: req.params.userId },
      transaction
    });
    console.log('Deleted nomination votes');

    // Delete location nominations by the user
    const LocationNomination = require('../models/LocationNomination');
    await LocationNomination.destroy({
      where: { nominatorId: req.params.userId },
      transaction
    });
    console.log('Deleted location nominations');

    // Delete location ownership records for locations created by this user
    const LocationOwnership = require('../models/LocationOwnership');
    const userLocations = await Location.findAll({
      where: { creatorId: req.params.userId },
      attributes: ['id']
    });
    
    if (userLocations.length > 0) {
      const locationIds = userLocations.map(loc => loc.id);
      await LocationOwnership.destroy({
        where: { locationId: locationIds },
        transaction
      });
      console.log(`Deleted location ownership records for ${locationIds.length} locations`);
    }

    // Delete location ownership records where user is the owner
    await LocationOwnership.destroy({
      where: { ownerId: req.params.userId },
      transaction
    });
    console.log('Deleted user-owned location ownership records');

    // Delete location ownership history for locations created by this user
    const LocationOwnershipHistory = require('../models/LocationOwnershipHistory');
    if (userLocations.length > 0) {
      const locationIds = userLocations.map(loc => loc.id);
      await LocationOwnershipHistory.destroy({
        where: { locationId: locationIds },
        transaction
      });
      console.log(`Deleted location ownership history for ${locationIds.length} locations`);
    }

    // Delete location ownership history where user is the buyer
    await LocationOwnershipHistory.destroy({
      where: { buyerId: req.params.userId },
      transaction
    });
    console.log('Deleted user purchase history');

    // Delete all locations created by the user
    await Location.destroy({
      where: { creatorId: req.params.userId },
      transaction
    });
    console.log('Deleted user locations');

    // Delete all locations where user is the official owner
    await Location.destroy({
      where: { officialOwnerId: req.params.userId },
      transaction
    });
    console.log('Deleted official locations');

    // Delete the user
    await userToDelete.destroy({ transaction });
    console.log('Deleted user');

    await transaction.commit();
    
    console.log(`User ${req.params.userId} and their content deleted successfully`);
    res.json({ message: 'User and associated content deleted successfully' });
  } catch (error) {
    await transaction.rollback();
    console.error('Error deleting user:', error);
    res.status(500).json({ 
      error: 'Error deleting user',
      details: error.message 
    });
  }
});

// Search content
router.get('/search', authenticateToken, adminAuth, async (req, res) => {
  try {
    const { query, type } = req.query;
    let results = [];

    switch (type) {
      case 'locations':
        results = await Location.findAll({
          where: {
            [Op.or]: [
              Sequelize.literal(`CAST("content"->>'text' AS TEXT) ILIKE '%${query}%'`)
            ]
          },
          include: [{
            model: User,
            as: 'creator',
            attributes: ['email', 'profile']
          }],
          order: [['createdAt', 'DESC']]
        });
        break;

      case 'users':
        results = await User.findAll({
          where: {
            [Op.or]: [
              { email: { [Op.iLike]: `%${query}%` } },
              Sequelize.literal(`CAST("profile"->>'name' AS TEXT) ILIKE '%${query}%'`)
            ]
          },
          attributes: [
            'id',
            'email',
            'profile',
            'isAdmin',
            'credits',
            'createdAt',
            [
              sequelize.literal(`(
                SELECT COALESCE(COUNT(*), 0)
                FROM "Locations"
                WHERE "Locations"."creatorId" = "User"."id"
              )`),
              'locationCount'
            ]
          ],
          order: [['createdAt', 'DESC']]
        });
        break;
    }

    console.log('Search results:', results);
    res.json(results);
  } catch (error) {
    console.error('Backend search error:', error);
    res.status(500).json({ error: error.message || 'Error performing search' });
  }
});

// Add this route for deleting locations
router.delete('/locations/:locationId', authenticateToken, adminAuth, async (req, res) => {
  try {
    const { locationId } = req.params;
    
    const location = await Location.findByPk(locationId);
    
    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }

    await location.destroy();
    
    res.json({ message: 'Location deleted successfully' });
  } catch (error) {
    console.error('Error deleting location:', error);
    res.status(500).json({ error: 'Failed to delete location' });
  }
});

// Add this new route alongside your existing routes
router.put('/locations/:locationId', authenticateToken, adminAuth, async (req, res) => {
  try {
    const { locationId } = req.params;
    const { content } = req.body;

    console.log('Updating location:', locationId);
    console.log('Received content:', content);

    const location = await Location.findByPk(locationId);
    
    if (!location) {
      console.log('Location not found:', locationId);
      return res.status(404).json({ error: 'Location not found' });
    }

    // Ensure we preserve the existing location data structure
    const updatedLocation = {
      content: {
        text: content.text,
        mediaUrls: content.mediaUrls || location.content?.mediaUrls || [],
        mediaTypes: content.mediaTypes || location.content?.mediaTypes || [],
        isAnonymous: content.isAnonymous || location.content?.isAnonymous || false
      }
    };

    console.log('Saving updated location:', updatedLocation);

    // Update the location
    await location.update(updatedLocation);

    // Fetch the fresh location data with associations
    const refreshedLocation = await Location.findByPk(locationId, {
      include: [{
        model: User,
        as: 'creator',
        attributes: ['email', 'profile']
      }]
    });

    console.log('Location updated successfully');
    res.json(refreshedLocation);
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({ 
      error: 'Failed to update location', 
      details: error.message 
    });
  }
});

// Add this new route to get user locations
router.get('/user-locations/:userId', authenticateToken, adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const locations = await Location.findAll({
      where: { creatorId: userId },
      order: [['createdAt', 'DESC']],
      include: [{
        model: User,
        as: 'creator',
        attributes: ['email', 'profile']
      }]
    });

    res.json(locations);
  } catch (error) {
    console.error('Error fetching user locations:', error);
    res.status(500).json({ error: 'Failed to fetch user locations' });
  }
});

// Add this new route to handle media deletion
router.delete('/locations/:locationId/media/:mediaIndex', authenticateToken, adminAuth, async (req, res) => {
  try {
    const { locationId, mediaIndex } = req.params;
    console.log('Deleting media:', { locationId, mediaIndex });

    const location = await Location.findByPk(locationId);
    
    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }

    // Get current content
    const content = location.content || {};
    const mediaUrls = content.mediaUrls || [];
    const mediaTypes = content.mediaTypes || [];

    // Validate media index
    if (mediaIndex >= mediaUrls.length) {
      return res.status(400).json({ error: 'Invalid media index' });
    }

    // Remove the media from arrays
    const updatedMediaUrls = mediaUrls.filter((_, index) => index !== parseInt(mediaIndex));
    const updatedMediaTypes = mediaTypes.filter((_, index) => index !== parseInt(mediaIndex));

    // Update location with new content
    const updatedContent = {
      ...content,
      mediaUrls: updatedMediaUrls,
      mediaTypes: updatedMediaTypes
    };

    location.content = updatedContent;
    await location.save();

    console.log('Media deleted successfully');
    
    // Return updated location
    const updatedLocation = await Location.findByPk(locationId, {
      include: [{
        model: User,
        as: 'creator',
        attributes: ['email', 'profile']
      }]
    });

    res.json(updatedLocation);
  } catch (error) {
    console.error('Error deleting media:', error);
    res.status(500).json({ error: 'Failed to delete media' });
  }
});

// Cleanup routes
router.get('/cleanup/stats', authenticateToken, adminAuth, async (req, res) => {
  try {
    const stats = await cleanupService.getCleanupStats();
    res.json(stats);
  } catch (error) {
    console.error('Error getting cleanup stats:', error);
    res.status(500).json({ error: 'Failed to get cleanup stats' });
  }
});

// Enhanced cleanup statistics with detailed information
router.get('/cleanup/detailed-stats', authenticateToken, adminAuth, async (req, res) => {
  try {
    const stats = await cleanupService.getDetailedCleanupStats();
    res.json(stats);
  } catch (error) {
    console.error('Error getting detailed cleanup stats:', error);
    res.status(500).json({ error: 'Failed to get detailed cleanup stats' });
  }
});

// Get cleanup history
router.get('/cleanup/history', authenticateToken, adminAuth, async (req, res) => {
  try {
    const history = cleanupService.getCleanupHistory();
    res.json(history);
  } catch (error) {
    console.error('Error getting cleanup history:', error);
    res.status(500).json({ error: 'Failed to get cleanup history' });
  }
});

router.post('/cleanup/general', authenticateToken, adminAuth, async (req, res) => {
  try {
    const result = await cleanupService.cleanupExpiredGeneralLocations();
    res.json({
      success: true,
      message: 'General locations cleanup completed',
      result
    });
  } catch (error) {
    console.error('Error during general cleanup:', error);
    res.status(500).json({ error: 'Failed to perform general cleanup' });
  }
});

router.post('/cleanup/all', authenticateToken, adminAuth, async (req, res) => {
  try {
    const result = await cleanupService.cleanupAllExpiredLocations();
    res.json({
      success: true,
      message: 'All locations cleanup completed',
      result
    });
  } catch (error) {
    console.error('Error during all locations cleanup:', error);
    res.status(500).json({ error: 'Failed to perform all locations cleanup' });
  }
});

// Location Status Management Routes

// Get location status statistics
router.get('/location-status/stats', authenticateToken, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const stats = await locationStatusService.getStatusStats();
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error getting location status stats:', error);
    res.status(500).json({ error: 'Error getting status statistics' });
  }
});

// Get locations by status
router.get('/location-status/:status', authenticateToken, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { status } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const locations = await locationStatusService.getLocationsByStatus(status, {
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      locations,
      count: locations.length
    });
  } catch (error) {
    console.error('Error getting locations by status:', error);
    res.status(500).json({ error: 'Error getting locations by status' });
  }
});

// Manually update location status
router.put('/location-status/:locationId', authenticateToken, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { locationId } = req.params;
    const { status, reason } = req.body;

    if (!status || !['pending', 'verified', 'flagged', 'removed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const result = await locationStatusService.manuallyUpdateStatus(
      locationId, 
      status, 
      reason || 'Manual admin update'
    );

    res.json({
      success: true,
      message: 'Location status updated successfully',
      location: result.location,
      previousStatus: result.previousStatus,
      newStatus: result.newStatus,
      reason: result.reason
    });
  } catch (error) {
    console.error('Error updating location status:', error);
    res.status(500).json({ error: 'Error updating location status' });
  }
});

// Bulk update location statuses based on ratings
router.post('/location-status/bulk-update', authenticateToken, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { locationIds } = req.body;

    if (!Array.isArray(locationIds)) {
      return res.status(400).json({ error: 'locationIds must be an array' });
    }

    const results = [];
    const errors = [];

    for (const locationId of locationIds) {
      try {
        const result = await locationStatusService.updateLocationStatus(locationId);
        results.push(result);
      } catch (error) {
        errors.push({ locationId, error: error.message });
      }
    }

    res.json({
      success: true,
      message: `Processed ${locationIds.length} locations`,
      results,
      errors,
      summary: {
        total: locationIds.length,
        successful: results.length,
        failed: errors.length
      }
    });
  } catch (error) {
    console.error('Error bulk updating location statuses:', error);
    res.status(500).json({ error: 'Error bulk updating location statuses' });
  }
});

// Get rating analytics
router.get('/rating-analytics', authenticateToken, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { days = 30 } = req.query;
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days));

    // Get locations created in the last N days
    const recentLocations = await Location.findAll({
      where: {
        createdAt: {
          [sequelize.Op.gte]: daysAgo
        }
      },
      attributes: [
        'id',
        'locationType',
        'locationStatus',
        'upvotes',
        'downvotes',
        'totalPoints',
        'createdAt',
        'statusUpdatedAt'
      ],
      order: [['createdAt', 'DESC']]
    });

    // Calculate analytics
    const analytics = {
      totalLocations: recentLocations.length,
      byStatus: {
        pending: 0,
        verified: 0,
        flagged: 0,
        removed: 0
      },
      byType: {},
      ratingDistribution: {
        highRated: 0, // 5+ upvotes
        lowRated: 0,  // 5+ downvotes
        neutral: 0    // neither
      },
      averageRatings: {
        upvotes: 0,
        downvotes: 0,
        totalPoints: 0
      }
    };

    let totalUpvotes = 0;
    let totalDownvotes = 0;
    let totalPoints = 0;

    recentLocations.forEach(location => {
      // Count by status
      analytics.byStatus[location.locationStatus]++;
      
      // Count by type
      if (!analytics.byType[location.locationType]) {
        analytics.byType[location.locationType] = 0;
      }
      analytics.byType[location.locationType]++;

      // Rating distribution
      if (location.upvotes >= 5) {
        analytics.ratingDistribution.highRated++;
      } else if (location.downvotes >= 5) {
        analytics.ratingDistribution.lowRated++;
      } else {
        analytics.ratingDistribution.neutral++;
      }

      // Sum for averages
      totalUpvotes += location.upvotes || 0;
      totalDownvotes += location.downvotes || 0;
      totalPoints += location.totalPoints || 0;
    });

    // Calculate averages
    if (recentLocations.length > 0) {
      analytics.averageRatings.upvotes = (totalUpvotes / recentLocations.length).toFixed(2);
      analytics.averageRatings.downvotes = (totalDownvotes / recentLocations.length).toFixed(2);
      analytics.averageRatings.totalPoints = (totalPoints / recentLocations.length).toFixed(2);
    }

    res.json({
      success: true,
      analytics,
      timeRange: {
        days: parseInt(days),
        from: daysAgo,
        to: new Date()
      }
    });
  } catch (error) {
    console.error('Error getting rating analytics:', error);
    res.status(500).json({ error: 'Error getting rating analytics' });
  }
});

module.exports = router; 