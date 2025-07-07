const Location = require('../models/Location');
const User = require('../models/User');
const locationStatusService = require('../services/locationStatusService');
const sequelize = require('../config/database');

async function fixLocationStatuses() {
  console.log('🔧 Fixing Location Status Discrepancies...\n');

  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Get all locations
    const allLocations = await Location.findAll({
      include: [{
        model: User,
        as: 'creator',
        attributes: ['email', 'trustLevel']
      }],
      order: [['createdAt', 'DESC']]
    });

    console.log(`📊 Total locations to check: ${allLocations.length}`);

    let updatedCount = 0;
    let verifiedCount = 0;
    let pendingCount = 0;
    let flaggedCount = 0;

    // Update each location's status based on actual voting data
    for (const location of allLocations) {
      const upvotes = location.upvotes || 0;
      const downvotes = location.downvotes || 0;
      const currentStatus = location.locationStatus;
      
      let expectedStatus = 'pending';
      
      // Determine expected status based on voting data
      if (upvotes >= 5) {
        expectedStatus = 'verified';
      } else if (downvotes >= 5) {
        expectedStatus = 'flagged';
      } else if (currentStatus === 'flagged' && downvotes < 5 && upvotes >= 2) {
        expectedStatus = 'pending';
      }

      // Update if status doesn't match expected
      if (currentStatus !== expectedStatus) {
        console.log(`📍 Updating location ${location.id}:`);
        console.log(`   Creator: ${location.creator?.email || 'Unknown'}`);
        console.log(`   Current: ${currentStatus} → Expected: ${expectedStatus}`);
        console.log(`   Upvotes: ${upvotes}, Downvotes: ${downvotes}`);
        
        try {
          const result = await locationStatusService.updateLocationStatus(location.id);
          
          if (result.statusChanged) {
            updatedCount++;
            console.log(`   ✅ Updated: ${result.previousStatus} → ${result.newStatus}`);
            
            // Count the new status
            if (result.newStatus === 'verified') verifiedCount++;
            else if (result.newStatus === 'pending') pendingCount++;
            else if (result.newStatus === 'flagged') flaggedCount++;
          } else {
            console.log(`   ℹ️ No change needed`);
          }
        } catch (error) {
          console.log(`   ❌ Error updating: ${error.message}`);
        }
        console.log('');
      }
    }

    // Get final statistics
    const finalStats = await locationStatusService.getStatusStats();
    
    console.log('📊 FINAL STATUS DISTRIBUTION:');
    console.log(`  Pending: ${finalStats.pending}`);
    console.log(`  Verified: ${finalStats.verified}`);
    console.log(`  Flagged: ${finalStats.flagged}`);
    console.log(`  Removed: ${finalStats.removed}`);
    console.log(`  Total: ${finalStats.total}`);

    console.log(`\n✅ Status fix completed!`);
    console.log(`   Updated ${updatedCount} locations`);
    console.log(`   Verified locations: ${finalStats.verified} (should match locations with 5+ upvotes)`);

    // Verify the fix
    const actuallyVerified = allLocations.filter(loc => (loc.upvotes || 0) >= 5).length;
    console.log(`\n🔍 VERIFICATION:`);
    console.log(`   Locations with 5+ upvotes: ${actuallyVerified}`);
    console.log(`   Locations marked as verified: ${finalStats.verified}`);
    
    if (actuallyVerified === finalStats.verified) {
      console.log(`   ✅ Perfect match! Status filter should now be accurate.`);
    } else {
      console.log(`   ⚠️ Still have discrepancy. Manual review needed.`);
    }

  } catch (error) {
    console.error('❌ Error fixing location statuses:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the fix
fixLocationStatuses(); 