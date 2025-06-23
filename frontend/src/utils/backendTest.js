// Backend connectivity test utility
// This helps debug deployment issues by testing API endpoints

export const testBackendConnectivity = async () => {
  const config = require('../config/environments').getEnvironmentConfig();
  const baseUrl = config.API_URL;
  
  console.log('🧪 Testing backend connectivity...');
  console.log('🔗 Base URL:', baseUrl);
  
  const tests = [
    {
      name: 'Health Check',
      url: `${baseUrl}/api/health`,
      method: 'GET'
    },
    {
      name: 'CORS Test',
      url: `${baseUrl}/api/health`,
      method: 'OPTIONS'
    }
  ];
  
  for (const test of tests) {
    try {
      console.log(`\n🔍 Testing: ${test.name}`);
      console.log(`📡 URL: ${test.url}`);
      
      const response = await fetch(test.url, {
        method: test.method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      console.log(`✅ Status: ${response.status}`);
      console.log(`📋 Headers:`, Object.fromEntries(response.headers.entries()));
      
      if (response.ok) {
        try {
          const data = await response.json();
          console.log(`📄 Response:`, data);
        } catch (e) {
          const text = await response.text();
          console.log(`📄 Text Response:`, text);
        }
      } else {
        console.log(`❌ Error: ${response.statusText}`);
      }
      
    } catch (error) {
      console.error(`❌ Test failed: ${test.name}`, error);
    }
  }
  
  console.log('\n🏁 Backend connectivity test complete!');
};

// Test registration endpoint specifically
export const testRegistration = async (testData = {
  email: 'test@example.com',
  password: 'testpassword123',
  name: 'Test User'
}) => {
  const config = require('../config/environments').getEnvironmentConfig();
  const url = `${config.API_URL}/api/auth/register`;
  
  console.log('🧪 Testing registration endpoint...');
  console.log('🔗 URL:', url);
  console.log('📝 Test data:', { ...testData, password: '[REDACTED]' });
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(testData)
    });
    
    console.log(`📡 Status: ${response.status}`);
    console.log(`📋 Headers:`, Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Registration successful:', data);
      return data;
    } else {
      const errorText = await response.text();
      console.log('❌ Registration failed:', errorText);
      return { error: errorText };
    }
    
  } catch (error) {
    console.error('❌ Registration test failed:', error);
    return { error: error.message };
  }
};

// Export for use in browser console
if (typeof window !== 'undefined') {
  window.testBackendConnectivity = testBackendConnectivity;
  window.testRegistration = testRegistration;
} 