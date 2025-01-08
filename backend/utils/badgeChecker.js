const badges = require('./badgeDefinitions');
const User = require('../models/User');
const Location = require('../models/Location');

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
  const user = await User.findByPk(userId);
  const locations = await Location.findAll({ 
    where: { creatorId: userId }
  });
  
  return {
    totalLocations: locations.length,
    verifiedLocations: locations.filter(loc => loc.verificationStatus === 'verified').length,
    totalVotes: user.votesGiven || 0,
    totalUpvotesReceived: locations.reduce((sum, loc) => sum + (loc.upvotes || 0), 0),
    uniqueAreas: new Set(locations.map(loc => {
      const coords = loc.location.coordinates;
      return `${Math.floor(coords[1])},${Math.floor(coords[0])}`;
    })).size
  };
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