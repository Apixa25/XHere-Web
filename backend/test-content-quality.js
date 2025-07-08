const contentQualityService = require('./services/contentQualityService');

/**
 * Test Content Quality Analysis System
 * Tests various scenarios for content quality analysis
 */
async function testContentQualityAnalysis() {
  console.log('🧪 Testing Content Quality Analysis System\n');

  try {
    // Test 1: High-quality content
    console.log('📝 Test 1: High-quality content');
    const highQualityData = {
      name: 'Authentic Local Coffee Shop',
      description: 'A charming family-owned coffee shop in the heart of downtown. They serve freshly roasted beans and homemade pastries. The atmosphere is warm and welcoming, perfect for working or meeting friends. The baristas are knowledgeable and friendly, and they source their beans from local roasters.',
      keywords: 'coffee, local, family-owned, fresh, homemade, atmosphere, friendly, knowledgeable'
    };

    const highQualityAnalysis = await contentQualityService.analyzeContentQuality(highQualityData);
    console.log(`✅ High Quality Score: ${highQualityAnalysis.overallScore}/100`);
    console.log(`   Risk Level: ${highQualityAnalysis.riskLevel}`);
    console.log(`   Spam Score: ${highQualityAnalysis.spamScore}/100`);
    console.log(`   Description Quality: ${highQualityAnalysis.descriptionQuality.score}/100`);
    console.log(`   Flags: ${highQualityAnalysis.flags.length}`);
    console.log('');

    // Test 2: Spam content
    console.log('🚨 Test 2: Spam content');
    const spamData = {
      name: 'BUY NOW - MAKE MONEY FAST!!!',
      description: 'CLICK HERE TO EARN INSTANT CASH!!! LIMITED TIME OFFER!!! 100% FREE!!! GUARANTEED PROFITS!!! ACT NOW BEFORE IT\'S TOO LATE!!! DON\'T MISS OUT ON THIS EXCLUSIVE OPPORTUNITY!!!',
      keywords: 'buy, money, cash, earn, profit, free, guaranteed, limited, exclusive'
    };

    const spamAnalysis = await contentQualityService.analyzeContentQuality(spamData);
    console.log(`❌ Spam Score: ${spamAnalysis.overallScore}/100`);
    console.log(`   Risk Level: ${spamAnalysis.riskLevel}`);
    console.log(`   Spam Score: ${spamAnalysis.spamScore}/100`);
    console.log(`   Found Keywords: ${spamAnalysis.spamScore > 0 ? 'Yes' : 'No'}`);
    console.log(`   Flags: ${spamAnalysis.flags.join(', ')}`);
    console.log('');

    // Test 3: Poor quality content
    console.log('📉 Test 3: Poor quality content');
    const poorQualityData = {
      name: 'Place',
      description: 'Good place. Nice. Visit here.',
      keywords: 'place, good, nice'
    };

    const poorQualityAnalysis = await contentQualityService.analyzeContentQuality(poorQualityData);
    console.log(`⚠️ Poor Quality Score: ${poorQualityAnalysis.overallScore}/100`);
    console.log(`   Risk Level: ${poorQualityAnalysis.riskLevel}`);
    console.log(`   Description Quality: ${poorQualityAnalysis.descriptionQuality.score}/100`);
    console.log(`   Issues: ${poorQualityAnalysis.descriptionQuality.issues.join(', ')}`);
    console.log(`   Flags: ${poorQualityAnalysis.flags.join(', ')}`);
    console.log('');

    // Test 4: Content with images
    console.log('📸 Test 4: Content with images');
    const imageData = {
      name: 'Beautiful Park',
      description: 'A beautiful park with walking trails and picnic areas. Perfect for family outings and outdoor activities.',
      keywords: 'park, walking, trails, picnic, family, outdoor',
      images: [
        {
          filename: 'park_photo.jpg',
          size: 1024 * 1024, // 1MB
          mimetype: 'image/jpeg'
        },
        {
          filename: 'stock_photo_generic.jpg',
          size: 500 * 1024, // 500KB
          mimetype: 'image/jpeg'
        }
      ]
    };

    const imageAnalysis = await contentQualityService.analyzeContentQuality(imageData);
    console.log(`📸 Image Analysis Score: ${imageAnalysis.overallScore}/100`);
    console.log(`   Image Quality: ${imageAnalysis.imageQuality.score}/100`);
    console.log(`   Valid Images: ${imageAnalysis.imageQuality.validImages}/${imageAnalysis.imageQuality.totalImages}`);
    console.log(`   Image Issues: ${imageAnalysis.imageQuality.issues.length}`);
    console.log(`   Image Flags: ${imageAnalysis.imageQuality.flags.join(', ')}`);
    console.log('');

    // Test 5: Suspicious patterns
    console.log('⚠️ Test 5: Suspicious patterns');
    const suspiciousData = {
      name: 'URGENT!!! HELP NEEDED!!!',
      description: 'This is an EMERGENCY!!! We need HELP!!! Please ACT NOW!!! Don\'t MISS OUT!!! This is your LAST CHANCE!!!',
      keywords: 'urgent, emergency, help, act, miss, chance'
    };

    const suspiciousAnalysis = await contentQualityService.analyzeContentQuality(suspiciousData);
    console.log(`🚨 Suspicious Pattern Score: ${suspiciousAnalysis.overallScore}/100`);
    console.log(`   Risk Level: ${suspiciousAnalysis.riskLevel}`);
    console.log(`   Spam Score: ${suspiciousAnalysis.spamScore}/100`);
    console.log(`   Validation Passed: ${suspiciousAnalysis.contentValidation.passed}`);
    console.log(`   Validation Issues: ${suspiciousAnalysis.contentValidation.issues.join(', ')}`);
    console.log('');

    // Test 6: Empty content
    console.log('❌ Test 6: Empty content');
    const emptyData = {
      name: '',
      description: '',
      keywords: ''
    };

    const emptyAnalysis = await contentQualityService.analyzeContentQuality(emptyData);
    console.log(`❌ Empty Content Score: ${emptyAnalysis.overallScore}/100`);
    console.log(`   Risk Level: ${emptyAnalysis.riskLevel}`);
    console.log(`   Validation Passed: ${emptyAnalysis.contentValidation.passed}`);
    console.log(`   Validation Issues: ${emptyAnalysis.contentValidation.issues.join(', ')}`);
    console.log('');

    // Test 7: Test individual analysis functions
    console.log('🔍 Test 7: Individual analysis functions');

    // Test spam detection
    const spamDetection = contentQualityService.detectSpamKeywords(spamData);
    console.log(`   Spam Detection: Score ${spamDetection.score}, Keywords: ${spamDetection.foundKeywords.length}`);

    // Test description quality
    const descriptionQuality = contentQualityService.analyzeDescriptionQuality(highQualityData.description);
    console.log(`   Description Quality: Score ${descriptionQuality.score}, Metrics:`, descriptionQuality.metrics);

    // Test content validation
    const validation = contentQualityService.validateContent(highQualityData);
    console.log(`   Content Validation: Passed ${validation.passed}, Issues: ${validation.issues.length}`);

    // Test image quality
    const imageQuality = contentQualityService.analyzeImageQuality(imageData.images);
    console.log(`   Image Quality: Score ${imageQuality.score}, Valid: ${imageQuality.validImages}/${imageQuality.totalImages}`);

    console.log('');

    // Test 8: Risk level determination
    console.log('⚠️ Test 8: Risk level determination');
    const testCases = [
      { score: 85, spamScore: 10, expected: 'LOW' },
      { score: 70, spamScore: 25, expected: 'MEDIUM' },
      { score: 45, spamScore: 45, expected: 'HIGH' },
      { score: 25, spamScore: 80, expected: 'CRITICAL' }
    ];

    testCases.forEach((testCase, index) => {
      const mockAnalysis = {
        overallScore: testCase.score,
        spamScore: testCase.spamScore
      };
      const riskLevel = contentQualityService.determineRiskLevel(mockAnalysis);
      const passed = riskLevel === testCase.expected;
      console.log(`   Test ${index + 1}: Score ${testCase.score}, Spam ${testCase.spamScore} → ${riskLevel} ${passed ? '✅' : '❌'}`);
    });

    console.log('');

    // Test 9: Recommendations generation
    console.log('💡 Test 9: Recommendations generation');
    const recommendations = contentQualityService.generateRecommendations(poorQualityAnalysis);
    console.log(`   Generated ${recommendations.length} recommendations:`);
    recommendations.forEach((rec, index) => {
      console.log(`     ${index + 1}. ${rec}`);
    });

    console.log('');

    // Test 10: Threshold management
    console.log('⚙️ Test 10: Threshold management');
    const originalThresholds = contentQualityService.getThresholds();
    console.log(`   Original spam keywords: ${originalThresholds.spamKeywords.length}`);

    // Add a new spam keyword
    contentQualityService.updateThresholds({
      spamKeywords: ['test_spam_keyword']
    });

    const updatedThresholds = contentQualityService.getThresholds();
    console.log(`   Updated spam keywords: ${updatedThresholds.spamKeywords.length}`);

    // Test with new keyword
    const testWithNewKeyword = {
      name: 'Test location',
      description: 'This is a test location with test_spam_keyword in it.'
    };

    const newKeywordAnalysis = await contentQualityService.analyzeContentQuality(testWithNewKeyword);
    console.log(`   New keyword detection: ${newKeywordAnalysis.spamScore > 0 ? 'Detected' : 'Not detected'}`);

    console.log('\n✅ All content quality analysis tests completed successfully!');

  } catch (error) {
    console.error('❌ Content quality analysis test failed:', error);
  }
}

/**
 * Test content quality statistics
 */
async function testContentQualityStats() {
  console.log('\n📊 Testing Content Quality Statistics\n');

  try {
    const stats = await contentQualityService.getContentQualityStats('7d');
    console.log('Content Quality Statistics:');
    console.log(`   Total Locations: ${stats.totalLocations}`);
    console.log(`   Average Quality Score: ${stats.averageQualityScore}`);
    console.log(`   Spam Detections: ${stats.spamDetections}`);
    console.log(`   Quality Issues: ${stats.qualityIssues}`);
    console.log('   Risk Level Distribution:');
    Object.entries(stats.riskLevels).forEach(([level, count]) => {
      console.log(`     ${level}: ${count}`);
    });

    console.log('\n✅ Content quality statistics test completed!');

  } catch (error) {
    console.error('❌ Content quality statistics test failed:', error);
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('🚀 Starting Content Quality Analysis System Tests\n');
  
  await testContentQualityAnalysis();
  await testContentQualityStats();
  
  console.log('\n🎉 All content quality analysis tests completed!');
  process.exit(0);
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  });
}

module.exports = {
  testContentQualityAnalysis,
  testContentQualityStats,
  runAllTests
}; 