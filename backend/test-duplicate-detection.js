const duplicateDetectionService = require('./services/duplicateDetectionService');

/**
 * 🧪 Duplicate Detection Test Script
 * Tests the duplicate detection system with various scenarios
 */

async function testDuplicateDetection() {
  console.log('🧪 Starting Duplicate Detection Tests...\n');

  try {
    // Test 1: Similar coordinates detection
    console.log('📍 Test 1: Similar Coordinates Detection');
    const similarCoords = await duplicateDetectionService.detectSimilarCoordinates(
      40.7128, // New York coordinates
      -74.0060,
      100 // 100m radius
    );
    console.log(`Found ${similarCoords.length} locations within 100m`);
    console.log('✅ Similar coordinates test completed\n');

    // Test 2: Similar text detection
    console.log('🎯 Test 2: Similar Text Detection');
    const similarText = await duplicateDetectionService.detectSimilarText(
      'Great coffee shop with amazing pastries',
      0.7
    );
    console.log(`Found ${similarText.length} locations with similar text`);
    console.log('✅ Similar text test completed\n');

    // Test 3: Clustering pattern detection
    console.log('🕵️ Test 3: Clustering Pattern Detection');
    const clusteringAnalysis = await duplicateDetectionService.detectClusteringPatterns(
      'test-user-id', // Replace with actual user ID for testing
      24, // 24 hours
      5 // Max 5 locations
    );
    console.log('Clustering analysis:', clusteringAnalysis);
    console.log('✅ Clustering analysis test completed\n');

    // Test 4: Comprehensive duplicate detection
    console.log('🛡️ Test 4: Comprehensive Duplicate Detection');
    const locationData = {
      latitude: 40.7128,
      longitude: -74.0060,
      text: 'Amazing coffee shop in downtown',
      locationType: 'food_truck'
    };
    
    const duplicateAnalysis = await duplicateDetectionService.detectDuplicates(
      locationData,
      'test-user-id'
    );
    
    console.log('Duplicate analysis result:');
    console.log('- Status:', duplicateAnalysis.duplicateStatus);
    console.log('- Risk Score:', duplicateAnalysis.totalRiskScore);
    console.log('- Flags:', duplicateAnalysis.duplicateFlags.length);
    console.log('- Similar Coordinates:', duplicateAnalysis.similarCoordinates.length);
    console.log('- Similar Text:', duplicateAnalysis.similarText.length);
    console.log('✅ Comprehensive duplicate detection test completed\n');

    // Test 5: Distance calculation
    console.log('📏 Test 5: Distance Calculation');
    const distance = duplicateDetectionService.calculateDistance(
      40.7128, -74.0060, // New York
      40.7589, -73.9851  // Times Square
    );
    console.log(`Distance between coordinates: ${Math.round(distance)}m`);
    console.log('✅ Distance calculation test completed\n');

    // Test 6: Statistics
    console.log('📊 Test 6: Duplicate Detection Statistics');
    const stats = await duplicateDetectionService.getDuplicateStats();
    console.log('Statistics:', stats);
    console.log('✅ Statistics test completed\n');

    console.log('🎉 All duplicate detection tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Error details:', error.message);
  }
}

// Run the tests
testDuplicateDetection(); 