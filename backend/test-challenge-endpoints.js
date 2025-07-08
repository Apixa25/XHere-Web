const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

async function testChallengeEndpoints() {
  console.log('🧪 Testing Challenge API Endpoints...\n');

  try {
    // Test 1: Health check
    console.log('1️⃣ Testing health endpoint');
    try {
      const response = await axios.get(`${API_BASE}/health`);
      console.log('✅ Health check - Status:', response.status);
      console.log('📊 Health data:', response.data);
    } catch (error) {
      console.log('❌ Health check failed:', error.response?.status, error.message);
    }

    // Test 2: Get all challenges
    console.log('\n2️⃣ Testing GET /api/challenges');
    try {
      const response = await axios.get(`${API_BASE}/challenges`);
      console.log('✅ GET /api/challenges - Status:', response.status);
      console.log('📊 Response data:', response.data);
    } catch (error) {
      console.log('❌ GET /api/challenges - Error:', error.response?.status);
      if (error.response?.data) {
        console.log('📋 Error details:', error.response.data);
      }
    }

    // Test 3: Get user submissions
    console.log('\n3️⃣ Testing GET /api/challenges/user/submissions');
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

    // Test 4: Check database directly
    console.log('\n4️⃣ Testing database connection');
    try {
      const sequelize = require('./config/database');
      await sequelize.authenticate();
      console.log('✅ Database connection successful');
      
      // Check if challenges table has data
      const [challenges] = await sequelize.query('SELECT COUNT(*) as count FROM challenges');
      console.log(`📊 Challenges in database: ${challenges[0].count}`);
      
      if (challenges[0].count > 0) {
        const [challengeData] = await sequelize.query('SELECT * FROM challenges LIMIT 1');
        console.log('📋 Sample challenge:', challengeData[0]);
      }
      
      await sequelize.close();
    } catch (error) {
      console.log('❌ Database test failed:', error.message);
    }

  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }
}

testChallengeEndpoints(); 