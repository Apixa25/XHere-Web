const cleanupService = require('../services/cleanupService');
const sequelize = require('../config/database');

/**
 * Scheduled cleanup job for expired locations
 * This script should be run daily via cron job
 */
async function runScheduledCleanup() {
  console.log('🕐 Starting scheduled cleanup job...');
  console.log('Timestamp:', new Date().toISOString());
  
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    
    // Get cleanup stats before running
    const statsBefore = await cleanupService.getCleanupStats();
    console.log('📊 Stats before cleanup:', statsBefore);
    
    // Run general locations cleanup
    const generalResult = await cleanupService.cleanupExpiredGeneralLocations();
    console.log('🧹 General locations cleanup result:', generalResult);
    
    // Run all locations cleanup (handles user-specified auto-delete)
    const allResult = await cleanupService.cleanupAllExpiredLocations();
    console.log('🧹 All locations cleanup result:', allResult);
    
    // Get cleanup stats after running
    const statsAfter = await cleanupService.getCleanupStats();
    console.log('📊 Stats after cleanup:', statsAfter);
    
    console.log('✅ Scheduled cleanup completed successfully');
    
    return {
      success: true,
      generalResult,
      allResult,
      statsBefore,
      statsAfter,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ Error during scheduled cleanup:', error);
    throw error;
  } finally {
    // Close database connection
    await sequelize.close();
    console.log('🔌 Database connection closed');
  }
}

// If this script is run directly (not imported)
if (require.main === module) {
  runScheduledCleanup()
    .then(result => {
      console.log('🎉 Cleanup job completed:', result);
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Cleanup job failed:', error);
      process.exit(1);
    });
}

module.exports = { runScheduledCleanup }; 