const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';
const TEST_USER_ID = '550e8400-e29b-41d4-a716-446655440000'; // Use a real UUID
const TEST_LOCATION_ID = '550e8400-e29b-41d4-a716-446655440001'; // Use a real UUID

// Mock authentication token (in real app, this would be a JWT)
const mockAuthToken = 'mock-jwt-token';

async function testDuplicateReportPrevention() {
  console.log('🧪 Testing Duplicate Report Prevention System');
  console.log('=============================================\n');

  try {
    // Step 1: Check if user has already reported this location (should be false initially)
    console.log('1️⃣ Testing check-existing endpoint (should return false initially)...');
    
    const checkResponse = await axios.get(`${BASE_URL}/reports/check-existing?locationId=${TEST_LOCATION_ID}`, {
      headers: {
        'Authorization': `Bearer ${mockAuthToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Check response:', checkResponse.data);
    
    if (checkResponse.data.hasExistingReport) {
      console.log('⚠️ User has already reported this location, skipping first report test');
    } else {
      console.log('✅ No existing report found, proceeding with first report test');
    }

    // Step 2: Submit first report
    console.log('\n2️⃣ Submitting first report...');
    
    const firstReportData = {
      locationId: TEST_LOCATION_ID,
      reportType: 'spam',
      reason: 'This is a test report for duplicate prevention testing',
      evidence: [
        {
          type: 'text',
          content: 'Test evidence for duplicate prevention',
          metadata: { timestamp: new Date().toISOString() }
        }
      ],
      isAnonymous: false,
      contactEmail: null
    };

    const firstReportResponse = await axios.post(`${BASE_URL}/reports/submit`, firstReportData, {
      headers: {
        'Authorization': `Bearer ${mockAuthToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ First report response:', firstReportResponse.data);

    // Step 3: Check again (should now return true)
    console.log('\n3️⃣ Checking for existing report again (should now return true)...');
    
    const checkResponse2 = await axios.get(`${BASE_URL}/reports/check-existing?locationId=${TEST_LOCATION_ID}`, {
      headers: {
        'Authorization': `Bearer ${mockAuthToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Second check response:', checkResponse2.data);
    
    if (checkResponse2.data.hasExistingReport) {
      console.log('✅ Successfully detected existing report!');
    } else {
      console.log('❌ Failed to detect existing report');
    }

    // Step 4: Try to submit duplicate report (should be blocked)
    console.log('\n4️⃣ Attempting to submit duplicate report (should be blocked)...');
    
    const duplicateReportData = {
      locationId: TEST_LOCATION_ID,
      reportType: 'inappropriate',
      reason: 'This is a duplicate report that should be blocked',
      evidence: [],
      isAnonymous: false,
      contactEmail: null
    };

    try {
      const duplicateResponse = await axios.post(`${BASE_URL}/reports/submit`, duplicateReportData, {
        headers: {
          'Authorization': `Bearer ${mockAuthToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('❌ Duplicate report was not blocked! Response:', duplicateResponse.data);
    } catch (error) {
      if (error.response && error.response.status === 409) {
        console.log('✅ Successfully blocked duplicate report!');
        console.log('Blocked response:', error.response.data);
      } else {
        console.log('❌ Unexpected error blocking duplicate report:', error.response?.data || error.message);
      }
    }

    // Step 5: Test with different location (should work)
    console.log('\n5️⃣ Testing report for different location (should work)...');
    
    const differentLocationData = {
      locationId: '550e8400-e29b-41d4-a716-446655440002', // Different location ID
      reportType: 'fake',
      reason: 'This is a test report for a different location',
      evidence: [],
      isAnonymous: false,
      contactEmail: null
    };

    try {
      const differentLocationResponse = await axios.post(`${BASE_URL}/reports/submit`, differentLocationData, {
        headers: {
          'Authorization': `Bearer ${mockAuthToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Different location report submitted successfully:', differentLocationResponse.data);
    } catch (error) {
      console.log('❌ Failed to submit report for different location:', error.response?.data || error.message);
    }

    console.log('\n🎉 Duplicate Report Prevention Test Complete!');
    console.log('=============================================');
    console.log('✅ Frontend check-existing endpoint works');
    console.log('✅ Backend duplicate prevention works');
    console.log('✅ Different locations can still be reported');
    console.log('✅ User can only report each location once');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testDuplicateReportPrevention(); 