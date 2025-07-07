const Location = require('../models/Location');
const User = require('../models/User');
const sequelize = require('../config/database');

async function checkVerifiedLocations() {
  console.log('🔍 Checking Verified Locations Discrepancy...\n');

  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Get all locations with their voting data
    const allLocations = await Location.findAll({
      include: [{
        model: User,
        as: 'creator',
        attributes: ['email', 'trustLevel']
      }],
      order: [['createdAt', 'DESC']]
    });

    console.log(`📊 Total locations in database: ${allLocations.length}`);

    // Check status distribution
    const statusCounts = {};
    allLocations.forEach(location => {
      const status = location.locationStatus || 'unknown';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    console.log('\n📋 Current Status Distribution:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`  ${status}: ${count} locations`);
    });

    // Check which locations are marked as verified
    const verifiedLocations = allLocations.filter(loc => loc.locationStatus === 'verified');
    console.log(`\n✅ Locations marked as 'verified' in database: ${verifiedLocations.length}`);

    // Check which locations actually have 5+ upvotes
    const actuallyVerifiedLocations = allLocations.filter(loc => (loc.upvotes || 0) >= 5);
    console.log(`👍 Locations with 5+ upvotes: ${actuallyVerifiedLocations.length}`);

    // Find the discrepancy
    const incorrectlyVerified = verifiedLocations.filter(loc => (loc.upvotes || 0) < 5);
    const shouldBeVerified = actuallyVerifiedLocations.filter(loc => loc.locationStatus !== 'verified');

    console.log(`\n🚨 DISCREPANCY FOUND:`);
    console.log(`  Locations marked as verified but have <5 upvotes: ${incorrectlyVerified.length}`);
    console.log(`  Locations with 5+ upvotes but not marked as verified: ${shouldBeVerified.length}`);

    if (incorrectlyVerified.length > 0) {
      console.log('\n❌ Incorrectly marked as verified:');
      incorrectlyVerified.forEach(location => {
        console.log(`  - ID: ${location.id}`);
        console.log(`    Creator: ${location.creator?.email || 'Unknown'}`);
        console.log(`    Upvotes: ${location.upvotes || 0}, Downvotes: ${location.downvotes || 0}`);
        console.log(`    Status: ${location.locationStatus}, Reason: ${location.statusReason || 'None'}`);
        console.log(`    Created: ${location.createdAt}`);
        console.log('');
      });
    }

    if (shouldBeVerified.length > 0) {
      console.log('\n✅ Should be verified but aren\'t:');
      shouldBeVerified.forEach(location => {
        console.log(`  - ID: ${location.id}`);
        console.log(`    Creator: ${location.creator?.email || 'Unknown'}`);
        console.log(`    Upvotes: ${location.upvotes || 0}, Downvotes: ${location.downvotes || 0}`);
        console.log(`    Status: ${location.locationStatus}, Reason: ${location.statusReason || 'None'}`);
        console.log(`    Created: ${location.createdAt}`);
        console.log('');
      });
    }

    // Check if there are any locations that should be updated
    console.log('\n🔧 RECOMMENDED ACTIONS:');
    
    if (incorrectlyVerified.length > 0) {
      console.log(`  1. Update ${incorrectlyVerified.length} locations from 'verified' to 'pending'`);
    }
    
    if (shouldBeVerified.length > 0) {
      console.log(`  2. Update ${shouldBeVerified.length} locations from 'pending' to 'verified'`);
    }

    if (incorrectlyVerified.length === 0 && shouldBeVerified.length === 0) {
      console.log('  ✅ All location statuses are correct!');
    }

    // Show some examples of verified locations
    console.log('\n📋 Examples of correctly verified locations:');
    const correctVerified = verifiedLocations.filter(loc => (loc.upvotes || 0) >= 5);
    correctVerified.slice(0, 3).forEach(location => {
      console.log(`  - ID: ${location.id}`);
      console.log(`    Creator: ${location.creator?.email || 'Unknown'}`);
      console.log(`    Upvotes: ${location.upvotes || 0}, Downvotes: ${location.downvotes || 0}`);
      console.log(`    Status: ${location.locationStatus}`);
      console.log('');
    });

    console.log('\n✅ Verification check completed!');

  } catch (error) {
    console.error('❌ Error checking verified locations:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the check
checkVerifiedLocations(); 