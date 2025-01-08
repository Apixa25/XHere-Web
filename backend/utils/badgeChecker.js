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
  // Get all necessary stats for badge checking
  const user = await User.findByPk(userId);
  const locations = await Location.findAll({ where: { creatorId: userId }});
  
  return {
    totalLocations: locations.length,
    verifiedLocations: locations.filter(loc => loc.verificationStatus === 'verified').length,
    totalVotes: user.profile.votesGiven || 0,
    totalUpvotesReceived: locations.reduce((sum, loc) => sum + (loc.upvotes || 0), 0),
    uniqueAreas: new Set(locations.map(loc => `${Math.floor(loc.location.coordinates[1])},${Math.floor(loc.location.coordinates[0])}`)).size
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
    console.log('Starting badge check for user:', userId);
    
    const locations = await checkVerificationStatus(userId);
    const stats = await getUserStats(userId);
    
    console.log('User stats for badge check:', stats);
    
    // Check each badge condition
    const earnedBadges = Object.values(badges).filter(badge => {
      const earned = badge.condition(stats);
      console.log(`Checking badge ${badge.name}:`, { earned });
      return earned;
    });

    console.log('Earned badges:', earnedBadges);
    
    return earnedBadges;
  } catch (error) {
    console.error('Error in checkAndAwardBadges:', error);
    throw error;
  }
}

module.exports = { checkAndAwardBadges }; 