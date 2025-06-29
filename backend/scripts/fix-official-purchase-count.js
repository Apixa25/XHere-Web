const { LocationOwnership } = require('../models');
const sequelize = require('../config/database');
const PriceCalculationService = require('../services/priceCalculationService');

async function fixOfficialPurchaseCounts() {
  const transaction = await sequelize.transaction();
  try {
    const officialOwnerships = await LocationOwnership.findAll({
      where: { isOfficial: true },
      transaction
    });

    for (const ownership of officialOwnerships) {
      await ownership.update({
        purchaseCount: 0,
        currentPrice: PriceCalculationService.OFFICIAL_BASE_PRICE
      }, { transaction });
      console.log(`Fixed ownership for location ${ownership.locationId}`);
    }

    await transaction.commit();
    console.log('✅ All official locations reset to purchaseCount=0 and currentPrice=900');
  } catch (err) {
    await transaction.rollback();
    console.error('❌ Error fixing official purchase counts:', err);
  }
}

fixOfficialPurchaseCounts(); 