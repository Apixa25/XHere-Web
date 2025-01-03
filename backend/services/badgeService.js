const Badge = require('../models/Badge');
const UserBadge = require('../models/UserBadge');

class BadgeService {
  async checkAndAwardBadges(userId) {
    try {
      // Get all badges
      const badges = await Badge.query();
      const newBadges = [];

      for (const badge of badges) {
        // Check if user already has this badge
        const existingBadge = await UserBadge.query()
          .where({ user_id: userId, badge_id: badge.id })
          .first();

        if (!existingBadge) {
          // Check if user meets criteria
          const criteria = badge.criteria;
          const isEligible = await this.checkBadgeCriteria(userId, criteria);

          if (isEligible) {
            // Award badge
            await UserBadge.query().insert({
              user_id: userId,
              badge_id: badge.id
            });
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

  async checkBadgeCriteria(userId, criteria) {
    // Implement criteria checking logic based on criteria type
    switch (criteria.type) {
      case 'upvotes':
        return this.checkUpvotesCriteria(userId, criteria.threshold);
      case 'verified_locations':
        return this.checkVerifiedLocationsCriteria(userId, criteria.threshold);
      case 'locations_added':
        return this.checkLocationsAddedCriteria(userId, criteria.threshold);
      default:
        return false;
    }
  }

  // Implement specific criteria checking methods
  // ... add methods for checking different types of criteria
}

module.exports = new BadgeService(); 