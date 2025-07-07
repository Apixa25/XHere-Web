const badges = require('./badgeDefinitions');
const User = require('../models/User');
const Location = require('../models/Location');
const LeaderboardService = require('../services/leaderboardService');

function logBadgeDebugInfo(userId, stats, locations) {
  console.log('Badge Debug Info:', {
    userId,
    stats,
    verifiedLocationsCount: locations.filter(loc => loc.verificationStatus === 'verified').length,
    locationDetails: locations.map(loc => ({
      id: loc.id,
      status: loc.verificationStatus,
      upvotes: loc.upvotes,
      downvotes: loc.downvotes,
      netVotes: loc.upvotes - loc.downvotes
    }))
  });
}

async function getUserStats(userId) {
  try {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const locations = await Location.findAll({
      where: { creatorId: userId },
      attributes: ['id', 'upvotes', 'downvotes', 'locationStatus', 'createdAt']
    });

    // Calculate basic stats
    const totalLocations = locations.length;
    const verifiedLocations = locations.filter(loc => loc.locationStatus === 'verified').length;
    const totalUpvotesReceived = locations.reduce((sum, loc) => sum + (loc.upvotes || 0), 0);
    const totalDownvotesReceived = locations.reduce((sum, loc) => sum + (loc.downvotes || 0), 0);
    const qualityLocations = locations.filter(loc => 
      (loc.upvotes || 0) >= 3 && (loc.upvotes || 0) > (loc.downvotes || 0)
    ).length;
    const highQualityLocations = locations.filter(loc => 
      (loc.upvotes || 0) >= 5 && (loc.upvotes || 0) > (loc.downvotes || 0)
    ).length;

    // Calculate quality ratio
    const qualityRatio = totalLocations > 0 ? qualityLocations / totalLocations : 0;

    // Get weekly rank
    const weeklyLeaderboard = await LeaderboardService.getWeeklyLeaderboard(100);
    const weeklyRank = weeklyLeaderboard.find(u => u.userId === userId)?.rank || null;

    // Calculate unique areas (simplified - could be enhanced with actual area detection)
    const uniqueAreas = Math.min(locations.length, 5); // Placeholder

    // Get votes given (from user model)
    const totalVotes = user.votesGiven || 0;

    // Calculate mentored users (placeholder - would need actual mentoring system)
    const mentoredUsers = Math.floor(qualityLocations / 2); // Simplified calculation

    return {
      totalLocations,
      verifiedLocations,
      totalUpvotesReceived,
      totalDownvotesReceived,
      qualityLocationsCount: qualityLocations,
      highQualityLocations,
      qualityRatio,
      totalVotes,
      uniqueAreas,
      weeklyRank,
      mentoredUsers,
      trustLevel: user.trustLevel || 'new'
    };
  } catch (error) {
    console.error('Error getting user stats:', error);
    throw error;
  }
}

async function checkVerificationStatus(userId) {
  const locations = await Location.findAll({ 
    where: { creatorId: userId }
  });
  
  console.log('Checking verification status:', {
    userId,
    totalLocations: locations.length,
    locationStatuses: locations.map(loc => ({
      id: loc.id,
      status: loc.verificationStatus,
      upvotes: loc.upvotes,
      downvotes: loc.downvotes,
      netVotes: loc.upvotes - loc.downvotes
    })),
    verifiedCount: locations.filter(loc => loc.verificationStatus === 'verified').length
  });

  return locations;
}

async function checkAndAwardBadges(userId) {
  try {
    const stats = await getUserStats(userId);
    console.log('Checking badges for user:', userId);
    console.log('User stats:', JSON.stringify(stats, null, 2));

    const earnedBadges = [];
    
    Object.entries(badges).forEach(([badgeKey, badge]) => {
      console.log(`Checking badge: ${badge.name}`);
      console.log(`Condition result:`, badge.condition(stats));
      
      if (badge.condition(stats)) {
        console.log(`Badge "${badge.name}" earned!`);
        earnedBadges.push({
          id: badge.id,
          name: badge.name,
          description: badge.description,
          color: badge.color,
          icon: badge.icon || '🏆'
        });
      }
    });

    console.log('Final earned badges:', earnedBadges);
    return earnedBadges;
  } catch (error) {
    console.error('Error checking badges:', error);
    return [];
  }
}

module.exports = { checkAndAwardBadges }; 