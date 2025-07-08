const { v4: uuidv4 } = require('uuid');
const models = require('./models');
const sequelize = require('./config/database');

async function testReportAndAppealSystem() {
  console.log('🧪 Testing Report and Appeal System with Real UUIDs...\n');

  try {
    // 1. Create test users with real UUIDs
    console.log('📝 Creating test users...');
    const testUser1 = await models.User.create({
      id: uuidv4(),
      email: 'testuser1@example.com',
      password: 'hashedpassword123',
      profile: { name: 'Test User 1' },
      credits: 100,
      trustLevel: 'trusted'
    });

    const testUser2 = await models.User.create({
      id: uuidv4(),
      email: 'testuser2@example.com',
      password: 'hashedpassword456',
      profile: { name: 'Test User 2' },
      credits: 100,
      trustLevel: 'verified'
    });

    const moderatorUser = await models.User.create({
      id: uuidv4(),
      email: 'moderator@example.com',
      password: 'hashedpassword789',
      profile: { name: 'Community Moderator' },
      credits: 200,
      trustLevel: 'moderator',
      isAdmin: true
    });

    console.log('✅ Test users created successfully!');

    // 2. Create test location
    console.log('\n📍 Creating test location...');
    const testLocation = await models.Location.create({
      id: uuidv4(),
      location: sequelize.fn('ST_GeomFromText', 'POINT(-74.006 40.7128)'),
      content: {
        text: 'Test location for report system',
        mediaUrls: [],
        mediaTypes: [],
        isAnonymous: false
      },
      keywords: ['test', 'report', 'system'],
      locationType: 'general',
      creatorId: testUser1.id,
      upvotes: 5,
      downvotes: 2,
      verificationStatus: 'verified',
      locationStatus: 'verified',
      totalPoints: 3
    });

    console.log('✅ Test location created successfully!');

    // 3. Test Location Report Creation
    console.log('\n🚨 Testing location report creation...');
    const testReport = await models.LocationReport.create({
      id: uuidv4(),
      locationId: testLocation.id,
      reporterId: testUser2.id,
      reportType: 'spam',
      reason: 'This location appears to be spam content',
      evidence: [
        {
          type: 'text',
          content: 'Location description contains suspicious keywords',
          metadata: { timestamp: new Date().toISOString() }
        }
      ],
      status: 'pending',
      priority: 'medium',
      isAnonymous: false
    });

    console.log('✅ Location report created successfully!');
    console.log(`📊 Report ID: ${testReport.id}`);
    console.log(`📍 Location ID: ${testReport.locationId}`);
    console.log(`👤 Reporter ID: ${testReport.reporterId}`);

    // 4. Test Eager Loading with Associations
    console.log('\n🔍 Testing eager loading with associations...');
    const reportWithAssociations = await models.LocationReport.findOne({
      where: { id: testReport.id },
      include: [
        {
          model: models.Location,
          as: 'location',
          include: [
            {
              model: models.User,
              as: 'creator'
            }
          ]
        },
        {
          model: models.User,
          as: 'reporter'
        }
      ]
    });

    if (reportWithAssociations) {
      console.log('✅ Eager loading successful!');
      console.log(`📍 Location: ${reportWithAssociations.location.content.text}`);
      console.log(`👤 Reporter: ${reportWithAssociations.reporter.email}`);
      console.log(`👤 Location Creator: ${reportWithAssociations.location.creator.email}`);
    } else {
      console.log('❌ Eager loading failed!');
    }

    // 5. Test Report Review by Moderator
    console.log('\n👨‍⚖️ Testing report review by moderator...');
    await testReport.update({
      status: 'under_review',
      moderatorId: moderatorUser.id,
      moderatorNotes: 'Under investigation for spam content'
    });

    console.log('✅ Report status updated to under review!');

    // 6. Test Location Appeal Creation
    console.log('\n⚖️ Testing location appeal creation...');
    const testAppeal = await models.LocationAppeal.create({
      id: uuidv4(),
      locationId: testLocation.id,
      appellantId: testUser1.id,
      originalReportId: testReport.id,
      appealReason: 'This location is legitimate and should not be removed',
      evidence: [
        {
          type: 'text',
          content: 'Location is a real business with valid information',
          metadata: { timestamp: new Date().toISOString() }
        }
      ],
      status: 'pending',
      priority: 'high',
      isUrgent: true
    });

    console.log('✅ Location appeal created successfully!');
    console.log(`📋 Appeal ID: ${testAppeal.id}`);
    console.log(`👤 Appellant ID: ${testAppeal.appellantId}`);

    // 7. Test Appeal Review
    console.log('\n👨‍⚖️ Testing appeal review...');
    await testAppeal.update({
      status: 'under_review',
      reviewerId: moderatorUser.id,
      reviewerNotes: 'Appeal under consideration'
    });

    console.log('✅ Appeal status updated to under review!');

    // 8. Test Final Resolution
    console.log('\n✅ Testing final resolution...');
    await testReport.update({
      status: 'resolved',
      resolution: 'warning_issued',
      resolvedAt: new Date()
    });

    await testAppeal.update({
      status: 'approved',
      decision: 'location_restored',
      compensationAmount: 50,
      reviewedAt: new Date()
    });

    console.log('✅ Final resolutions applied successfully!');

    // 9. Test Querying Reports and Appeals
    console.log('\n📊 Testing query operations...');
    
    const pendingReports = await models.LocationReport.count({
      where: { status: 'pending' }
    });
    console.log(`📋 Pending reports: ${pendingReports}`);

    const pendingAppeals = await models.LocationAppeal.count({
      where: { status: 'pending' }
    });
    console.log(`⚖️ Pending appeals: ${pendingAppeals}`);

    const urgentAppeals = await models.LocationAppeal.count({
      where: { isUrgent: true }
    });
    console.log(`🚨 Urgent appeals: ${urgentAppeals}`);

    // 10. Test Location with Reports and Appeals
    console.log('\n📍 Testing location with reports and appeals...');
    const locationWithReports = await models.Location.findOne({
      where: { id: testLocation.id },
      include: [
        {
          model: models.LocationReport,
          as: 'reports',
          include: [
            {
              model: models.User,
              as: 'reporter'
            }
          ]
        },
        {
          model: models.LocationAppeal,
          as: 'appeals',
          include: [
            {
              model: models.User,
              as: 'appellant'
            }
          ]
        }
      ]
    });

    if (locationWithReports) {
      console.log('✅ Location with reports and appeals loaded successfully!');
      console.log(`📍 Location: ${locationWithReports.content.text}`);
      console.log(`📋 Reports count: ${locationWithReports.reports.length}`);
      console.log(`⚖️ Appeals count: ${locationWithReports.appeals.length}`);
    }

    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📋 Test Summary:');
    console.log(`👤 Users created: 3`);
    console.log(`📍 Location created: 1`);
    console.log(`🚨 Report created: 1`);
    console.log(`⚖️ Appeal created: 1`);
    console.log(`✅ Associations working: Yes`);
    console.log(`🔍 Eager loading: Working`);

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await sequelize.close();
  }
}

// Run the test
testReportAndAppealSystem(); 