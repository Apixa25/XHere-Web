const badges = {
  FIRST_CONTRIBUTION: {
    id: 'first_contribution',
    name: 'First Contribution',
    description: 'Made your first location contribution',
    color: '#4CAF50',
    condition: (stats) => stats.totalLocations >= 1
  },
  VERIFIED_CONTRIBUTOR: {
    id: 'verified_contributor',
    name: 'Verified Contributor',
    description: 'Got your first location verified',
    color: '#2196F3',
    condition: (stats) => stats.verifiedLocations >= 1
  },
  SUPER_VOTER: {
    id: 'super_voter',
    name: 'Super Voter',
    description: 'Voted on 10 different locations',
    color: '#FF9800',
    condition: (stats) => stats.totalVotes >= 10
  },
  POPULAR_SPOT: {
    id: 'popular_spot',
    name: 'Popular Spot',
    description: 'Received 50 total upvotes',
    color: '#E91E63',
    condition: (stats) => stats.totalUpvotesReceived >= 50
  },
  EXPLORER: {
    id: 'explorer',
    name: 'Explorer',
    description: 'Added locations in 5 different areas',
    color: '#9C27B0',
    condition: (stats) => stats.uniqueAreas >= 5
  },
  // Quality Contributor Badges
  QUALITY_CONTRIBUTOR: {
    id: 'quality_contributor',
    name: 'Quality Contributor',
    description: 'Created 5 locations with 3+ upvotes each',
    color: '#FFD700',
    icon: '⭐',
    condition: (stats) => stats.qualityLocationsCount >= 5
  },
  CONSISTENT_QUALITY: {
    id: 'consistent_quality',
    name: 'Consistent Quality',
    description: 'Maintained 80%+ quality ratio for 10+ locations',
    color: '#4CAF50',
    icon: '🎯',
    condition: (stats) => stats.qualityRatio >= 0.8 && stats.totalLocations >= 10
  },
  COMMUNITY_HELPER: {
    id: 'community_helper',
    name: 'Community Helper',
    description: 'Voted on 50+ locations and helped verify others',
    color: '#2196F3',
    icon: '🤝',
    condition: (stats) => stats.totalVotes >= 50 && stats.verifiedLocations >= 3
  },
  TRUSTED_EXPERT: {
    id: 'trusted_expert',
    name: 'Trusted Expert',
    description: 'Reached verified trust level with 10+ quality locations',
    color: '#9C27B0',
    icon: '👑',
    condition: (stats) => stats.trustLevel === 'verified' && stats.qualityLocationsCount >= 10
  },
  WEEKLY_CHAMPION: {
    id: 'weekly_champion',
    name: 'Weekly Champion',
    description: 'Top contributor for the week',
    color: '#FF6B35',
    icon: '🏆',
    condition: (stats) => stats.weeklyRank === 1
  },
  QUALITY_MASTER: {
    id: 'quality_master',
    name: 'Quality Master',
    description: 'Created 20+ locations with 5+ upvotes each',
    color: '#E91E63',
    icon: '💎',
    condition: (stats) => stats.highQualityLocations >= 20
  },
  COMMUNITY_MENTOR: {
    id: 'community_mentor',
    name: 'Community Mentor',
    description: 'Helped 10+ new users get their first verification',
    color: '#00BCD4',
    icon: '🎓',
    condition: (stats) => stats.mentoredUsers >= 10
  },
  CONSISTENCY_KING: {
    id: 'consistency_king',
    name: 'Consistency King',
    description: 'Maintained 90%+ quality ratio for 20+ locations',
    color: '#8BC34A',
    icon: '👑',
    condition: (stats) => stats.qualityRatio >= 0.9 && stats.totalLocations >= 20
  }
};

module.exports = badges; 