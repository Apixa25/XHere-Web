const User = require('../models/User');
const Location = require('../models/Location');
const { Op } = require('sequelize');

class ReputationService {
  // Trust level thresholds
  static TRUST_LEVELS = {
    NEW: {
      name: 'new',
      minScore: 0,
      maxScore: 99,
      postingRestrictions: {
        maxLocationsPerDay: 3,
        requiresApproval: true,
        creditCost: 100
      }
    },
    TRUSTED: {
      name: 'trusted',
      minScore: 100,
      maxScore: 499,
      postingRestrictions: {
        maxLocationsPerDay: 10,
        requiresApproval: false,
        creditCost: 50
      }
    },
    VERIFIED: {
      name: 'verified',
      minScore: 500,
      maxScore: 1999,
      postingRestrictions: {
        maxLocationsPerDay: 25,
        requiresApproval: false,
        creditCost: 25
      }
    },
    MODERATOR: {
      name: 'moderator',
      minScore: 2000,
      maxScore: 999999,
      postingRestrictions: {
        maxLocationsPerDay: 50,
        requiresApproval: false,
        creditCost: 10
      }
    }
  };

  // Calculate reputation score based on various factors
  static async calculateReputationScore(userId) {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Get user's locations with ratings
      const locations = await Location.findAll({
        where: { creatorId: userId },
        attributes: ['id', 'upvotes', 'downvotes', 'totalPoints', 'locationStatus']
      });

      let totalScore = 0;
      let qualityLocations = 0;
      let totalLocations = locations.length;
      let totalRating = 0;

      // Calculate score based on location quality
      for (const location of locations) {
        const locationScore = this.calculateLocationScore(location);
        totalScore += locationScore;
        totalRating += locationScore;

        // Count quality locations (locations with positive ratings)
        if (location.upvotes > location.downvotes && location.upvotes >= 3) {
          qualityLocations++;
        }
      }

      // Calculate average rating
      const averageRating = totalLocations > 0 ? (totalRating / totalLocations) : 0;

      // Bonus points for consistency and quality
      const consistencyBonus = this.calculateConsistencyBonus(locations);
      const qualityBonus = this.calculateQualityBonus(qualityLocations, totalLocations);
      const activityBonus = this.calculateActivityBonus(user);

      totalScore += consistencyBonus + qualityBonus + activityBonus;

      // Ensure minimum score of 0 and maximum reasonable score
      totalScore = Math.max(0, Math.min(totalScore, 999999));

      // Ensure average rating is within reasonable bounds (0-1000)
      const safeAverageRating = Math.max(0, Math.min(averageRating, 1000));

      return {
        reputationScore: Math.round(totalScore),
        qualityLocationsCount: qualityLocations,
        totalLocationsCount: totalLocations,
        averageLocationRating: parseFloat(safeAverageRating.toFixed(2)),
        breakdown: {
          locationScore: totalRating,
          consistencyBonus,
          qualityBonus,
          activityBonus
        }
      };
    } catch (error) {
      console.error('Error calculating reputation score:', error);
      throw error;
    }
  }

  // Calculate score for a single location
  static calculateLocationScore(location) {
    const upvotes = location.upvotes || 0;
    const downvotes = location.downvotes || 0;
    const totalPoints = location.totalPoints || 0;

    // Base score from upvotes/downvotes
    let score = (upvotes * 10) - (downvotes * 5);

    // Bonus for verified locations
    if (location.locationStatus === 'verified') {
      score += 50;
    }

    // Bonus for high-quality locations (5+ positive ratings)
    if (upvotes >= 5 && upvotes > downvotes) {
      score += 25;
    }

    // Penalty for flagged locations
    if (location.locationStatus === 'flagged') {
      score -= 100;
    }

    return Math.max(0, score);
  }

  // Calculate consistency bonus
  static calculateConsistencyBonus(locations) {
    if (locations.length < 3) return 0;

    const recentLocations = locations.slice(-10); // Last 10 locations
    const qualityCount = recentLocations.filter(loc => 
      (loc.upvotes || 0) > (loc.downvotes || 0) && (loc.upvotes || 0) >= 2
    ).length;

    const consistencyRatio = qualityCount / recentLocations.length;
    return Math.round(consistencyRatio * 100);
  }

  // Calculate quality bonus
  static calculateQualityBonus(qualityLocations, totalLocations) {
    if (totalLocations === 0) return 0;

    const qualityRatio = qualityLocations / totalLocations;
    return Math.round(qualityRatio * 200);
  }

  // Calculate activity bonus
  static calculateActivityBonus(user) {
    let bonus = 0;

    // Bonus for being active (voting, etc.)
    bonus += (user.votesGiven || 0) * 2;

    // Bonus for having credits (shows engagement)
    bonus += Math.min((user.credits || 0) / 10, 50);

    // Penalty for downvote violations
    const downvotePenalty = this.calculateDownvotePenalty(user);
    bonus -= downvotePenalty;

    return bonus;
  }

  // Calculate penalty based on downvote history
  static calculateDownvotePenalty(user) {
    let penalty = 0;
    
    // Base penalty for total downvotes received
    penalty += (user.totalDownvotesReceived || 0) * 3;
    
    // Additional penalty for downvoted locations
    penalty += (user.downvotedLocationsCount || 0) * 10;
    
    // Penalty based on penalty level
    const penaltyLevelMultipliers = {
      'none': 0,
      'warning': 50,
      'restricted': 100,
      'suspended': 200,
      'banned': 500
    };
    
    penalty += penaltyLevelMultipliers[user.downvotePenaltyLevel || 'none'];
    
    return penalty;
  }

  // Determine trust level based on reputation score
  static determineTrustLevel(reputationScore) {
    for (const [level, config] of Object.entries(this.TRUST_LEVELS)) {
      if (reputationScore >= config.minScore && reputationScore <= config.maxScore) {
        return config.name;
      }
    }
    return 'new'; // Default fallback
  }

  // Update user's reputation and trust level
  static async updateUserReputation(userId) {
    try {
      const reputationData = await this.calculateReputationScore(userId);
      const trustLevel = this.determineTrustLevel(reputationData.reputationScore);

      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Add to reputation history
      const historyEntry = {
        timestamp: new Date().toISOString(),
        score: reputationData.reputationScore,
        trustLevel,
        breakdown: reputationData.breakdown
      };

      const reputationHistory = [...(user.reputationHistory || []), historyEntry];

      // Update user
      await user.update({
        reputationScore: reputationData.reputationScore,
        trustLevel,
        qualityLocationsCount: reputationData.qualityLocationsCount,
        totalLocationsCount: reputationData.totalLocationsCount,
        averageLocationRating: reputationData.averageLocationRating,
        lastReputationUpdate: new Date(),
        reputationHistory: reputationHistory.slice(-50) // Keep last 50 entries
      });

      console.log(`Updated reputation for user ${userId}: Score=${reputationData.reputationScore}, TrustLevel=${trustLevel}`);

      return {
        reputationScore: reputationData.reputationScore,
        trustLevel,
        qualityLocationsCount: reputationData.qualityLocationsCount,
        totalLocationsCount: reputationData.totalLocationsCount,
        averageLocationRating: reputationData.averageLocationRating,
        postingRestrictions: this.TRUST_LEVELS[trustLevel.toUpperCase()].postingRestrictions
      };
    } catch (error) {
      console.error('Error updating user reputation:', error);
      throw error;
    }
  }

  // Check if user can post a location
  static async canUserPostLocation(userId, locationType = 'general') {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const trustLevel = user.trustLevel;
      const restrictions = this.TRUST_LEVELS[trustLevel.toUpperCase()].postingRestrictions;

      // Check daily posting limit
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayLocations = await Location.count({
        where: {
          creatorId: userId,
          createdAt: {
            [Op.gte]: today
          }
        }
      });

      if (todayLocations >= restrictions.maxLocationsPerDay) {
        return {
          canPost: false,
          reason: `Daily limit reached (${todayLocations}/${restrictions.maxLocationsPerDay})`,
          restrictions
        };
      }

      // Check credit requirement
      if (locationType !== 'general' && user.credits < restrictions.creditCost) {
        return {
          canPost: false,
          reason: `Insufficient credits (${user.credits}/${restrictions.creditCost} required)`,
          restrictions
        };
      }

      return {
        canPost: true,
        requiresApproval: restrictions.requiresApproval,
        creditCost: locationType === 'general' ? 0 : restrictions.creditCost,
        restrictions
      };
    } catch (error) {
      console.error('Error checking user posting permissions:', error);
      throw error;
    }
  }

  // Get reputation dashboard data for a user
  static async getReputationDashboard(userId) {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const trustLevel = user.trustLevel;
      const restrictions = this.TRUST_LEVELS[trustLevel.toUpperCase()].postingRestrictions;

      // Get recent activity
      const recentLocations = await Location.findAll({
        where: { creatorId: userId },
        order: [['createdAt', 'DESC']],
        limit: 10,
        attributes: ['id', 'content', 'upvotes', 'downvotes', 'locationStatus', 'createdAt']
      });

      // Calculate progress to next trust level
      const currentLevel = this.TRUST_LEVELS[trustLevel.toUpperCase()];
      const nextLevel = this.getNextTrustLevel(trustLevel);
      const progressToNext = nextLevel ? 
        Math.min(100, ((user.reputationScore - currentLevel.minScore) / (nextLevel.minScore - currentLevel.minScore)) * 100) : 100;

      return {
        user: {
          id: user.id,
          email: user.email,
          trustLevel: user.trustLevel,
          reputationScore: user.reputationScore,
          qualityLocationsCount: user.qualityLocationsCount,
          totalLocationsCount: user.totalLocationsCount,
          averageLocationRating: user.averageLocationRating,
          credits: user.credits
        },
        restrictions,
        recentLocations,
        progressToNext,
        nextTrustLevel: nextLevel?.name || null,
        reputationHistory: user.reputationHistory || []
      };
    } catch (error) {
      console.error('Error getting reputation dashboard:', error);
      throw error;
    }
  }

  // Get next trust level
  static getNextTrustLevel(currentTrustLevel) {
    const levels = ['new', 'trusted', 'verified', 'moderator'];
    const currentIndex = levels.indexOf(currentTrustLevel);
    
    if (currentIndex === -1 || currentIndex === levels.length - 1) {
      return null; // Already at max level
    }
    
    return this.TRUST_LEVELS[levels[currentIndex + 1].toUpperCase()];
  }

  // Update reputation for all users (for maintenance)
  static async updateAllUserReputations() {
    try {
      const users = await User.findAll({
        attributes: ['id']
      });

      console.log(`Updating reputation for ${users.length} users...`);

      for (const user of users) {
        try {
          await this.updateUserReputation(user.id);
        } catch (error) {
          console.error(`Error updating reputation for user ${user.id}:`, error);
        }
      }

      console.log('Completed reputation update for all users');
    } catch (error) {
      console.error('Error updating all user reputations:', error);
      throw error;
    }
  }
}

module.exports = ReputationService; 