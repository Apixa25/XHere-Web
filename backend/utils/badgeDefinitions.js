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
  }
};

module.exports = badges; 