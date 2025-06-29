const { Location, LocationOwnership } = require('../models');
const PriceCalculationService = require('../services/priceCalculationService');
const locationTradingService = require('../services/locationTradingService');

async function testOfficialPricing() {
  try {
    console.log('🧪 Testing official location pricing...');
    
    // Test the specific location from the console log
    const locationId = 'e96f5620-1a60-42f5-9d0c-110d717885d4';
    
    console.log(`\n📍 Testing location: ${locationId}`);
    
    // Get the location
    const location = await Location.findByPk(locationId);
    if (!location) {
      console.log('❌ Location not found');
      return;
    }
    
    console.log(`Location.isOfficial: ${location.isOfficial}`);
    console.log(`Location.officialOwnerId: ${location.officialOwnerId}`);
    
    // Get ownership info
    const ownership = await LocationOwnership.findOne({
      where: { locationId }
    });
    
    if (ownership) {
      console.log(`Ownership.isOfficial: ${ownership.isOfficial}`);
      console.log(`Ownership.purchaseCount: ${ownership.purchaseCount}`);
      console.log(`Ownership.ownerId: ${ownership.ownerId}`);
      
      // Test pricing calculations
      const regularPrice = PriceCalculationService.calculatePrice(ownership.purchaseCount);
      const officialPrice = PriceCalculationService.calculateOfficialPrice(ownership.purchaseCount);
      
      console.log(`\n💰 Pricing Analysis:`);
      console.log(`Regular price (100 base): ${regularPrice} credits`);
      console.log(`Official price (900 base): ${officialPrice} credits`);
      console.log(`Price difference: ${officialPrice - regularPrice} credits`);
      
      // Test what the service would return
      const ownershipInfo = await locationTradingService.getLocationOwnership(locationId);
      console.log(`\n📊 Service Response:`);
      console.log(`Current Price: ${ownershipInfo.currentPrice} credits`);
      console.log(`Next Price: ${ownershipInfo.nextPrice} credits`);
      console.log(`Is Official: ${ownershipInfo.isOfficial}`);
      console.log(`Price Info Base Price: ${ownershipInfo.priceInfo.basePrice} credits`);
      
    } else {
      console.log('❌ No ownership record found');
    }
    
    // Test all official locations
    console.log('\n🔍 Testing all official locations:');
    const allOfficialLocations = await Location.findAll({
      where: { isOfficial: true },
      include: [{ model: LocationOwnership, as: 'ownership' }]
    });
    
    allOfficialLocations.forEach(loc => {
      const ownership = loc.ownership;
      if (ownership) {
        const regularPrice = PriceCalculationService.calculatePrice(ownership.purchaseCount);
        const officialPrice = PriceCalculationService.calculateOfficialPrice(ownership.purchaseCount);
        console.log(`Location ${loc.id}: Regular=${regularPrice}, Official=${officialPrice}, PurchaseCount=${ownership.purchaseCount}`);
      }
    });
    
  } catch (error) {
    console.error('❌ Error testing official pricing:', error);
  } finally {
    process.exit(0);
  }
}

// Run the test
testOfficialPricing(); 