const Badge = require('../models/Badge');
const UserBadge = require('../models/UserBadge');
const User = require('../models/User');
const Location = require('../models/Location');
const { Op } = require('sequelize');

class BadgeService {
  async checkBadges(userId, options = {}) {
    try {
      // Get all badges
      const badges = await Badge.findAll();
      const newBadges = [];

      for (const badge of badges) {
        // Check if user already has this badge
        const existingBadge = await UserBadge.findOne({
          where: { 
            userId: userId, 
            badgeId: badge.id 
          },
          transaction: options.transaction
        });

        if (!existingBadge) {
          // Check if user meets criteria
          const criteria = badge.criteria;
          const isEligible = await this.checkBadgeCriteria(userId, criteria, options);

          if (isEligible) {
            // Award badge
            await UserBadge.create({
              userId: userId,
              badgeId: badge.id,
              awardedAt: new Date()
            }, { transaction: options.transaction });
            newBadges.push(badge);
          }
        }
      }

      return newBadges;
    } catch (error) {
      console.error('Error checking badges:', error);
      throw error;
    }
  }

  async checkBadgeCriteria(userId, criteria, options = {}) {
    try {
      // Implement criteria checking logic based on criteria type
      switch (criteria.type) {
        case 'upvotes':
          return await this.checkUpvotesCriteria(userId, criteria.threshold, options);
        case 'verified_locations':
          return await this.checkVerifiedLocationsCriteria(userId, criteria.threshold, options);
        case 'locations_added':
          return await this.checkLocationsAddedCriteria(userId, criteria.threshold, options);
        case 'credits_spent':
          return await this.checkCreditsSpentCriteria(userId, criteria.threshold, options);
        default:
          return false;
      }
    } catch (error) {
      console.error('Error checking badge criteria:', error);
      return false;
    }
  }

  async checkUpvotesCriteria(userId, threshold, options = {}) {
    const userLocations = await Location.findAll({
      where: { creatorId: userId },
      transaction: options.transaction
    });

    const totalUpvotes = userLocations.reduce((sum, location) => sum + (location.upvotes || 0), 0);
    return totalUpvotes >= threshold;
  }

  async checkVerifiedLocationsCriteria(userId, threshold, options = {}) {
    const verifiedLocations = await Location.count({
      where: { 
        creatorId: userId,
        verificationStatus: 'verified'
      },
      transaction: options.transaction
    });

    return verifiedLocations >= threshold;
  }

  async checkLocationsAddedCriteria(userId, threshold, options = {}) {
    const locationCount = await Location.count({
      where: { creatorId: userId },
      transaction: options.transaction
    });

    return locationCount >= threshold;
  }

  async checkCreditsSpentCriteria(userId, threshold, options = {}) {
    const user = await User.findByPk(userId, { transaction: options.transaction });
    if (!user) return false;

    // This would need to be calculated from credit transactions
    // For now, we'll use a simple approach based on user's credit stats
    const userStats = await user.getUserCreditStats({ transaction: options.transaction });
    if (!userStats) return false;

    return userStats.totalCreditsSpent >= threshold;
  }

  async getUserBadges(userId) {
    try {
      const userBadges = await UserBadge.findAll({
        where: { userId: userId },
        include: [{
          model: Badge,
          as: 'badge'
        }]
      });

      return userBadges.map(ub => ub.badge);
    } catch (error) {
      console.error('Error getting user badges:', error);
      return [];
    }
  }
}

module.exports = new BadgeService(); 