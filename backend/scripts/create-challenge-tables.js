const sequelize = require('../config/database');
const { Challenge, ChallengeSubmission, ChallengeVote, ChallengeReward } = require('../models');

async function createChallengeTables() {
  try {
    console.log('🔄 Creating challenge tables...');
    
    // Sync all models to create tables
    await sequelize.sync({ alter: true });
    
    console.log('✅ Challenge tables created successfully!');
    
    // Test creating a sample challenge
    console.log('🎯 Creating sample challenge...');
    
    const sampleChallenge = await Challenge.create({
      title: "Find Hidden Gems",
      description: "Discover and share the most amazing hidden spots in your area! This week, we're looking for unique, lesser-known locations that deserve recognition. Think secret gardens, hidden viewpoints, local favorites, or quirky spots that most people don't know about.",
      type: "weekly",
      status: "active",
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      votingEndDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000), // 8 days from now
      criteria: {
        locationTypes: ["restaurant", "cafe", "park", "viewpoint", "landmark", "shop"],
        keywords: ["hidden", "secret", "local", "unique", "amazing", "beautiful"],
        minUpvotes: 3,
        maxDistance: 50 // miles
      },
      rewards: {
        winners: [
          {
            credits: 500,
            badgeId: null,
            description: "🏆 1st Place - Hidden Gem Master"
          },
          {
            credits: 250,
            badgeId: null,
            description: "🥈 2nd Place - Gem Hunter"
          },
          {
            credits: 100,
            badgeId: null,
            description: "🥉 3rd Place - Explorer"
          }
        ],
        participation: {
          credits: 25,
          description: "Participation reward"
        }
      },
      maxSubmissions: 100,
      minVotesRequired: 5,
      featured: true,
      createdBy: '00000000-0000-0000-0000-000000000000' // Placeholder admin ID
    });
    
    console.log('✅ Sample challenge created:', sampleChallenge.title);
    console.log('🎯 Challenge ID:', sampleChallenge.id);
    
    console.log('\n🎉 Community Challenges system is ready!');
    console.log('\n📋 What you can do now:');
    console.log('1. Start the backend server: npm start');
    console.log('2. Test the challenge API endpoints');
    console.log('3. Integrate the ChallengeDashboard component into your frontend');
    console.log('4. Submit locations and vote on challenges!');
    
  } catch (error) {
    console.error('❌ Error setting up challenges:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run if this script is executed directly
if (require.main === module) {
  createChallengeTables();
}

module.exports = { createChallengeTables }; 