const Location = require('../models/Location');
const { Op } = require('sequelize');

async function cleanupExpiredLocations() {
  try {
    const now = new Date();
    console.log(`\n=== Running Cleanup at ${now.toISOString()} ===`);

    const expiredLocations = await Location.findAll({
      where: {
        autoDelete: true,
        deleteAt: {
          [Op.lt]: now
        }
      }
    });

    console.log(`Found ${expiredLocations.length} expired locations`);
    
    // Log details of each expired location
    expiredLocations.forEach(loc => {
      console.log('Expired location:', {
        id: loc.id,
        text: loc.text,
        deleteAt: loc.deleteAt,
        timePastDue: Math.round((now - new Date(loc.deleteAt)) / 1000 / 60) + ' minutes'
      });
    });

    if (expiredLocations.length > 0) {
      const deleted = await Location.destroy({
        where: {
          id: expiredLocations.map(loc => loc.id)
        }
      });
      console.log(`Successfully deleted ${deleted} locations`);
    }

    return expiredLocations.length;
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