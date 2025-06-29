const { Location, LocationOwnership } = require('../models');
const sequelize = require('../config/database');

async function fixSpecificLocation() {
  const transaction = await sequelize.transaction();
  
  try {
    const locationId = '07c42e41-2622-4ad9-bd93-ef667d1edd10';
    
    console.log(`🔧 Fixing specific location: ${locationId}`);
    
    // Get the location
    const location = await Location.findByPk(locationId, { transaction });
    if (!location) {
      console.log('❌ Location not found');
      return;
    }
    
    console.log(`Location.isOfficial: ${location.isOfficial}`);
    console.log(`Location.officialOwnerId: ${location.officialOwnerId}`);
    
    // Get ownership record
    let ownership = await LocationOwnership.findOne({
      where: { locationId },
      transaction
    });
    
    if (!ownership) {
      console.log('Creating ownership record...');
      ownership = await LocationOwnership.create({
        locationId,
        ownerId: location.officialOwnerId || location.creatorId,
        currentPrice: 100,
        purchaseCount: 0,
        isOfficial: true
      }, { transaction });
    } else {
      console.log(`Current ownership.isOfficial: ${ownership.isOfficial}`);
      console.log(`Current ownership.ownerId: ${ownership.ownerId}`);
      console.log(`Should be ownerId: ${location.officialOwnerId || location.creatorId}`);
      
      // Update ownership record
      await ownership.update({
        isOfficial: true,
        ownerId: location.officialOwnerId || location.creatorId
      }, { transaction });
      
      console.log('✅ Updated ownership record');
    }
    
    await transaction.commit();
    
    // Verify the fix
    const updatedOwnership = await LocationOwnership.findOne({
      where: { locationId }
    });
    
    console.log(`\n📊 Verification:`);
    console.log(`Ownership.isOfficial: ${updatedOwnership.isOfficial}`);
    console.log(`Ownership.ownerId: ${updatedOwnership.ownerId}`);
    
  } catch (error) {
    if (transaction && !transaction.finished) {
      await transaction.rollback();
    }
    console.error('❌ Error fixing location:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the fix
fixSpecificLocation(); 