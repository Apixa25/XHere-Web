const Location = require('../models/Location');
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const LocationComment = require('../models/LocationComment');
const LocationNomination = require('../models/LocationNomination');
const LocationOwnership = require('../models/LocationOwnership');
const LocationOwnershipHistory = require('../models/LocationOwnershipHistory');
const Message = require('../models/Message');
const NominationVote = require('../models/NominationVote');

class CleanupService {
  /**
   * Clean up all related records for a location before deletion
   * This handles foreign key constraints properly
   */
  async cleanupLocationDependencies(locationId, transaction) {
    try {
      console.log(`🧹 Cleaning up dependencies for location ${locationId}...`);
      
      // Delete in order of dependency (child records first)
      
      // 1. Delete nomination votes (references nominations)
      const nominationVotesDeleted = await NominationVote.destroy({
        where: {
          nominationId: {
            [Op.in]: sequelize.literal(`(
              SELECT id FROM "LocationNominations" 
              WHERE "locationId" = '${locationId}'
            )`)
          }
        },
        transaction
      });
      console.log(`🗑️ Deleted ${nominationVotesDeleted} nomination votes`);
      
      // 2. Delete location nominations
      const nominationsDeleted = await LocationNomination.destroy({
        where: { locationId },
        transaction
      });
      console.log(`🗑️ Deleted ${nominationsDeleted} location nominations`);
      
      // 3. Delete location comments
      const commentsDeleted = await LocationComment.destroy({
        where: { locationId },
        transaction
      });
      console.log(`🗑️ Deleted ${commentsDeleted} location comments`);
      
      // 4. Delete location ownership history
      const ownershipHistoryDeleted = await LocationOwnershipHistory.destroy({
        where: { locationId },
        transaction
      });
      console.log(`🗑️ Deleted ${ownershipHistoryDeleted} ownership history records`);
      
      // 5. Delete location ownership
      const ownershipDeleted = await LocationOwnership.destroy({
        where: { locationId },
        transaction
      });
      console.log(`🗑️ Deleted ${ownershipDeleted} ownership records`);
      
      // 6. Delete messages referencing this location
      const messagesDeleted = await Message.destroy({
        where: { locationId },
        transaction
      });
      console.log(`🗑️ Deleted ${messagesDeleted} messages referencing location`);
      
      return {
        nominationVotesDeleted,
        nominationsDeleted,
        commentsDeleted,
        ownershipHistoryDeleted,
        ownershipDeleted,
        messagesDeleted
      };
      
    } catch (error) {
      console.error(`❌ Error cleaning up dependencies for location ${locationId}:`, error);
      throw error;
    }
  }

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
          // Clean up dependencies first
          await this.cleanupLocationDependencies(location.id, transaction);
          
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
          // Clean up dependencies first
          await this.cleanupLocationDependencies(location.id, transaction);
          
          // Delete this location
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
            // Clean up dependencies first
            await this.cleanupLocationDependencies(location.id, transaction);
            
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