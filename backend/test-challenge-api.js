const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';
const TEST_TOKEN = 'test-token'; // You'll need to replace this with a real token

async function testChallengeAPI() {
  console.log('🧪 Testing Challenge API Endpoints...\n');

  try {
    // Test 1: Get all challenges
    console.log('1️⃣ Testing GET /api/challenges');
    try {
      const response = await axios.get(`${API_BASE}/challenges`, {
        headers: { 'Authorization': `Bearer ${TEST_TOKEN}` }
      });
      console.log('✅ GET /api/challenges - Status:', response.status);
      console.log('📊 Response data:', response.data);
    } catch (error) {
      console.log('❌ GET /api/challenges - Error:', error.response?.status, error.response?.data?.error || error.message);
    }

    // Test 2: Get user submissions
    console.log('\n2️⃣ Testing GET /api/challenges/user/submissions');
    try {
      const response = await axios.get(`${API_BASE}/challenges/user/submissions`, {
        headers: { 'Authorization': `Bearer ${TEST_TOKEN}` }
      });
      console.log('✅ GET /api/challenges/user/submissions - Status:', response.status);
      console.log('📊 Response data:', response.data);
    } catch (error) {
      console.log('❌ GET /api/challenges/user/submissions - Error:', error.response?.status, error.response?.data?.error || error.message);
    }

    // Test 3: Check if routes are registered
    console.log('\n3️⃣ Testing route registration');
    try {
      const response = await axios.get(`${API_BASE}/challenges`);
      console.log('✅ Routes are registered - Status:', response.status);
    } catch (error) {
      console.log('❌ Routes not found - Error:', error.response?.status);
    }

  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }
}

testChallengeAPI(); 