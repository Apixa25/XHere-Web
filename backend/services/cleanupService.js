const Location = require('../models/Location');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

class CleanupService {
  /**
   * Clean up expired general locations
   * Deletes general locations older than 7 days unless they have 2+ positive ratings
   */
  async cleanupExpiredGeneralLocations() {
    const transaction = await sequelize.transaction();
    
    try {
      console.log('🧹 Starting cleanup of expired general locations...');
      
      // Find general locations that are older than 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const expiredLocations = await Location.findAll({
        where: {
          locationType: 'general',
          createdAt: {
            [Op.lt]: sevenDaysAgo
          },
          deleteAt: {
            [Op.lt]: new Date()
          }
        },
        transaction
      });
      
      console.log(`Found ${expiredLocations.length} expired general locations`);
      
      let deletedCount = 0;
      let preservedCount = 0;
      
      for (const location of expiredLocations) {
        // Check if location has 2+ positive ratings (upvotes - downvotes >= 2)
        const totalPoints = location.totalPoints || 0;
        
        if (totalPoints >= 2) {
          // Preserve this location - remove auto-delete flag
          await location.update({
            autoDelete: false,
            deleteAt: null
          }, { transaction });
          
          preservedCount++;
          console.log(`✅ Preserved general location ${location.id} with ${totalPoints} points`);
        } else {
          // Delete this location
          await location.destroy({ transaction });
          deletedCount++;
          console.log(`🗑️ Deleted expired general location ${location.id} with ${totalPoints} points`);
        }
      }
      
      await transaction.commit();
      
      console.log(`🧹 Cleanup completed: ${deletedCount} deleted, ${preservedCount} preserved`);
      
      return {
        deletedCount,
        preservedCount,
        totalProcessed: expiredLocations.length
      };
      
    } catch (error) {
      await transaction.rollback();
      console.error('Error during cleanup:', error);
      throw error;
    }
  }
  
  /**
   * Clean up all expired locations (not just general)
   * This handles user-specified auto-delete times
   */
  async cleanupAllExpiredLocations() {
    const transaction = await sequelize.transaction();
    
    try {
      console.log('🧹 Starting cleanup of all expired locations...');
      
      const expiredLocations = await Location.findAll({
        where: {
          autoDelete: true,
          deleteAt: {
            [Op.lt]: new Date()
          }
        },
        transaction
      });
      
      console.log(`Found ${expiredLocations.length} expired locations`);
      
      let deletedCount = 0;
      
      for (const location of expiredLocations) {
        // For non-general locations, always delete if expired
        if (location.locationType !== 'general') {
          await location.destroy({ transaction });
          deletedCount++;
          console.log(`🗑️ Deleted expired ${location.locationType} location ${location.id}`);
        } else {
          // For general locations, check rating threshold
          const totalPoints = location.totalPoints || 0;
          
          if (totalPoints >= 2) {
            // Preserve this location
            await location.update({
              autoDelete: false,
              deleteAt: null
            }, { transaction });
            
            console.log(`✅ Preserved general location ${location.id} with ${totalPoints} points`);
          } else {
            // Delete this location
            await location.destroy({ transaction });
            deletedCount++;
            console.log(`🗑️ Deleted expired general location ${location.id} with ${totalPoints} points`);
          }
        }
      }
      
      await transaction.commit();
      
      console.log(`🧹 All locations cleanup completed: ${deletedCount} deleted`);
      
      return {
        deletedCount,
        totalProcessed: expiredLocations.length
      };
      
    } catch (error) {
      await transaction.rollback();
      console.error('Error during cleanup:', error);
      throw error;
    }
  }
  
  /**
   * Get cleanup statistics
   */
  async getCleanupStats() {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const stats = await Location.findAll({
        where: {
          locationType: 'general',
          createdAt: {
            [Op.lt]: sevenDaysAgo
          }
        },
        attributes: [
          'id',
          'totalPoints',
          'autoDelete',
          'deleteAt',
          'createdAt'
        ]
      });
      
      const expiredCount = stats.filter(loc => loc.deleteAt && loc.deleteAt < new Date()).length;
      const preservedCount = stats.filter(loc => loc.totalPoints >= 2).length;
      const toBeDeletedCount = expiredCount - preservedCount;
      
      return {
        totalGeneralLocationsOlderThan7Days: stats.length,
        expiredCount,
        preservedCount,
        toBeDeletedCount
      };
    } catch (error) {
      console.error('Error getting cleanup stats:', error);
      throw error;
    }
  }
}

module.exports = new CleanupService(); 