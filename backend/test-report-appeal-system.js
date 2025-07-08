const ReportAppealService = require('./services/reportAppealService');
const sequelize = require('./config/database');

async function testReportAppealSystem() {
  try {
    console.log('🧪 Testing Report and Appeal System...\n');

    // Test 1: Submit a location report
    console.log('📝 Test 1: Submitting a location report');
    try {
      const reportData = {
        reportType: 'spam',
        reason: 'This location appears to be spam content',
        evidence: [
          {
            type: 'text',
            content: 'User reported multiple similar locations',
            timestamp: new Date().toISOString()
          }
        ],
        isAnonymous: false,
        contactEmail: 'test@example.com'
      };

      const reportResult = await ReportAppealService.submitReport(
        'test-location-id',
        'test-user-id',
        reportData
      );

      console.log('✅ Report submitted successfully:', reportResult);
    } catch (error) {
      console.log('❌ Report submission failed:', error.message);
    }

    // Test 2: Get reports for review
    console.log('\n🔍 Test 2: Getting reports for review');
    try {
      const reportsData = await ReportAppealService.getReportsForReview({
        limit: 10,
        offset: 0,
        status: 'pending'
      });

      console.log('✅ Reports retrieved:', reportsData.reports.length);
      console.log('📊 Pagination:', reportsData.pagination);
    } catch (error) {
      console.log('❌ Getting reports failed:', error.message);
    }

    // Test 3: Submit an appeal
    console.log('\n⚖️ Test 3: Submitting an appeal');
    try {
      const appealData = {
        appealReason: 'This location was incorrectly removed. It is a legitimate business.',
        evidence: [
          {
            type: 'text',
            content: 'Business license and photos attached',
            timestamp: new Date().toISOString()
          }
        ],
        contactEmail: 'business@example.com'
      };

      const appealResult = await ReportAppealService.submitAppeal(
        'test-location-id',
        'test-user-id',
        appealData
      );

      console.log('✅ Appeal submitted successfully:', appealResult);
    } catch (error) {
      console.log('❌ Appeal submission failed:', error.message);
    }

    // Test 4: Get appeals for review
    console.log('\n⚖️ Test 4: Getting appeals for review');
    try {
      const appealsData = await ReportAppealService.getAppealsForReview({
        limit: 10,
        offset: 0,
        status: 'pending'
      });

      console.log('✅ Appeals retrieved:', appealsData.appeals.length);
      console.log('📊 Pagination:', appealsData.pagination);
    } catch (error) {
      console.log('❌ Getting appeals failed:', error.message);
    }

    // Test 5: Get transparency data
    console.log('\n📊 Test 5: Getting transparency dashboard data');
    try {
      const transparencyData = await ReportAppealService.getTransparencyData('30d');
      
      console.log('✅ Transparency data retrieved');
      console.log('📈 Summary:', transparencyData.summary);
      console.log('📊 Report stats:', Object.keys(transparencyData.reportStats).length);
      console.log('⚖️ Appeal stats:', Object.keys(transparencyData.appealStats).length);
    } catch (error) {
      console.log('❌ Getting transparency data failed:', error.message);
    }

    // Test 6: Test priority calculation
    console.log('\n🎯 Test 6: Testing priority calculation');
    try {
      const highPriorityEvidence = [
        { type: 'text', content: 'Evidence 1' },
        { type: 'text', content: 'Evidence 2' },
        { type: 'text', content: 'Evidence 3' },
        { type: 'text', content: 'Evidence 4' }
      ];

      const priority = ReportAppealService.calculateReportPriority('offensive', highPriorityEvidence);
      console.log('✅ Priority calculated:', priority);
    } catch (error) {
      console.log('❌ Priority calculation failed:', error.message);
    }

    console.log('\n🎉 Report and Appeal System Tests Completed!');

  } catch (error) {
    console.error('❌ Test suite failed:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the tests
testReportAppealSystem(); 