const User = require('../models/User');
const Location = require('../models/Location');
const { Op } = require('sequelize');
const ReputationService = require('./reputationService');

class LeaderboardService {
  // Get weekly leaderboard for quality contributors
  static async getWeeklyLeaderboard(limit = 10) {
    try {
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      // Get users with their weekly stats
      const users = await User.findAll({
        attributes: [
          'id', 'email', 'reputationScore', 'qualityLocationsCount', 
          'totalLocationsCount', 'averageLocationRating', 'trustLevel'
        ],
        where: {
          totalLocationsCount: { [Op.gt]: 0 } // Only users who have posted
        }
      });

      // Calculate weekly stats for each user
      const leaderboardData = await Promise.all(
        users.map(async (user) => {
          const weeklyLocations = await Location.findAll({
            where: {
              creatorId: user.id,
              createdAt: { [Op.gte]: oneWeekAgo }
            },
            attributes: ['id', 'upvotes', 'downvotes', 'locationStatus', 'createdAt']
          });

          const weeklyStats = this.calculateWeeklyStats(weeklyLocations);
          const qualityScore = this.calculateQualityScore(user, weeklyStats);

          return {
            userId: user.id,
            email: user.email,
            reputationScore: user.reputationScore,
            trustLevel: user.trustLevel,
            weeklyStats,
            qualityScore,
            rank: 0 // Will be set after sorting
          };
        })
      );

      // Sort by quality score and assign ranks
      leaderboardData.sort((a, b) => b.qualityScore - a.qualityScore);
      leaderboardData.forEach((user, index) => {
        user.rank = index + 1;
      });

      return leaderboardData.slice(0, limit);
    } catch (error) {
      console.error('Error getting weekly leaderboard:', error);
      throw error;
    }
  }

  // Calculate weekly statistics for a user
  static calculateWeeklyStats(locations) {
    const totalLocations = locations.length;
    const qualityLocations = locations.filter(loc => 
      loc.upvotes >= 3 && loc.upvotes > loc.downvotes
    ).length;
    const highQualityLocations = locations.filter(loc => 
      loc.upvotes >= 5 && loc.upvotes > loc.downvotes
    ).length;
    const verifiedLocations = locations.filter(loc => 
      loc.locationStatus === 'verified'
    ).length;
    const totalUpvotes = locations.reduce((sum, loc) => sum + (loc.upvotes || 0), 0);
    const totalDownvotes = locations.reduce((sum, loc) => sum + (loc.downvotes || 0), 0);
    const netVotes = totalUpvotes - totalDownvotes;

    return {
      totalLocations,
      qualityLocations,
      highQualityLocations,
      verifiedLocations,
      totalUpvotes,
      totalDownvotes,
      netVotes,
      qualityRatio: totalLocations > 0 ? qualityLocations / totalLocations : 0,
      averageUpvotes: totalLocations > 0 ? totalUpvotes / totalLocations : 0
    };
  }

  // Calculate quality score for ranking
  static calculateQualityScore(user, weeklyStats) {
    let score = 0;

    // Base score from reputation
    score += user.reputationScore * 0.1;

    // Weekly activity bonus
    score += weeklyStats.totalLocations * 10;
    score += weeklyStats.qualityLocations * 25;
    score += weeklyStats.highQualityLocations * 50;
    score += weeklyStats.verifiedLocations * 100;

    // Quality ratio bonus
    if (weeklyStats.qualityRatio >= 0.8) {
      score += 200; // High consistency bonus
    } else if (weeklyStats.qualityRatio >= 0.6) {
      score += 100; // Good consistency bonus
    }

    // Trust level bonus
    const trustLevelBonus = {
      'new': 0,
      'trusted': 50,
      'verified': 200,
      'moderator': 500
    };
    score += trustLevelBonus[user.trustLevel] || 0;

    return Math.round(score);
  }

  // Get achievement progress for a user
  static async getUserAchievements(userId) {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const locations = await Location.findAll({
        where: { creatorId: userId },
        attributes: ['id', 'upvotes', 'downvotes', 'locationStatus', 'createdAt']
      });

      const achievements = {
        qualityContributor: {
          name: 'Quality Contributor',
          description: 'Create 5 locations with 3+ upvotes each',
          progress: Math.min(user.qualityLocationsCount, 5),
          target: 5,
          completed: user.qualityLocationsCount >= 5
        },
        consistentQuality: {
          name: 'Consistent Quality',
          description: 'Maintain 80%+ quality ratio for 10+ locations',
          progress: Math.min(user.totalLocationsCount, 10),
          target: 10,
          qualityRatio: user.totalLocationsCount > 0 ? 
            user.qualityLocationsCount / user.totalLocationsCount : 0,
          completed: user.totalLocationsCount >= 10 && 
            (user.qualityLocationsCount / user.totalLocationsCount) >= 0.8
        },
        communityHelper: {
          name: 'Community Helper',
          description: 'Vote on 50+ locations and help verify others',
          progress: Math.min(user.votesGiven || 0, 50),
          target: 50,
          completed: (user.votesGiven || 0) >= 50
        },
        trustedExpert: {
          name: 'Trusted Expert',
          description: 'Reach verified trust level with 10+ quality locations',
          progress: Math.min(user.qualityLocationsCount, 10),
          target: 10,
          completed: user.trustLevel === 'verified' && user.qualityLocationsCount >= 10
        },
        qualityMaster: {
          name: 'Quality Master',
          description: 'Create 20+ locations with 5+ upvotes each',
          progress: Math.min(user.qualityLocationsCount, 20),
          target: 20,
          completed: user.qualityLocationsCount >= 20
        },
        consistencyKing: {
          name: 'Consistency King',
          description: 'Maintain 90%+ quality ratio for 20+ locations',
          progress: Math.min(user.totalLocationsCount, 20),
          target: 20,
          qualityRatio: user.totalLocationsCount > 0 ? 
            user.qualityLocationsCount / user.totalLocationsCount : 0,
          completed: user.totalLocationsCount >= 20 && 
            (user.qualityLocationsCount / user.totalLocationsCount) >= 0.9
        }
      };

      return achievements;
    } catch (error) {
      console.error('Error getting user achievements:', error);
      throw error;
    }
  }

  // Get public profile data for a user
  static async getPublicProfile(userId) {
    try {
      const user = await User.findByPk(userId, {
        attributes: [
          'id', 'email', 'reputationScore', 'trustLevel', 
          'qualityLocationsCount', 'totalLocationsCount', 
          'averageLocationRating', 'lastReputationUpdate'
        ]
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Get recent locations
      const recentLocations = await Location.findAll({
        where: { creatorId: userId },
        order: [['createdAt', 'DESC']],
        limit: 5,
        attributes: ['id', 'content', 'upvotes', 'downvotes', 'locationStatus', 'createdAt']
      });

      // Get weekly rank
      const weeklyLeaderboard = await this.getWeeklyLeaderboard(100);
      const weeklyRank = weeklyLeaderboard.find(u => u.userId === userId)?.rank || null;

      // Get achievements
      const achievements = await this.getUserAchievements(userId);

      return {
        user: {
          id: user.id,
          email: user.email,
          reputationScore: user.reputationScore,
          trustLevel: user.trustLevel,
          qualityLocationsCount: user.qualityLocationsCount,
          totalLocationsCount: user.totalLocationsCount,
          averageLocationRating: user.averageLocationRating,
          lastReputationUpdate: user.lastReputationUpdate
        },
        recentLocations,
        weeklyRank,
        achievements,
        qualityRatio: user.totalLocationsCount > 0 ? 
          user.qualityLocationsCount / user.totalLocationsCount : 0
      };
    } catch (error) {
      console.error('Error getting public profile:', error);
      throw error;
    }
  }

  // Update weekly champion badge
  static async updateWeeklyChampion() {
    try {
      const leaderboard = await this.getWeeklyLeaderboard(1);
      if (leaderboard.length > 0) {
        const champion = leaderboard[0];
        
        // Award weekly champion badge (this would integrate with badge system)
        console.log(`Weekly Champion: ${champion.email} with score ${champion.qualityScore}`);
        
        return champion;
      }
      return null;
    } catch (error) {
      console.error('Error updating weekly champion:', error);
      throw error;
    }
  }

  // Get leaderboard categories
  static async getLeaderboardCategories() {
    return {
      weekly: 'Weekly Quality Contributors',
      monthly: 'Monthly Quality Contributors', 
      allTime: 'All-Time Quality Contributors',
      verified: 'Verified Contributors',
      trusted: 'Trusted Contributors'
    };
  }
}

module.exports = LeaderboardService; 