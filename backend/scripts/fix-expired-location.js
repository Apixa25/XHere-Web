const cleanupService = require('../services/cleanupService');
const sequelize = require('../config/database');

/**
 * Manual script to clean up the specific expired location
 * Location ID: ca15c9e5-76cd-450e-840b-8ae479cbd861
 */
async function fixExpiredLocation() {
  console.log('🔧 Fixing specific expired location...');
  
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    
    // Run the cleanup service
    const result = await cleanupService.cleanupAllExpiredLocations();
    
    console.log('✅ Cleanup completed successfully');
    console.log('📊 Results:', result);
    
    if (result.deletedCount > 0) {
      console.log(`🎉 Successfully deleted ${result.deletedCount} expired locations`);
    } else {
      console.log('ℹ️ No expired locations found to delete');
    }
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await sequelize.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the fix
fixExpiredLocation(); 