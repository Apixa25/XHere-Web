const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

async function testChallengeAPI() {
  console.log('🧪 Testing Challenge API with sample data...\n');

  try {
    // Test 1: Get all challenges
    console.log('1️⃣ Testing GET /api/challenges');
    try {
      const response = await axios.get(`${API_BASE}/challenges`);
      console.log('✅ GET /api/challenges - Status:', response.status);
      console.log('📊 Response data:', response.data);
      console.log('📋 Number of challenges:', response.data.length);
    } catch (error) {
      console.log('❌ GET /api/challenges - Error:', error.response?.status);
      if (error.response?.data) {
        console.log('📋 Error details:', error.response.data);
      }
    }

    // Test 2: Get user submissions
    console.log('\n2️⃣ Testing GET /api/challenges/user/submissions');
    try {
      const response = await axios.get(`${API_BASE}/challenges/user/submissions`);
      console.log('✅ GET /api/challenges/user/submissions - Status:', response.status);
      console.log('📊 Response data:', response.data);
    } catch (error) {
      console.log('❌ GET /api/challenges/user/submissions - Error:', error.response?.status);
      if (error.response?.data) {
        console.log('📋 Error details:', error.response.data);
      }
    }

  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }
}

testChallengeAPI(); 