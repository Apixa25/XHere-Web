const { Location, LocationOwnership } = require('../models');
const sequelize = require('../config/database');

async function syncOfficialStatus() {
  const transaction = await sequelize.transaction();
  
  try {
    console.log('🔄 Syncing official status between Location and LocationOwnership tables...');
    
    // Get all official locations
    const officialLocations = await Location.findAll({
      where: { isOfficial: true },
      attributes: ['id', 'isOfficial', 'officialOwnerId']
    });
    
    console.log(`Found ${officialLocations.length} official locations in Location table`);
    
    let updatedCount = 0;
    
    for (const location of officialLocations) {
      console.log(`Processing location ${location.id} (Official: ${location.isOfficial})`);
      
      // Find or create ownership record
      let ownership = await LocationOwnership.findOne({
        where: { locationId: location.id },
        transaction
      });
      
      if (!ownership) {
        console.log(`Creating ownership record for location ${location.id}`);
        ownership = await LocationOwnership.create({
          locationId: location.id,
          ownerId: location.officialOwnerId || location.creatorId,
          currentPrice: 100,
          purchaseCount: 0,
          isOfficial: false
        }, { transaction });
      }
      
      // Update ownership record if it's not marked as official
      if (!ownership.isOfficial) {
        console.log(`Updating ownership record for location ${location.id} to official`);
        await ownership.update({ 
          isOfficial: true,
          ownerId: location.officialOwnerId || location.creatorId
        }, { transaction });
        updatedCount++;
      } else {
        console.log(`Ownership record for location ${location.id} is already official`);
      }
    }
    
    // Also check for ownership records that are marked as official but shouldn't be
    const ownershipRecords = await LocationOwnership.findAll({
      where: { isOfficial: true },
      include: [{ model: Location, as: 'location' }],
      transaction
    });
    
    console.log(`Found ${ownershipRecords.length} ownership records marked as official`);
    
    for (const ownership of ownershipRecords) {
      if (!ownership.location || !ownership.location.isOfficial) {
        console.log(`Fixing ownership record ${ownership.id} - location is not official`);
        await ownership.update({ isOfficial: false }, { transaction });
        updatedCount++;
      }
    }
    
    await transaction.commit();
    
    console.log(`✅ Sync completed! Updated ${updatedCount} records.`);
    
    // Verify the sync (outside of transaction)
    const officialLocationsAfter = await Location.findAll({
      where: { isOfficial: true },
      include: [{ model: LocationOwnership, as: 'ownership' }]
    });
    
    console.log('\n📊 Verification:');
    officialLocationsAfter.forEach(loc => {
      const ownershipOfficial = loc.ownership?.isOfficial || false;
      console.log(`Location ${loc.id}: Location.isOfficial=${loc.isOfficial}, Ownership.isOfficial=${ownershipOfficial}`);
    });
    
  } catch (error) {
    if (transaction && !transaction.finished) {
      await transaction.rollback();
    }
    console.error('❌ Error syncing official status:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the sync
syncOfficialStatus(); 