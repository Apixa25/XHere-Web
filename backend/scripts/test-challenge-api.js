const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3000/api';
const TEST_TOKEN = 'your-test-token-here'; // Replace with actual token

async function testChallengeAPI() {
  console.log('🧪 Testing Challenge API Endpoints...\n');
  
  try {
    // Test 1: Get all challenges
    console.log('📋 Test 1: GET /api/challenges');
    try {
      const response = await fetch(`${API_BASE}/challenges`, {
        headers: {
          'Authorization': `Bearer ${TEST_TOKEN}`
        }
      });
      
      if (response.ok) {
        const challenges = await response.json();
        console.log(`✅ Success! Found ${challenges.length} challenges`);
        challenges.forEach(challenge => {
          console.log(`   - ${challenge.title} (${challenge.status})`);
        });
      } else {
        console.log(`❌ Failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.log('❌ Error:', error.message);
    }
    
    // Test 2: Get featured challenges
    console.log('\n📋 Test 2: GET /api/challenges/featured/list');
    try {
      const response = await fetch(`${API_BASE}/challenges/featured/list`, {
        headers: {
          'Authorization': `Bearer ${TEST_TOKEN}`
        }
      });
      
      if (response.ok) {
        const featured = await response.json();
        console.log(`✅ Success! Found ${featured.length} featured challenges`);
      } else {
        console.log(`❌ Failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.log('❌ Error:', error.message);
    }
    
    // Test 3: Create sample challenge (admin only)
    console.log('\n📋 Test 3: POST /api/challenges/sample/create');
    try {
      const response = await fetch(`${API_BASE}/challenges/sample/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TEST_TOKEN}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Success! Sample challenge created');
        console.log(`   Challenge ID: ${result.challenge.id}`);
        console.log(`   Title: ${result.challenge.title}`);
      } else {
        const error = await response.json();
        console.log(`❌ Failed: ${error.error || response.statusText}`);
      }
    } catch (error) {
      console.log('❌ Error:', error.message);
    }
    
    console.log('\n🎉 API testing complete!');
    console.log('\n📋 Notes:');
    console.log('- Some endpoints require authentication');
    console.log('- Admin endpoints require admin privileges');
    console.log('- Replace TEST_TOKEN with a valid user token');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run if this script is executed directly
if (require.main === module) {
  testChallengeAPI();
}

module.exports = { testChallengeAPI }; 