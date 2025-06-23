// Backend connectivity test utility
// This helps debug deployment issues by testing API endpoints
import { getEnvironmentConfig } from '../config/environments';

export const testBackendConnectivity = async () => {
  const config = getEnvironmentConfig();
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
      url: `${baseUrl}/api/cors-test`,
      method: 'GET'
    },
    {
      name: 'CORS Preflight Test',
      url: `${baseUrl}/api/cors-test`,
      method: 'OPTIONS'
    }
  ];
  
  for (const test of tests) {
    try {
      console.log(`\n🔍 Testing: ${test.name}`);
      console.log(`📡 URL: ${test.url}`);
      console.log(`📋 Method: ${test.method}`);
      
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
  const config = getEnvironmentConfig();
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
  window.getEnvironmentConfig = getEnvironmentConfig;
  
  // Add specific CORS debugging function
  window.debugCORS = async () => {
    const config = getEnvironmentConfig();
    const baseUrl = config.API_URL;
    
    console.log('🔍 CORS Debug Test');
    console.log('🌐 Current origin:', window.location.origin);
    console.log('🔗 Target API:', baseUrl);
    
    // Test 1: Simple GET request
    try {
      console.log('\n🧪 Test 1: Simple GET request');
      const response1 = await fetch(`${baseUrl}/api/cors-test`);
      console.log('✅ GET request successful:', response1.status);
      const data1 = await response1.json();
      console.log('📄 Response:', data1);
    } catch (error) {
      console.error('❌ GET request failed:', error);
    }
    
    // Test 2: OPTIONS preflight
    try {
      console.log('\n🧪 Test 2: OPTIONS preflight');
      const response2 = await fetch(`${baseUrl}/api/cors-test`, {
        method: 'OPTIONS',
        headers: {
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type, Authorization'
        }
      });
      console.log('✅ OPTIONS request successful:', response2.status);
      console.log('📋 OPTIONS headers:', Object.fromEntries(response2.headers.entries()));
    } catch (error) {
      console.error('❌ OPTIONS request failed:', error);
    }
    
    // Test 3: POST request (like registration)
    try {
      console.log('\n🧪 Test 3: POST request (simulating registration)');
      const response3 = await fetch(`${baseUrl}/api/cors-test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ test: 'data' })
      });
      console.log('✅ POST request successful:', response3.status);
    } catch (error) {
      console.error('❌ POST request failed:', error);
    }
  };
} 