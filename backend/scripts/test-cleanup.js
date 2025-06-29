const cleanupService = require('../services/cleanupService');
const sequelize = require('../config/database');

/**
 * Test script for the cleanup system
 */
async function testCleanup() {
  console.log('🧪 Testing cleanup system...');
  
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    
    // Get cleanup stats
    console.log('\n📊 Getting cleanup stats...');
    const stats = await cleanupService.getCleanupStats();
    console.log('Cleanup stats:', stats);
    
    // Test general locations cleanup
    console.log('\n🧹 Testing general locations cleanup...');
    const generalResult = await cleanupService.cleanupExpiredGeneralLocations();
    console.log('General cleanup result:', generalResult);
    
    // Test all locations cleanup
    console.log('\n🧹 Testing all locations cleanup...');
    const allResult = await cleanupService.cleanupAllExpiredLocations();
    console.log('All locations cleanup result:', allResult);
    
    console.log('\n✅ Cleanup tests completed successfully');
    
  } catch (error) {
    console.error('❌ Error during cleanup test:', error);
  } finally {
    await sequelize.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testCleanup()
    .then(() => {
      console.log('🎉 Test completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Test failed:', error);
      process.exit(1);
    });
}

module.exports = { testCleanup }; 