const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api';

// Test data
const testUsers = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    email: 'moderator@test.com',
    profile: { name: 'Test Moderator' }
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    email: 'reporter@test.com',
    profile: { name: 'Test Reporter' }
  }
];

const testLocations = [
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    content: {
      text: 'Test Location 1',
      coordinates: { lat: 41.7555, lng: -124.2025 },
      type: 'restaurant'
    },
    user: testUsers[0],
    createdAt: new Date().toISOString()
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440004',
    content: {
      text: 'Test Location 2',
      coordinates: { lat: 41.7556, lng: -124.2026 },
      type: 'shop'
    },
    user: testUsers[1],
    createdAt: new Date().toISOString()
  }
];

const testReports = [
  {
    id: '550e8400-e29b-41d4-a716-446655440005',
    locationId: testLocations[0].id,
    reporterId: testUsers[1].id,
    reportType: 'spam',
    reason: 'This location appears to be spam',
    priority: 'high',
    status: 'pending',
    evidence: [
      {
        type: 'text',
        content: 'This location has suspicious content',
        createdAt: new Date().toISOString()
      }
    ],
    createdAt: new Date().toISOString(),
    location: testLocations[0],
    reporter: testUsers[1]
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440006',
    locationId: testLocations[1].id,
    reporterId: testUsers[0].id,
    reportType: 'inappropriate',
    reason: 'This location contains inappropriate content',
    priority: 'medium',
    status: 'under_review',
    evidence: [
      {
        type: 'text',
        content: 'Content violates community guidelines',
        createdAt: new Date().toISOString()
      }
    ],
    createdAt: new Date().toISOString(),
    location: testLocations[1],
    reporter: testUsers[0]
  }
];

const testModerators = [
  {
    id: testUsers[0].id,
    profile: testUsers[0].profile,
    email: testUsers[0].email,
    isActive: true,
    reportsHandled: 5,
    lastActive: new Date().toISOString()
  }
];

// Mock authentication token
const getAuthToken = (userId) => {
  return `mock-token-${userId}`;
};

// Test functions
const testModeratorDashboard = async () => {
  console.log('🧪 Testing Moderator Dashboard...');
  
  try {
    // Test getting reports for review
    const response = await axios.get(`${API_BASE_URL}/reports/for-review`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken(testUsers[0].id)}`
      },
      params: {
        status: 'pending',
        priority: 'high',
        timeRange: '7d'
      }
    });
    
    console.log('✅ Moderator Dashboard - Get Reports:', response.data);
    
    // Test getting report details
    const reportDetails = await axios.get(`${API_BASE_URL}/reports/${testReports[0].id}`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken(testUsers[0].id)}`
      }
    });
    
    console.log('✅ Moderator Dashboard - Get Report Details:', reportDetails.data);
    
  } catch (error) {
    console.error('❌ Moderator Dashboard Test Failed:', error.response?.data || error.message);
  }
};

const testReportResolution = async () => {
  console.log('🧪 Testing Report Resolution...');
  
  try {
    const resolution = {
      status: 'resolved',
      action: 'remove_location',
      notes: 'Location removed due to spam content',
      notifyReporter: true,
      notifyLocationOwner: true
    };
    
    const response = await axios.post(`${API_BASE_URL}/reports/${testReports[0].id}/resolve`, resolution, {
      headers: {
        'Authorization': `Bearer ${getAuthToken(testUsers[0].id)}`
      }
    });
    
    console.log('✅ Report Resolution:', response.data);
    
  } catch (error) {
    console.error('❌ Report Resolution Test Failed:', error.response?.data || error.message);
  }
};

const testAdminPanel = async () => {
  console.log('🧪 Testing Admin Panel...');
  
  try {
    // Test getting admin stats
    const statsResponse = await axios.get(`${API_BASE_URL}/admin/stats`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken(testUsers[0].id)}`
      }
    });
    
    console.log('✅ Admin Panel - Get Stats:', statsResponse.data);
    
    // Test getting moderators
    const moderatorsResponse = await axios.get(`${API_BASE_URL}/admin/moderators`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken(testUsers[0].id)}`
      }
    });
    
    console.log('✅ Admin Panel - Get Moderators:', moderatorsResponse.data);
    
    // Test updating system settings
    const settingsResponse = await axios.put(`${API_BASE_URL}/admin/settings`, {
      setting: 'autoModeration',
      value: true
    }, {
      headers: {
        'Authorization': `Bearer ${getAuthToken(testUsers[0].id)}`
      }
    });
    
    console.log('✅ Admin Panel - Update Settings:', settingsResponse.data);
    
  } catch (error) {
    console.error('❌ Admin Panel Test Failed:', error.response?.data || error.message);
  }
};

const testBulkOperations = async () => {
  console.log('🧪 Testing Bulk Operations...');
  
  try {
    const bulkResolution = {
      reportIds: [testReports[0].id, testReports[1].id],
      resolution: {
        status: 'resolved',
        action: 'warn_location_owner',
        notes: 'Bulk resolution - warning issued',
        notifyReporter: true,
        notifyLocationOwner: true
      }
    };
    
    const response = await axios.post(`${API_BASE_URL}/reports/bulk-resolve`, bulkResolution, {
      headers: {
        'Authorization': `Bearer ${getAuthToken(testUsers[0].id)}`
      }
    });
    
    console.log('✅ Bulk Operations:', response.data);
    
  } catch (error) {
    console.error('❌ Bulk Operations Test Failed:', error.response?.data || error.message);
  }
};

const testAnalytics = async () => {
  console.log('🧪 Testing Analytics...');
  
  try {
    const response = await axios.get(`${API_BASE_URL}/admin/analytics`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken(testUsers[0].id)}`
      },
      params: {
        timeRange: '30d'
      }
    });
    
    console.log('✅ Analytics:', response.data);
    
  } catch (error) {
    console.error('❌ Analytics Test Failed:', error.response?.data || error.message);
  }
};

const testUserReportHistory = async () => {
  console.log('🧪 Testing User Report History...');
  
  try {
    const response = await axios.get(`${API_BASE_URL}/users/${testUsers[1].id}/reports`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken(testUsers[0].id)}`
      }
    });
    
    console.log('✅ User Report History:', response.data);
    
  } catch (error) {
    console.error('❌ User Report History Test Failed:', error.response?.data || error.message);
  }
};

const testExportFunctionality = async () => {
  console.log('🧪 Testing Export Functionality...');
  
  try {
    const response = await axios.get(`${API_BASE_URL}/reports/export`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken(testUsers[0].id)}`
      },
      params: {
        status: 'pending',
        timeRange: '7d'
      },
      responseType: 'blob'
    });
    
    console.log('✅ Export Functionality:', {
      status: response.status,
      contentType: response.headers['content-type'],
      dataSize: response.data.size
    });
    
  } catch (error) {
    console.error('❌ Export Functionality Test Failed:', error.response?.data || error.message);
  }
};

const testNotifications = async () => {
  console.log('🧪 Testing Notifications...');
  
  try {
    const notification = {
      type: 'report_resolved',
      title: 'Your report has been resolved',
      message: 'Thank you for your report. It has been reviewed and resolved.',
      data: {
        reportId: testReports[0].id,
        resolution: 'location_removed'
      }
    };
    
    const response = await axios.post(`${API_BASE_URL}/notifications/send`, {
      userId: testUsers[1].id,
      notification
    }, {
      headers: {
        'Authorization': `Bearer ${getAuthToken(testUsers[0].id)}`
      }
    });
    
    console.log('✅ Notifications:', response.data);
    
  } catch (error) {
    console.error('❌ Notifications Test Failed:', error.response?.data || error.message);
  }
};

const testTransparencyDashboard = async () => {
  console.log('🧪 Testing Transparency Dashboard...');
  
  try {
    const response = await axios.get(`${API_BASE_URL}/transparency/dashboard`, {
      params: {
        timeRange: '30d'
      }
    });
    
    console.log('✅ Transparency Dashboard:', response.data);
    
  } catch (error) {
    console.error('❌ Transparency Dashboard Test Failed:', error.response?.data || error.message);
  }
};

// Main test runner
const runAllTests = async () => {
  console.log('🚀 Starting Moderator System Tests...\n');
  
  try {
    await testModeratorDashboard();
    console.log('');
    
    await testReportResolution();
    console.log('');
    
    await testAdminPanel();
    console.log('');
    
    await testBulkOperations();
    console.log('');
    
    await testAnalytics();
    console.log('');
    
    await testUserReportHistory();
    console.log('');
    
    await testExportFunctionality();
    console.log('');
    
    await testNotifications();
    console.log('');
    
    await testTransparencyDashboard();
    console.log('');
    
    console.log('🎉 All tests completed!');
    
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
  }
};

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests();
}

module.exports = {
  testModeratorDashboard,
  testReportResolution,
  testAdminPanel,
  testBulkOperations,
  testAnalytics,
  testUserReportHistory,
  testExportFunctionality,
  testNotifications,
  testTransparencyDashboard,
  runAllTests
}; 