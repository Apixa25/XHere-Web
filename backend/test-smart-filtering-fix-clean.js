const { v4: uuidv4 } = require('uuid');
const smartFilteringService = require('./services/smartFilteringService');

/**
 * Test script to verify smart filtering fixes
 */
async function testSmartFilteringFixes() {
  console.log('🧪 Testing Smart Filtering Fixes');
  console.log('==================================\n');

  try {
    // Test 1: Test with valid user ID
    console.log('🔍 Test 1: Valid user ID');
    const validLocationData = {
      latitude: 40.7128,
      longitude: -74.0060,
      text: 'Central Park - A beautiful urban park in New York City',
      locationType: 'park'
    };
    
    const validUserData = {
      userId: '11111111-1111-1111-1111-111111111111',
      trustLevel: 'trusted',
      email: 'test@example.com'
    };
    
    const validAnalysis = await smartFilteringService.analyzeForFiltering(validLocationData, validUserData);
    console.log('✅ Valid user ID test passed');
    console.log('- Decision:', validAnalysis.filteringDecision);
    console.log('- Risk Score:', validAnalysis.overallRisk);
    console.log('- Auto Blocked:', validAnalysis.autoBlocked);

    // Test 2: Test with undefined user ID
    console.log('\n🔍 Test 2: Undefined user ID');
    const undefinedUserData = {
      userId: undefined,
      trustLevel: 'new',
      email: 'test@example.com'
    };
    
    const undefinedAnalysis = await smartFilteringService.analyzeForFiltering(validLocationData, undefinedUserData);
    console.log('✅ Undefined user ID test passed');
    console.log('- Decision:', undefinedAnalysis.filteringDecision);
    console.log('- Risk Score:', undefinedAnalysis.overallRisk);
    console.log('- Auto Blocked:', undefinedAnalysis.autoBlocked);

    // Test 3: Test with null userData
    console.log('\n🔍 Test 3: Null userData');
    const nullAnalysis = await smartFilteringService.analyzeForFiltering(validLocationData, null);
    console.log('✅ Null userData test passed');
    console.log('- Decision:', nullAnalysis.filteringDecision);
    console.log('- Risk Score:', nullAnalysis.overallRisk);
    console.log('- Auto Blocked:', nullAnalysis.autoBlocked);

    // Test 4: Test with missing userData
    console.log('\n🔍 Test 4: Missing userData');
    const missingAnalysis = await smartFilteringService.analyzeForFiltering(validLocationData);
    console.log('✅ Missing userData test passed');
    console.log('- Decision:', missingAnalysis.filteringDecision);
    console.log('- Risk Score:', missingAnalysis.overallRisk);
    console.log('- Auto Blocked:', missingAnalysis.autoBlocked);

    console.log('\n✅ All Smart Filtering Fix Tests Passed!');
    console.log('🎯 The system now handles missing/undefined user IDs gracefully.');
    console.log('💡 The 500 error should be resolved.');

  } catch (error) {
    console.error('❌ Smart Filtering Fix Tests Failed:', error);
    throw error;
  }
}

// Run the test
testSmartFilteringFixes().catch(console.error); 