const Location = require('../models/Location');
const User = require('../models/User');
const { Op, fn, col } = require('sequelize');
const sequelize = require('../config/database');

class ModeratorService {
  /**
   * Get pending locations that require approval
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Pending locations
   */
  static async getPendingLocations(options = {}) {
    try {
      const { limit = 50, offset = 0, locationType } = options;
      
      const whereClause = {
        locationStatus: 'pending',
        requiresApproval: true
      };
      
      if (locationType) {
        whereClause.locationType = locationType;
      }
      
      const pendingLocations = await Location.findAll({
        where: whereClause,
        include: [{
          model: User,
          as: 'creator',
          attributes: ['id', 'email', 'profile', 'trustLevel', 'reputationScore']
        }],
        order: [['createdAt', 'ASC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
      
      return pendingLocations;
    } catch (error) {
      console.error('Error getting pending locations:', error);
      throw error;
    }
  }

  /**
   * Approve or reject a location
   * @param {string} locationId - Location ID
   * @param {string} moderatorId - Moderator user ID
   * @param {string} action - 'approve' or 'reject'
   * @param {string} reason - Reason for action
   * @returns {Promise<Object>} Result
   */
  static async moderateLocation(locationId, moderatorId, action, reason = '') {
    try {
      // Verify moderator permissions
      const moderator = await User.findByPk(moderatorId);
      if (!moderator || !moderator.isAdmin) {
        throw new Error('Moderator privileges required');
      }
      
      const location = await Location.findByPk(locationId);
      if (!location) {
        throw new Error('Location not found');
      }
      
      if (location.locationStatus !== 'pending') {
        throw new Error('Location is not pending approval');
      }
      
      const newStatus = action === 'approve' ? 'verified' : 'flagged';
      const statusReason = action === 'approve' ? 
        `Approved by moderator (${moderator.email})` : 
        `Rejected by moderator: ${reason}`;
      
      await location.update({
        locationStatus: newStatus,
        statusUpdatedAt: new Date(),
        statusReason
      });
      
      // Update creator's reputation if approved
      if (action === 'approve') {
        const creator = await User.findByPk(location.creatorId);
        if (creator) {
          // Small reputation boost for approved locations
          const newReputationScore = Math.min(creator.reputationScore + 5, 999999);
          await creator.update({
            reputationScore: newReputationScore
          });
        }
      }
      
      return {
        success: true,
        location,
        action,
        reason: statusReason,
        moderatedBy: moderator.email
      };
    } catch (error) {
      console.error('Error moderating location:', error);
      throw error;
    }
  }

  /**
   * Get moderation statistics
   * @returns {Promise<Object>} Moderation stats
   */
  static async getModerationStats() {
    try {
      const stats = await Location.findAll({
        attributes: [
          'locationStatus',
          [fn('COUNT', col('id')), 'count']
        ],
        group: ['locationStatus'],
        raw: true
      });
      
      const totalLocations = await Location.count();
      const pendingCount = await Location.count({
        where: {
          locationStatus: 'pending',
          requiresApproval: true
        }
      });
      
      return {
        totalLocations,
        pendingApproval: pendingCount,
        statusBreakdown: stats.reduce((acc, stat) => {
          acc[stat.locationStatus] = parseInt(stat.count);
          return acc;
        }, {})
      };
    } catch (error) {
      console.error('Error getting moderation stats:', error);
      throw error;
    }
  }

  /**
   * Get locations by trust level for analysis
   * @param {string} trustLevel - Trust level to filter by
   * @returns {Promise<Array>} Locations by trust level
   */
  static async getLocationsByTrustLevel(trustLevel) {
    try {
      const locations = await Location.findAll({
        include: [{
          model: User,
          as: 'creator',
          where: { trustLevel },
          attributes: ['id', 'email', 'profile', 'trustLevel', 'reputationScore']
        }],
        order: [['createdAt', 'DESC']],
        limit: 100
      });
      
      return locations;
    } catch (error) {
      console.error('Error getting locations by trust level:', error);
      throw error;
    }
  }

  /**
   * Bulk moderate locations
   * @param {Array} locationIds - Array of location IDs
   * @param {string} moderatorId - Moderator user ID
   * @param {string} action - 'approve' or 'reject'
   * @param {string} reason - Reason for action
   * @returns {Promise<Object>} Result
   */
  static async bulkModerate(locationIds, moderatorId, action, reason = '') {
    try {
      const results = [];
      const errors = [];
      
      for (const locationId of locationIds) {
        try {
          const result = await this.moderateLocation(locationId, moderatorId, action, reason);
          results.push(result);
        } catch (error) {
          errors.push({ locationId, error: error.message });
        }
      }
      
      return {
        success: true,
        processed: locationIds.length,
        successful: results.length,
        failed: errors.length,
        results,
        errors
      };
    } catch (error) {
      console.error('Error in bulk moderation:', error);
      throw error;
    }
  }

  /**
   * Get review queue for moderators
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Review queue data
   */
  static async getReviewQueue(options = {}) {
    try {
      const { limit = 20, offset = 0 } = options;
      
      const pendingLocations = await this.getPendingLocations({ limit, offset });
      const stats = await this.getModerationStats();
      
      return {
        pendingLocations,
        stats,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: stats.pendingApproval
        }
      };
    } catch (error) {
      console.error('Error getting review queue:', error);
      throw error;
    }
  }
}

module.exports = ModeratorService; 