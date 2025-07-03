const { Location, User } = require('../models');
const sequelize = require('../config/database');

async function updateRequiresApproval() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Get all locations with their creators
    const locations = await Location.findAll({
      include: [{
        model: User,
        as: 'creator',
        attributes: ['id', 'email', 'trustLevel']
      }]
    });

    console.log(`📍 Found ${locations.length} total locations`);

    let updatedCount = 0;
    let pendingCount = 0;

    for (const location of locations) {
      const creator = location.creator;
      if (!creator) {
        console.log(`⚠️ Location ${location.id} has no creator, skipping`);
        continue;
      }

      // Determine if location should require approval based on trust level
      let shouldRequireApproval = false;
      
      if (creator.trustLevel === 'new') {
        shouldRequireApproval = true;
      } else if (creator.trustLevel === 'trusted') {
        // Trusted users might need approval for certain location types
        shouldRequireApproval = location.locationType !== 'general';
      } else if (creator.trustLevel === 'verified') {
        // Verified users typically don't need approval
        shouldRequireApproval = false;
      }

      // Update the location if requiresApproval needs to change
      if (location.requiresApproval !== shouldRequireApproval) {
        await location.update({
          requiresApproval: shouldRequireApproval,
          locationStatus: shouldRequireApproval ? 'pending' : 'verified'
        });
        
        updatedCount++;
        if (shouldRequireApproval) {
          pendingCount++;
        }
        
        console.log(`✅ Updated location ${location.id}: requiresApproval=${shouldRequireApproval}, status=${shouldRequireApproval ? 'pending' : 'verified'} (${creator.trustLevel} user: ${creator.email})`);
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`📍 Total locations processed: ${locations.length}`);
    console.log(`📍 Locations updated: ${updatedCount}`);
    console.log(`📍 Locations now pending approval: ${pendingCount}`);

    // Show breakdown by trust level
    const breakdown = await Location.findAll({
      attributes: [
        'requiresApproval',
        'locationStatus',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      include: [{
        model: User,
        as: 'creator',
        attributes: ['trustLevel']
      }],
      group: ['requiresApproval', 'locationStatus', 'creator.trustLevel'],
      raw: true
    });

    console.log(`\n📋 Breakdown by trust level:`);
    breakdown.forEach(item => {
      console.log(`📍 ${item.creator.trustLevel} users: ${item.count} locations (requiresApproval=${item.requiresApproval}, status=${item.locationStatus})`);
    });

  } catch (error) {
    console.error('❌ Error updating requiresApproval:', error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

updateRequiresApproval(); 