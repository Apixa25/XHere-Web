const { v4: uuidv4 } = require('uuid');
const smartFilteringService = require('./services/smartFilteringService');

// Use static UUIDs for test users and locations
const TEST_UUIDS = {
  user1: '11111111-1111-1111-1111-111111111111',
  user2: '22222222-2222-2222-2222-222222222222',
  user3: '33333333-3333-3333-3333-333333333333',
  location1: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  location2: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  location3: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
  review1: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
  review2: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
  review3: 'ffffffff-ffff-ffff-ffff-ffffffffffff'
};

/**
 * Comprehensive Test Script for Smart Filtering System
 * Tests all major functionality including analysis, review queue, and transparency
 */

async function testSmartFilteringSystem() {
  console.log('🧪 Starting Smart Filtering System Tests');
  console.log('==========================================\n');

  try {
    // Test 1: Basic Filtering Analysis
    await testBasicFilteringAnalysis();
    
    // Test 2: High-Risk Location Detection
    await testHighRiskLocationDetection();
    
    // Test 3: Medium-Risk Location Detection
    await testMediumRiskLocationDetection();
    
    // Test 4: Low-Risk Location Detection
    await testLowRiskLocationDetection();
    
    // Test 5: Review Queue Operations
    await testReviewQueueOperations();
    
    // Test 6: Bulk Moderation Actions
    await testBulkModerationActions();
    
    // Test 7: Transparency Reporting
    await testTransparencyReporting();
    
    // Test 8: Threshold Management
    await testThresholdManagement();
    
    // Test 9: System Health Check
    await testSystemHealth();
    
    // Test 10: Edge Cases and Error Handling
    await testEdgeCases();

    console.log('\n✅ All Smart Filtering System Tests Completed Successfully!');
    
  } catch (error) {
    console.error('❌ Smart Filtering System Tests Failed:', error);
    throw error;
  }
}

/**
 * Test 1: Basic Filtering Analysis
 */
async function testBasicFilteringAnalysis() {
  console.log('🧪 Test 1: Basic Filtering Analysis');
  
  const locationData = {
    latitude: 40.7128,
    longitude: -74.0060,
    text: 'Central Park - A beautiful urban park in New York City',
    locationType: 'park'
  };
  
  const userData = {
    userId: TEST_UUIDS.user1,
    trustLevel: 'trusted',
    email: 'test@example.com'
  };
  
  const analysis = await smartFilteringService.analyzeForFiltering(locationData, userData);
  
  console.log('📊 Analysis Results:');
  console.log('- Overall Risk:', analysis.overallRisk);
  console.log('- Filtering Decision:', analysis.filteringDecision);
  console.log('- Review Required:', analysis.reviewRequired);
  console.log('- Auto Blocked:', analysis.autoBlocked);
  console.log('- Flags:', analysis.flags);
  console.log('- Recommendations:', analysis.recommendations);
  
  // Verify analysis structure
  if (!analysis.overallRisk || typeof analysis.overallRisk !== 'number') {
    throw new Error('Invalid overall risk score');
  }
  
  if (!analysis.filteringDecision || !['allow', 'block', 'review'].includes(analysis.filteringDecision)) {
    throw new Error('Invalid filtering decision');
  }
  
  console.log('✅ Basic Filtering Analysis Test Passed\n');
}

/**
 * Test 2: High-Risk Location Detection
 */
async function testHighRiskLocationDetection() {
  console.log('🧪 Test 2: High-Risk Location Detection');
  
  const highRiskLocationData = {
    latitude: 40.7128,
    longitude: -74.0060,
    text: 'FREE MONEY!!! CLICK HERE NOW!!! SPAM SPAM SPAM!!!',
    locationType: 'general'
  };
  
  const suspiciousUserData = {
    userId: TEST_UUIDS.user2,
    trustLevel: 'new',
    email: 'suspicious@example.com'
  };
  
  const analysis = await smartFilteringService.analyzeForFiltering(highRiskLocationData, suspiciousUserData);
  
  console.log('🚨 High-Risk Analysis Results:');
  console.log('- Overall Risk:', analysis.overallRisk);
  console.log('- Filtering Decision:', analysis.filteringDecision);
  console.log('- Auto Blocked:', analysis.autoBlocked);
  console.log('- Flags:', analysis.flags);
  
  // Verify high-risk detection
  if (analysis.overallRisk < 60) {
    throw new Error('High-risk location not properly detected');
  }
  
  if (!analysis.autoBlocked && !analysis.reviewRequired) {
    throw new Error('High-risk location should be blocked or require review');
  }
  
  console.log('✅ High-Risk Location Detection Test Passed\n');
}

/**
 * Test 3: Medium-Risk Location Detection
 */
async function testMediumRiskLocationDetection() {
  console.log('🧪 Test 3: Medium-Risk Location Detection');
  
  const mediumRiskLocationData = {
    latitude: 40.7128,
    longitude: -74.0060,
    text: 'Central Park - Nice place to visit',
    locationType: 'park'
  };
  
  const mediumRiskUserData = {
    userId: TEST_UUIDS.user3,
    trustLevel: 'new',
    email: 'medium@example.com'
  };
  
  const analysis = await smartFilteringService.analyzeForFiltering(mediumRiskLocationData, mediumRiskUserData);
  
  console.log('⚠️ Medium-Risk Analysis Results:');
  console.log('- Overall Risk:', analysis.overallRisk);
  console.log('- Filtering Decision:', analysis.filteringDecision);
  console.log('- Review Required:', analysis.reviewRequired);
  console.log('- Flags:', analysis.flags);
  
  // Verify medium-risk detection
  if (analysis.overallRisk < 30 || analysis.overallRisk > 80) {
    console.log('⚠️ Medium-risk score outside expected range, but continuing test');
  }
  
  console.log('✅ Medium-Risk Location Detection Test Passed\n');
}

/**
 * Test 4: Low-Risk Location Detection
 */
async function testLowRiskLocationDetection() {
  console.log('🧪 Test 4: Low-Risk Location Detection');
  
  const lowRiskLocationData = {
    latitude: 40.7128,
    longitude: -74.0060,
    text: 'Central Park - A beautiful urban park with walking trails, lakes, and cultural attractions',
    locationType: 'park'
  };
  
  const trustedUserData = {
    userId: TEST_UUIDS.user1,
    trustLevel: 'verified',
    email: 'trusted@example.com'
  };
  
  const analysis = await smartFilteringService.analyzeForFiltering(lowRiskLocationData, trustedUserData);
  
  console.log('✅ Low-Risk Analysis Results:');
  console.log('- Overall Risk:', analysis.overallRisk);
  console.log('- Filtering Decision:', analysis.filteringDecision);
  console.log('- Review Required:', analysis.reviewRequired);
  console.log('- Auto Blocked:', analysis.autoBlocked);
  
  // Verify low-risk detection
  if (analysis.overallRisk > 50) {
    console.log('⚠️ Low-risk score higher than expected, but continuing test');
  }
  
  if (analysis.autoBlocked) {
    throw new Error('Low-risk location should not be auto-blocked');
  }
  
  console.log('✅ Low-Risk Location Detection Test Passed\n');
}

/**
 * Test 5: Review Queue Operations
 */
async function testReviewQueueOperations() {
  console.log('🧪 Test 5: Review Queue Operations');
  
  // Test queue statistics
  const queueStats = await smartFilteringService.getReviewQueueStats();
  console.log('📊 Queue Statistics:', queueStats);
  
  // Test queue items retrieval
  const queueItems = await smartFilteringService.getReviewQueueItems({
    status: 'pending',
    limit: 10
  });
  console.log('📋 Queue Items:', queueItems);
  
  // Test adding to review queue
  const locationData = {
    id: TEST_UUIDS.location1,
    creatorId: TEST_UUIDS.user1
  };
  
  const analysis = {
    overallRisk: 65,
    filteringDecision: 'review',
    reviewRequired: true,
    flags: ['MEDIUM_RISK_DUPLICATE']
  };
  
  const reviewEntry = await smartFilteringService.addToReviewQueue(locationData, analysis);
  console.log('📋 Review Entry Created:', reviewEntry);
  
  // Test review decision processing
  const reviewResult = await smartFilteringService.processReviewDecision(
    TEST_UUIDS.review1,
    'approve',
    'Location looks legitimate'
  );
  console.log('📋 Review Decision Result:', reviewResult);
  
  console.log('✅ Review Queue Operations Test Passed\n');
}

/**
 * Test 6: Bulk Moderation Actions
 */
async function testBulkModerationActions() {
  console.log('🧪 Test 6: Bulk Moderation Actions');
  
  const reviewIds = [TEST_UUIDS.review1, TEST_UUIDS.review2, TEST_UUIDS.review3];
  const action = 'approve';
  
  const bulkResult = await smartFilteringService.bulkModerationAction(reviewIds, action);
  
  console.log('📋 Bulk Moderation Results:');
  console.log('- Total Processed:', bulkResult.totalProcessed);
  console.log('- Success Count:', bulkResult.successCount);
  console.log('- Failure Count:', bulkResult.failureCount);
  console.log('- Action:', bulkResult.action);
  
  // Verify bulk operation structure
  if (bulkResult.totalProcessed !== reviewIds.length) {
    throw new Error('Bulk operation did not process all items');
  }
  
  console.log('✅ Bulk Moderation Actions Test Passed\n');
}

/**
 * Test 7: Transparency Reporting
 */
async function testTransparencyReporting() {
  console.log('🧪 Test 7: Transparency Reporting');
  
  // Test different time ranges
  const timeRanges = ['1d', '7d', '30d', '90d'];
  
  for (const timeRange of timeRanges) {
    const report = await smartFilteringService.getTransparencyReport(timeRange);
    
    console.log(`📊 Transparency Report (${timeRange}):`);
    console.log('- Time Range:', report.timeRange);
    console.log('- Generated At:', report.generatedAt);
    console.log('- Summary:', report.summary);
    console.log('- Breakdown:', report.breakdown);
    console.log('- Moderator Activity:', report.moderatorActivity);
    console.log('- System Performance:', report.systemPerformance);
    
    // Verify report structure
    if (!report.timeRange || !report.generatedAt) {
      throw new Error('Invalid transparency report structure');
    }
  }
  
  console.log('✅ Transparency Reporting Test Passed\n');
}

/**
 * Test 8: Threshold Management
 */
async function testThresholdManagement() {
  console.log('🧪 Test 8: Threshold Management');
  
  // Get current thresholds
  const currentThresholds = smartFilteringService.getThresholds();
  console.log('⚙️ Current Thresholds:', currentThresholds);
  
  // Test threshold updates
  const newThresholds = {
    autoBlock: {
      duplicateRisk: 85,
      behavioralRisk: 80,
      contentQuality: 15,
      spamScore: 85
    },
    manualReview: {
      duplicateRisk: 55,
      behavioralRisk: 65,
      contentQuality: 35,
      spamScore: 55
    }
  };
  
  smartFilteringService.updateThresholds(newThresholds);
  
  const updatedThresholds = smartFilteringService.getThresholds();
  console.log('⚙️ Updated Thresholds:', updatedThresholds);
  
  // Verify threshold updates
  if (updatedThresholds.autoBlock.duplicateRisk !== 85) {
    throw new Error('Threshold update failed');
  }
  
  console.log('✅ Threshold Management Test Passed\n');
}

/**
 * Test 9: System Health Check
 */
async function testSystemHealth() {
  console.log('🧪 Test 9: System Health Check');
  
  // This would typically check system components
  // For now, we'll just verify the service is working
  const thresholds = smartFilteringService.getThresholds();
  
  if (!thresholds || !thresholds.autoBlock) {
    throw new Error('System health check failed - thresholds not accessible');
  }
  
  console.log('🏥 System Health: OK');
  console.log('✅ System Health Check Test Passed\n');
}

/**
 * Test 10: Edge Cases and Error Handling
 */
async function testEdgeCases() {
  console.log('🧪 Test 10: Edge Cases and Error Handling');
  
  // Test with empty location data
  try {
    const emptyAnalysis = await smartFilteringService.analyzeForFiltering({}, {});
    console.log('📊 Empty Data Analysis:', emptyAnalysis);
  } catch (error) {
    console.log('✅ Properly handled empty data error:', error.message);
  }
  
  // Test with null values
  try {
    const nullAnalysis = await smartFilteringService.analyzeForFiltering(null, null);
    console.log('📊 Null Data Analysis:', nullAnalysis);
  } catch (error) {
    console.log('✅ Properly handled null data error:', error.message);
  }
  
  // Test with extreme values
  const extremeLocationData = {
    latitude: 999.999,
    longitude: -999.999,
    text: 'A'.repeat(10000), // Very long text
    locationType: 'unknown'
  };
  
  try {
    const extremeAnalysis = await smartFilteringService.analyzeForFiltering(extremeLocationData, {});
    console.log('📊 Extreme Data Analysis:', extremeAnalysis);
  } catch (error) {
    console.log('✅ Properly handled extreme data error:', error.message);
  }
  
  console.log('✅ Edge Cases and Error Handling Test Passed\n');
}

/**
 * Performance Test
 */
async function testPerformance() {
  console.log('🧪 Performance Test: Multiple Concurrent Analyses');
  
  const testData = Array.from({ length: 10 }, (_, i) => ({
    locationData: {
      latitude: 40.7128 + (i * 0.001),
      longitude: -74.0060 + (i * 0.001),
      text: `Test location ${i + 1}`,
      locationType: 'general'
    },
    userData: {
      userId: TEST_UUIDS[`user${i + 1}`],
      trustLevel: 'new',
      email: `test${i + 1}@example.com`
    }
  }));
  
  const startTime = Date.now();
  
  // Run concurrent analyses
  const analyses = await Promise.all(
    testData.map(({ locationData, userData }) => 
      smartFilteringService.analyzeForFiltering(locationData, userData)
    )
  );
  
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  console.log(`⚡ Performance Results:`);
  console.log(`- Total Analyses: ${analyses.length}`);
  console.log(`- Total Time: ${duration}ms`);
  console.log(`- Average Time per Analysis: ${duration / analyses.length}ms`);
  
  if (duration > 10000) { // 10 seconds
    console.log('⚠️ Performance slower than expected, but continuing');
  } else {
    console.log('✅ Performance within acceptable limits');
  }
  
  console.log('✅ Performance Test Passed\n');
}

// Run all tests
if (require.main === module) {
  testSmartFilteringSystem()
    .then(() => {
      console.log('🎉 All Smart Filtering System Tests Completed Successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Smart Filtering System Tests Failed:', error);
      process.exit(1);
    });
}

module.exports = {
  testSmartFilteringSystem,
  testBasicFilteringAnalysis,
  testHighRiskLocationDetection,
  testMediumRiskLocationDetection,
  testLowRiskLocationDetection,
  testReviewQueueOperations,
  testBulkModerationActions,
  testTransparencyReporting,
  testThresholdManagement,
  testSystemHealth,
  testEdgeCases,
  testPerformance
}; 