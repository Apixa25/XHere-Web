const User = require('../models/User');
const Location = require('../models/Location');
const { Op } = require('sequelize');

class DownvoteTrackingService {
  // Penalty thresholds and configurations
  static PENALTY_THRESHOLDS = {
    WARNING: {
      totalDownvotes: 10,
      downvotedLocations: 3,
      duration: null, // No time limit
      restrictions: {
        maxLocationsPerDay: 2,
        requiresApproval: true,
        creditCost: 150
      }
    },
    RESTRICTED: {
      totalDownvotes: 25,
      downvotedLocations: 5,
      duration: 7 * 24 * 60 * 60 * 1000, // 7 days
      restrictions: {
        maxLocationsPerDay: 1,
        requiresApproval: true,
        creditCost: 200
      }
    },
    SUSPENDED: {
      totalDownvotes: 50,
      downvotedLocations: 10,
      duration: 30 * 24 * 60 * 60 * 1000, // 30 days
      restrictions: {
        maxLocationsPerDay: 0,
        requiresApproval: true,
        creditCost: 500
      }
    },
    BANNED: {
      totalDownvotes: 100,
      downvotedLocations: 20,
      duration: null, // Permanent until manual review
      restrictions: {
        maxLocationsPerDay: 0,
        requiresApproval: true,
        creditCost: 1000
      }
    }
  };

  /**
   * Update user's downvote statistics when a location receives a downvote
   * @param {string} userId - User ID who received the downvote
   * @param {string} locationId - Location ID that was downvoted
   * @param {Object} options - Options including transaction
   * @returns {Promise<Object>} Updated user stats and penalty info
   */
  static async recordDownvote(userId, locationId, options = {}) {
    try {
      const user = await User.findByPk(userId, { transaction: options.transaction });
      if (!user) {
        throw new Error('User not found');
      }

      const location = await Location.findByPk(locationId, { transaction: options.transaction });
      if (!location) {
        throw new Error('Location not found');
      }

      // Get current downvote stats for this location
      const currentDownvotes = location.downvotes || 0;
      const previousDownvotes = Math.max(0, currentDownvotes - 1); // Assuming this is a new downvote

      // Only update user stats if this is a new downvote (not a vote change)
      if (currentDownvotes > previousDownvotes) {
        // Update total downvotes received
        user.totalDownvotesReceived += 1;

        // Update downvoted locations count if this location wasn't previously downvoted
        if (previousDownvotes === 0) {
          user.downvotedLocationsCount += 1;
        }

        // Update last downvote date
        user.lastDownvoteDate = new Date();

        // Add to downvote history
        const historyEntry = {
          timestamp: new Date().toISOString(),
          locationId: locationId,
          locationType: location.locationType,
          downvotes: currentDownvotes,
          reason: 'Location received downvote',
          penaltyLevel: user.downvotePenaltyLevel
        };

        user.downvoteHistory = [...(user.downvoteHistory || []), historyEntry];

        // Check for penalty level changes
        const penaltyUpdate = await this.checkAndUpdatePenaltyLevel(user, options);

        await user.save({ transaction: options.transaction });

        return {
          user: await User.findByPk(userId, { transaction: options.transaction }),
          penaltyUpdate,
          stats: {
            totalDownvotesReceived: user.totalDownvotesReceived,
            downvotedLocationsCount: user.downvotedLocationsCount,
            currentPenaltyLevel: user.downvotePenaltyLevel
          }
        };
      }

      return {
        user: await User.findByPk(userId, { transaction: options.transaction }),
        penaltyUpdate: null,
        stats: {
          totalDownvotesReceived: user.totalDownvotesReceived,
          downvotedLocationsCount: user.downvotedLocationsCount,
          currentPenaltyLevel: user.downvotePenaltyLevel
        }
      };

    } catch (error) {
      console.error('Error recording downvote:', error);
      throw error;
    }
  }

  /**
   * Check and update user's penalty level based on downvote statistics
   * @param {Object} user - User object
   * @param {Object} options - Options including transaction
   * @returns {Promise<Object>} Penalty update information
   */
  static async checkAndUpdatePenaltyLevel(user, options = {}) {
    const totalDownvotes = user.totalDownvotesReceived || 0;
    const downvotedLocations = user.downvotedLocationsCount || 0;
    const currentPenalty = user.downvotePenaltyLevel || 'none';

    let newPenaltyLevel = 'none';
    let penaltyExpiresAt = null;
    let restrictions = {};

    // Check each penalty level in order
    for (const [level, config] of Object.entries(this.PENALTY_THRESHOLDS)) {
      const levelName = level.toLowerCase();
      
      if (totalDownvotes >= config.totalDownvotes && downvotedLocations >= config.downvotedLocations) {
        newPenaltyLevel = levelName;
        restrictions = config.restrictions;
        
        if (config.duration) {
          penaltyExpiresAt = new Date(Date.now() + config.duration);
        }
        break;
      }
    }

    // If penalty level changed, update user
    if (newPenaltyLevel !== currentPenalty) {
      user.downvotePenaltyLevel = newPenaltyLevel;
      user.penaltyExpiresAt = penaltyExpiresAt;

      // Add penalty change to history
      const penaltyEntry = {
        timestamp: new Date().toISOString(),
        previousLevel: currentPenalty,
        newLevel: newPenaltyLevel,
        reason: `Reached ${newPenaltyLevel} threshold (${totalDownvotes} total downvotes, ${downvotedLocations} downvoted locations)`,
        expiresAt: penaltyExpiresAt
      };

      user.downvoteHistory = [...(user.downvoteHistory || []), penaltyEntry];

      await user.save({ transaction: options.transaction });

      return {
        penaltyChanged: true,
        previousLevel: currentPenalty,
        newLevel: newPenaltyLevel,
        restrictions,
        expiresAt: penaltyExpiresAt,
        reason: penaltyEntry.reason
      };
    }

    return {
      penaltyChanged: false,
      currentLevel: currentPenalty,
      restrictions: this.getRestrictionsForLevel(currentPenalty)
    };
  }

  /**
   * Get posting restrictions for a penalty level
   * @param {string} penaltyLevel - Current penalty level
   * @returns {Object} Posting restrictions
   */
  static getRestrictionsForLevel(penaltyLevel) {
    const level = penaltyLevel.toUpperCase();
    return this.PENALTY_THRESHOLDS[level]?.restrictions || {
      maxLocationsPerDay: 10,
      requiresApproval: false,
      creditCost: 100
    };
  }

  /**
   * Check if user can post based on their penalty level
   * @param {string} userId - User ID
   * @param {Object} options - Options including transaction
   * @returns {Promise<Object>} Posting permission and restrictions
   */
  static async checkPostingPermission(userId, options = {}) {
    try {
      const user = await User.findByPk(userId, { transaction: options.transaction });
      if (!user) {
        throw new Error('User not found');
      }

      // Check if penalty has expired
      if (user.penaltyExpiresAt && new Date() > user.penaltyExpiresAt) {
        if (user.downvotePenaltyLevel !== 'none') {
          await this.clearExpiredPenalty(user, options);
        }
      }

      const restrictions = this.getRestrictionsForLevel(user.downvotePenaltyLevel);
      
      return {
        canPost: restrictions.maxLocationsPerDay > 0,
        restrictions,
        penaltyLevel: user.downvotePenaltyLevel,
        penaltyExpiresAt: user.penaltyExpiresAt
      };

    } catch (error) {
      console.error('Error checking posting permission:', error);
      throw error;
    }
  }

  /**
   * Clear expired penalty and reset user status
   * @param {Object} user - User object
   * @param {Object} options - Options including transaction
   * @returns {Promise<Object>} Updated user
   */
  static async clearExpiredPenalty(user, options = {}) {
    const previousLevel = user.downvotePenaltyLevel;
    
    user.downvotePenaltyLevel = 'none';
    user.penaltyExpiresAt = null;

    // Add penalty clearance to history
    const clearanceEntry = {
      timestamp: new Date().toISOString(),
      previousLevel: previousLevel,
      newLevel: 'none',
      reason: 'Penalty expired automatically',
      clearedAt: new Date().toISOString()
    };

    user.downvoteHistory = [...(user.downvoteHistory || []), clearanceEntry];

    await user.save({ transaction: options.transaction });

    return {
      user: await User.findByPk(user.id, { transaction: options.transaction }),
      penaltyCleared: true,
      previousLevel,
      reason: 'Penalty expired automatically'
    };
  }

  /**
   * Get downvote statistics for a user
   * @param {string} userId - User ID
   * @param {Object} options - Options including transaction
   * @returns {Promise<Object>} Downvote statistics
   */
  static async getUserDownvoteStats(userId, options = {}) {
    try {
      const user = await User.findByPk(userId, { transaction: options.transaction });
      if (!user) {
        throw new Error('User not found');
      }

      // Get all user's locations with downvotes
      const downvotedLocations = await Location.findAll({
        where: {
          creatorId: userId,
          downvotes: { [Op.gt]: 0 }
        },
        attributes: ['id', 'locationType', 'downvotes', 'upvotes', 'locationStatus', 'createdAt'],
        order: [['createdAt', 'DESC']],
        transaction: options.transaction
      });

      // Calculate additional stats
      const totalLocations = await Location.count({
        where: { creatorId: userId },
        transaction: options.transaction
      });

      const downvoteRatio = totalLocations > 0 ? (user.downvotedLocationsCount / totalLocations) : 0;
      const averageDownvotesPerLocation = user.downvotedLocationsCount > 0 ? 
        (user.totalDownvotesReceived / user.downvotedLocationsCount) : 0;

      return {
        totalDownvotesReceived: user.totalDownvotesReceived,
        downvotedLocationsCount: user.downvotedLocationsCount,
        totalLocations: totalLocations,
        downvoteRatio: parseFloat(downvoteRatio.toFixed(3)),
        averageDownvotesPerLocation: parseFloat(averageDownvotesPerLocation.toFixed(2)),
        currentPenaltyLevel: user.downvotePenaltyLevel,
        penaltyExpiresAt: user.penaltyExpiresAt,
        lastDownvoteDate: user.lastDownvoteDate,
        downvotedLocations: downvotedLocations,
        nextPenaltyThreshold: this.getNextPenaltyThreshold(user.totalDownvotesReceived, user.downvotedLocationsCount)
      };

    } catch (error) {
      console.error('Error getting user downvote stats:', error);
      throw error;
    }
  }

  /**
   * Get next penalty threshold information
   * @param {number} totalDownvotes - Current total downvotes
   * @param {number} downvotedLocations - Current downvoted locations count
   * @returns {Object} Next threshold information
   */
  static getNextPenaltyThreshold(totalDownvotes, downvotedLocations) {
    for (const [level, config] of Object.entries(this.PENALTY_THRESHOLDS)) {
      if (totalDownvotes < config.totalDownvotes || downvotedLocations < config.downvotedLocations) {
        return {
          level: level.toLowerCase(),
          downvotesNeeded: Math.max(0, config.totalDownvotes - totalDownvotes),
          locationsNeeded: Math.max(0, config.downvotedLocations - downvotedLocations),
          restrictions: config.restrictions
        };
      }
    }
    return null; // Already at highest penalty level
  }

  /**
   * Get users with penalties for admin review
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Users with penalties
   */
  static async getUsersWithPenalties(options = {}) {
    try {
      const users = await User.findAll({
        where: {
          downvotePenaltyLevel: { [Op.ne]: 'none' }
        },
        attributes: [
          'id', 'email', 'profile', 'totalDownvotesReceived', 
          'downvotedLocationsCount', 'downvotePenaltyLevel', 
          'penaltyExpiresAt', 'lastDownvoteDate', 'createdAt'
        ],
        order: [['totalDownvotesReceived', 'DESC']],
        ...options
      });

      return users.map(user => ({
        ...user.toJSON(),
        penaltyExpiresIn: user.penaltyExpiresAt ? 
          Math.max(0, new Date(user.penaltyExpiresAt) - new Date()) : null
      }));

    } catch (error) {
      console.error('Error getting users with penalties:', error);
      throw error;
    }
  }

  /**
   * Manually adjust user's penalty level (admin function)
   * @param {string} userId - User ID
   * @param {string} newPenaltyLevel - New penalty level
   * @param {string} reason - Reason for change
   * @param {Object} options - Options including transaction
   * @returns {Promise<Object>} Updated user
   */
  static async manuallyAdjustPenalty(userId, newPenaltyLevel, reason, options = {}) {
    try {
      const user = await User.findByPk(userId, { transaction: options.transaction });
      if (!user) {
        throw new Error('User not found');
      }

      const previousLevel = user.downvotePenaltyLevel;
      const restrictions = this.getRestrictionsForLevel(newPenaltyLevel);

      user.downvotePenaltyLevel = newPenaltyLevel;
      
      if (newPenaltyLevel === 'none') {
        user.penaltyExpiresAt = null;
      } else if (this.PENALTY_THRESHOLDS[newPenaltyLevel.toUpperCase()]?.duration) {
        user.penaltyExpiresAt = new Date(Date.now() + this.PENALTY_THRESHOLDS[newPenaltyLevel.toUpperCase()].duration);
      }

      // Add manual adjustment to history
      const adjustmentEntry = {
        timestamp: new Date().toISOString(),
        previousLevel: previousLevel,
        newLevel: newPenaltyLevel,
        reason: `Manual adjustment: ${reason}`,
        adjustedBy: 'admin',
        expiresAt: user.penaltyExpiresAt
      };

      user.downvoteHistory = [...(user.downvoteHistory || []), adjustmentEntry];

      await user.save({ transaction: options.transaction });

      return {
        user: await User.findByPk(userId, { transaction: options.transaction }),
        penaltyChanged: true,
        previousLevel,
        newLevel: newPenaltyLevel,
        restrictions,
        reason: `Manual adjustment: ${reason}`
      };

    } catch (error) {
      console.error('Error manually adjusting penalty:', error);
      throw error;
    }
  }
}

module.exports = DownvoteTrackingService; 