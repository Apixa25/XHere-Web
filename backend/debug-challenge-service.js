const challengeService = require('./services/challengeService');

async function debugChallengeService() {
  console.log('🔍 Debugging Challenge Service...\n');

  try {
    console.log('1️⃣ Testing getActiveChallenges...');
    const challenges = await challengeService.getActiveChallenges();
    console.log('✅ getActiveChallenges successful');
    console.log('📊 Challenges found:', challenges.length);
    console.log('📋 Challenge data:', challenges);
  } catch (error) {
    console.log('❌ getActiveChallenges failed:', error.message);
    console.log('📋 Full error:', error);
  }

  try {
    console.log('\n2️⃣ Testing getUserSubmissions...');
    const submissions = await challengeService.getUserSubmissions('test-user-id');
    console.log('✅ getUserSubmissions successful');
    console.log('📊 Submissions found:', submissions.length);
  } catch (error) {
    console.log('❌ getUserSubmissions failed:', error.message);
    console.log('📋 Full error:', error);
  }
}

debugChallengeService(); 