const Location = require('../models/Location');
const User = require('../models/User');
const { Op } = require('sequelize');

// Import the models index to ensure associations are loaded
require('../models/index');

async function testLocationFiltering() {
  console.log('🧪 Testing location filtering for map view...\n');

  try {
    // Test 1: Check all locations and their statuses
    console.log('📋 Test 1: All locations and their statuses');
    const allLocations = await Location.findAll({
      include: [{
        model: User,
        as: 'creator',
        attributes: ['email', 'trustLevel']
      }],
      order: [['createdAt', 'DESC']]
    });

    console.log(`Total locations in database: ${allLocations.length}`);
    
    const statusCounts = {};
    allLocations.forEach(location => {
      const status = location.locationStatus || 'unknown';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    
    console.log('Status breakdown:', statusCounts);

    // Test 2: Check what would be shown on map (approved/verified only)
    console.log('\n📋 Test 2: Locations that would show on map (approved/verified only)');
    const mapLocations = await Location.findAll({
      where: {
        locationStatus: {
          [Op.in]: ['verified', 'approved', 'active']
        }
      },
      include: [{
        model: User,
        as: 'creator',
        attributes: ['email', 'trustLevel']
      }],
      order: [['createdAt', 'DESC']]
    });

    console.log(`Locations that would show on map: ${mapLocations.length}`);
    mapLocations.forEach(location => {
      console.log(`- ${location.id}: ${location.locationStatus} (${location.creator.email} - ${location.creator.trustLevel})`);
    });

    // Test 3: Check pending locations (should NOT show on map)
    console.log('\n📋 Test 3: Pending locations (should NOT show on map)');
    const pendingLocations = await Location.findAll({
      where: {
        locationStatus: 'pending'
      },
      include: [{
        model: User,
        as: 'creator',
        attributes: ['email', 'trustLevel']
      }],
      order: [['createdAt', 'DESC']]
    });

    console.log(`Pending locations (should be hidden): ${pendingLocations.length}`);
    pendingLocations.forEach(location => {
      console.log(`- ${location.id}: ${location.locationStatus} (${location.creator.email} - ${location.creator.trustLevel})`);
    });

    // Test 4: Check locations by new users specifically
    console.log('\n📋 Test 4: Locations by new users');
    const newUserLocations = await Location.findAll({
      include: [{
        model: User,
        as: 'creator',
        attributes: ['email', 'trustLevel'],
        where: { trustLevel: 'new' }
      }],
      order: [['createdAt', 'DESC']]
    });

    console.log(`Locations by new users: ${newUserLocations.length}`);
    newUserLocations.forEach(location => {
      console.log(`- ${location.id}: ${location.locationStatus} (${location.creator.email})`);
    });

    console.log('\n✅ Location filtering test completed!');
    console.log('🎯 Expected behavior: Only approved/verified/active locations should show on map');

  } catch (error) {
    console.error('❌ Error testing location filtering:', error);
  }
}

// Run the test
testLocationFiltering().then(() => {
  console.log('🏁 Test script finished');
  process.exit(0);
}).catch(error => {
  console.error('💥 Test script failed:', error);
  process.exit(1);
}); 