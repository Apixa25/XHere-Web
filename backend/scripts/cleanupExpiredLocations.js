const cleanupService = require('../services/cleanupService');

async function cleanupExpiredLocations() {
  try {
    const now = new Date();
    console.log(`\n=== Running Cleanup at ${now.toISOString()} ===`);

    // Use the sophisticated cleanup service instead of basic deletion
    const result = await cleanupService.cleanupAllExpiredLocations();
    
    console.log(`Cleanup completed: ${result.deletedCount} locations deleted, ${result.totalProcessed} total processed`);

    return result.deletedCount;
  } catch (error) {
    console.error('Cleanup error:', error);
    return 0;
  }
}

function scheduleCleanup() {
  setInterval(cleanupExpiredLocations, 60000); // Run every minute
}

module.exports = {
  cleanupExpiredLocations,
  scheduleCleanup
};