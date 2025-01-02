const badges = require('./badgeDefinitions');
const User = require('../models/User');
const Location = require('../models/Location');

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

async function checkAndAwardBadges(userId) {
  const stats = await getUserStats(userId);
  const user = await User.findByPk(userId);
  const currentBadges = user.badges || [];
  const newBadges = [];

  // Check each badge
  for (const [badgeId, badge] of Object.entries(badges)) {
    // Check if user doesn't have the badge and meets the condition
    if (!currentBadges.find(b => b.id === badgeId) && badge.condition(stats)) {
      newBadges.push(badge);
      currentBadges.push(badge);
    }
  }

  if (newBadges.length > 0) {
    user.badges = currentBadges;
    await user.save();
  }

  return newBadges;
}

module.exports = { checkAndAwardBadges }; 