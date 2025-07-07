const fetch = require('node-fetch');

async function testBackendHealth() {
  try {
    console.log('🔍 Testing backend health...');
    
    // Test health endpoint
    const healthResponse = await fetch('http://localhost:3000/api/health');
    console.log('✅ Health endpoint status:', healthResponse.status);
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Backend is healthy:', healthData);
    }
    
    // Test challenges endpoint
    console.log('🔍 Testing challenges endpoint...');
    const challengesResponse = await fetch('http://localhost:3000/api/challenges', {
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });
    console.log('✅ Challenges endpoint status:', challengesResponse.status);
    
    if (challengesResponse.status === 401) {
      console.log('✅ Challenges endpoint exists (auth required)');
    } else if (challengesResponse.status === 404) {
      console.log('❌ Challenges endpoint not found');
    } else {
      console.log('✅ Challenges endpoint response:', challengesResponse.status);
    }
    
  } catch (error) {
    console.error('❌ Backend test failed:', error.message);
    console.log('💡 Make sure the backend is running on port 3000');
  }
}

testBackendHealth(); 