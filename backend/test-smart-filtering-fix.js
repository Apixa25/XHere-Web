const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const smartFilteringService = require('./services/smartFilteringService');

// Test the smart filtering API endpoint
async function testSmartFilteringAPI() {
  try {
    console.log('🧪 Testing Smart Filtering API...');
    
    // Test data
    const testData = {
      locationData: {
        name: 'Test Coffee Shop',
        description: 'A great place for coffee and conversation',
        latitude: 41.7991,
        longitude: -124.1622,
        category: 'food'
      },
      userData: {
        id: 1,
        username: 'testuser',
        reputation: 50
      }
    };

    console.log('📤 Sending test request to smart filtering API...');
    
    const response = await axios.post('http://localhost:3000/api/smart-filtering/analyze', testData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token' // This will fail auth but we can see if the route exists
      }
    });

    console.log('✅ Smart filtering API is working!');
    console.log('Response:', response.data);
    
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ Smart filtering API route exists (authentication required as expected)');
      console.log('🛡️ Route is properly protected');
    } else {
      console.error('❌ Smart filtering API test failed:', error.message);
      console.error('Status:', error.response?.status);
      console.error('Response:', error.response?.data);
    }
  }
}

// Test the service directly
async function testSmartFilteringService() {
  try {
    console.log('\n🧪 Testing Smart Filtering Service directly...');
    
    const testData = {
      name: 'Test Location',
      description: 'A test location for analysis',
      latitude: 41.7991,
      longitude: -124.1622,
      category: 'general',
      text: 'A test location for analysis' // Add text field for content analysis
    };

    const userData = {
      id: 1,
      userId: 1, // Add userId field that the service expects
      username: 'testuser',
      reputation: 50,
      email: 'test@example.com'
    };

    console.log('📤 Testing service analysis...');
    const analysis = await smartFilteringService.analyzeForFiltering(testData, userData);
    
    console.log('✅ Smart filtering service is working!');
    console.log('Analysis result:', JSON.stringify(analysis, null, 2));
    
  } catch (error) {
    console.error('❌ Smart filtering service test failed:', error.message);
  }
}

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

// Run tests
async function runTests() {
  console.log('🚀 Starting Smart Filtering Tests...\n');
  
  await testSmartFilteringAPI();
  await testSmartFilteringService();
  
  console.log('\n🎉 Smart filtering tests completed!');
}

runTests().catch(console.error);

// Run the test
testSmartFilteringFixes().catch(console.error); 