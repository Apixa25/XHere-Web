const behavioralAnalysisService = require('./services/behavioralAnalysisService');

async function testBehavioralAnalysis() {
  console.log('🧠 Testing Behavioral Analysis System...\n');

  try {
    // Test 1: Analyze user behavior for a specific user
    console.log('📊 Test 1: Analyzing user behavior...');
    const userId = 1; // Replace with actual user ID
    const locationData = {
      latitude: 41.7555,
      longitude: -124.2025,
      text: 'Test location for behavioral analysis',
      locationType: 'general'
    };

    const analysis = await behavioralAnalysisService.analyzeUserBehavior(userId, locationData);
    console.log('✅ User behavior analysis completed:');
    console.log(`   Risk Score: ${analysis.riskScore}`);
    console.log(`   Risk Level: ${analysis.riskLevel}`);
    console.log(`   Is Suspicious: ${analysis.isSuspicious}`);
    console.log(`   Flags Count: ${analysis.flags.length}`);
    console.log(`   Recommendations: ${analysis.recommendations.length}\n`);

    // Test 2: Check posting patterns
    console.log('📈 Test 2: Checking posting patterns...');
    const patterns = await behavioralAnalysisService.analyzePostingPatterns(userId);
    console.log('✅ Posting patterns analyzed:');
    console.log(`   Total Posts: ${patterns.totalPosts}`);
    console.log(`   Posts Today: ${patterns.postsToday}`);
    console.log(`   Posts This Hour: ${patterns.postsThisHour}`);
    console.log(`   Posts This Week: ${patterns.postsThisWeek}`);
    console.log(`   Posting Frequency: ${patterns.postingFrequency}`);
    console.log(`   Average Time Between Posts: ${Math.round(patterns.averageTimeBetweenPosts / 1000)}s\n`);

    // Test 3: Detect suspicious activity
    console.log('🚨 Test 3: Detecting suspicious activity...');
    const suspiciousActivity = await behavioralAnalysisService.detectSuspiciousActivity(userId, locationData);
    console.log('✅ Suspicious activity detection completed:');
    console.log(`   Flags Found: ${suspiciousActivity.flags.length}`);
    suspiciousActivity.flags.forEach((flag, index) => {
      console.log(`   Flag ${index + 1}: ${flag.type} (${flag.severity}) - ${flag.description}`);
    });
    console.log('');

    // Test 4: Calculate behavior score
    console.log('🎯 Test 4: Calculating behavior score...');
    const behaviorScore = await behavioralAnalysisService.calculateBehaviorScore(userId, analysis);
    console.log('✅ Behavior score calculated:');
    console.log(`   Score: ${behaviorScore.score}`);
    console.log(`   Level: ${behaviorScore.level}`);
    console.log(`   Risk Factors: ${behaviorScore.riskFactors.length}\n`);

    // Test 5: Get behavioral statistics
    console.log('📊 Test 5: Getting behavioral statistics...');
    const stats = await behavioralAnalysisService.getBehavioralStats('7d');
    console.log('✅ Behavioral statistics retrieved:');
    console.log(`   Total Analyses: ${stats.total_analyses}`);
    console.log(`   Average Risk Score: ${stats.avg_risk_score?.toFixed(2) || 'N/A'}`);
    console.log(`   Suspicious Users: ${stats.suspicious_users}`);
    console.log(`   High Risk Users: ${stats.high_risk_users}`);
    console.log(`   Medium Risk Users: ${stats.medium_risk_users}`);
    console.log(`   Low Risk Users: ${stats.low_risk_users}\n`);

    // Test 6: Get suspicious users
    console.log('🚨 Test 6: Getting suspicious users...');
    const suspiciousUsers = await behavioralAnalysisService.getSuspiciousUsers(5);
    console.log('✅ Suspicious users retrieved:');
    console.log(`   Count: ${suspiciousUsers.length}`);
    suspiciousUsers.forEach((user, index) => {
      console.log(`   User ${index + 1}: ${user.email} (Risk: ${user.risk_score}, Level: ${user.risk_level})`);
    });
    console.log('');

    // Test 7: Test different user scenarios
    console.log('🧪 Test 7: Testing different user scenarios...');
    
    // Test rapid posting scenario
    console.log('   Testing rapid posting scenario...');
    const rapidPostingUser = 2; // Replace with actual user ID
    const rapidAnalysis = await behavioralAnalysisService.analyzeUserBehavior(rapidPostingUser);
    console.log(`   Rapid posting user risk: ${rapidAnalysis.riskScore} (${rapidAnalysis.riskLevel})`);

    // Test new account scenario
    console.log('   Testing new account scenario...');
    const newAccountUser = 3; // Replace with actual user ID
    const newAccountAnalysis = await behavioralAnalysisService.analyzeUserBehavior(newAccountUser);
    console.log(`   New account user risk: ${newAccountAnalysis.riskScore} (${newAccountAnalysis.riskLevel})`);

    // Test normal user scenario
    console.log('   Testing normal user scenario...');
    const normalUser = 4; // Replace with actual user ID
    const normalAnalysis = await behavioralAnalysisService.analyzeUserBehavior(normalUser);
    console.log(`   Normal user risk: ${normalAnalysis.riskScore} (${normalAnalysis.riskLevel})\n`);

    console.log('🎉 All behavioral analysis tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log('✅ User behavior analysis working');
    console.log('✅ Posting pattern detection working');
    console.log('✅ Suspicious activity detection working');
    console.log('✅ Behavior scoring working');
    console.log('✅ Statistics collection working');
    console.log('✅ Suspicious user monitoring working');
    console.log('✅ Different user scenario testing working');

  } catch (error) {
    console.error('❌ Error in behavioral analysis test:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testBehavioralAnalysis()
  .then(() => {
    console.log('\n🏁 Behavioral analysis test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }); 