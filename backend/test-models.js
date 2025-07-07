const { sequelize } = require('./config/database');

async function testModels() {
  try {
    console.log('🔍 Testing model loading...');
    
    // Try to load the Challenge model
    const Challenge = require('./models/Challenge');
    console.log('✅ Challenge model loaded successfully');
    
    // Try to load other challenge models
    const ChallengeSubmission = require('./models/ChallengeSubmission');
    console.log('✅ ChallengeSubmission model loaded successfully');
    
    const ChallengeVote = require('./models/ChallengeVote');
    console.log('✅ ChallengeVote model loaded successfully');
    
    const ChallengeReward = require('./models/ChallengeReward');
    console.log('✅ ChallengeReward model loaded successfully');
    
    console.log('🎉 All challenge models loaded successfully!');
    
  } catch (error) {
    console.error('❌ Error loading models:', error.message);
    console.error(error.stack);
  } finally {
    await sequelize.close();
  }
}

testModels(); 