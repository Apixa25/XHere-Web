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
  constructor() {
    this.cleanupHistory = [];
    this.maxHistorySize = 100; // Keep last 100 cleanup operations
  }

  /**
   * Add cleanup operation to history for monitoring
   */
  addToHistory(operation) {
    this.cleanupHistory.unshift({
      ...operation,
      timestamp: new Date(),
      id: Date.now() + Math.random()
    });
    
    // Keep only the last maxHistorySize operations
    if (this.cleanupHistory.length > this.maxHistorySize) {
      this.cleanupHistory = this.cleanupHistory.slice(0, this.maxHistorySize);
    }
  }

  /**
   * Get cleanup history for admin monitoring
   */
  getCleanupHistory() {
    return this.cleanupHistory;
  }

  /**
   * Get detailed cleanup statistics
   */
  async getDetailedCleanupStats() {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
      
      // Get all general locations older than 7 days
      const generalLocations = await Location.findAll({
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
          'createdAt',
          'upvotes',
          'downvotes'
        ]
      });
      
      // Get locations that will expire in the next 24 hours
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const expiringSoon = await Location.findAll({
        where: {
          autoDelete: true,
          deleteAt: {
            [Op.between]: [new Date(), tomorrow]
          }
        },
        attributes: [
          'id',
          'locationType',
          'totalPoints',
          'deleteAt',
          'createdAt'
        ]
      });
      
      // Calculate statistics
      const stats = {
        totalGeneralLocationsOlderThan7Days: generalLocations.length,
        expiredCount: generalLocations.filter(loc => loc.deleteAt && loc.deleteAt < new Date()).length,
        preservedCount: generalLocations.filter(loc => loc.totalPoints >= 2).length,
        toBeDeletedCount: generalLocations.filter(loc => 
          loc.deleteAt && loc.deleteAt < new Date() && loc.totalPoints < 2
        ).length,
        expiringSoon: expiringSoon.length,
        expiringSoonDetails: expiringSoon.map(loc => ({
          id: loc.id,
          locationType: loc.locationType,
          totalPoints: loc.totalPoints,
          deleteAt: loc.deleteAt,
          createdAt: loc.createdAt
        })),
        averagePoints: generalLocations.length > 0 
          ? generalLocations.reduce((sum, loc) => sum + (loc.totalPoints || 0), 0) / generalLocations.length 
          : 0,
        highQualityLocations: generalLocations.filter(loc => loc.totalPoints >= 5).length,
        lowQualityLocations: generalLocations.filter(loc => loc.totalPoints < 0).length,
        lastCleanupOperation: this.cleanupHistory[0] || null,
        cleanupHistory: this.cleanupHistory.slice(0, 10), // Last 10 operations
        systemHealth: this.getSystemHealthStatus(generalLocations, expiringSoon)
      };
      
      return stats;
    } catch (error) {
      console.error('Error getting detailed cleanup stats:', error);
      throw error;
    }
  }

  /**
   * Get system health status based on cleanup metrics
   */
  getSystemHealthStatus(generalLocations, expiringSoon) {
    const totalExpired = generalLocations.filter(loc => loc.deleteAt && loc.deleteAt < new Date()).length;
    const totalPreserved = generalLocations.filter(loc => loc.totalPoints >= 2).length;
    const expiringCount = expiringSoon.length;
    
    let status = 'healthy';
    let message = 'System is running normally';
    let priority = 'low';
    
    // Check for potential issues
    if (expiringCount > 50) {
      status = 'warning';
      message = `High number of locations expiring soon (${expiringCount})`;
      priority = 'medium';
    }
    
    if (totalExpired > 100) {
      status = 'warning';
      message = `Large number of expired locations (${totalExpired})`;
      priority = 'medium';
    }
    
    if (totalPreserved === 0 && generalLocations.length > 10) {
      status = 'concern';
      message = 'No high-quality general locations found';
      priority = 'high';
    }
    
    return {
      status,
      message,
      priority,
      metrics: {
        totalExpired,
        totalPreserved,
        expiringCount,
        qualityRatio: generalLocations.length > 0 ? (totalPreserved / generalLocations.length) : 0
      }
    };
  }

  /**
   * Send cleanup notification (placeholder for future notification system)
   */
  async sendCleanupNotification(operation) {
    try {
      // Log the notification for now
      console.log('🧹 CLEANUP NOTIFICATION:', {
        type: operation.type,
        timestamp: new Date().toISOString(),
        deletedCount: operation.deletedCount,
        preservedCount: operation.preservedCount || 0,
        totalProcessed: operation.totalProcessed,
        message: `Cleanup operation completed: ${operation.deletedCount} locations deleted, ${operation.preservedCount || 0} preserved`
      });
      
      // Future: Send to notification service, email, Slack, etc.
      // await notificationService.send({
      //   type: 'cleanup_completed',
      //   data: operation,
      //   recipients: ['admin@xhere.world']
      // });
      
    } catch (error) {
      console.error('Error sending cleanup notification:', error);
    }
  }

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
      const deletedLocationIds = [];
      const preservedLocationIds = [];
      
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
          preservedLocationIds.push(location.id);
          console.log(`✅ Preserved general location ${location.id} with ${totalPoints} points`);
        } else {
          // Clean up dependencies first
          await this.cleanupLocationDependencies(location.id, transaction);
          
          // Delete this location
          await location.destroy({ transaction });
          deletedCount++;
          deletedLocationIds.push(location.id);
          console.log(`🗑️ Deleted expired general location ${location.id} with ${totalPoints} points`);
        }
      }
      
      await transaction.commit();
      
      // Add to cleanup history
      const operation = {
        type: 'general_cleanup',
        deletedCount,
        preservedCount,
        totalProcessed: expiredLocations.length,
        deletedLocationIds,
        preservedLocationIds,
        timestamp: new Date()
      };
      
      this.addToHistory(operation);
      
      // Send notification
      await this.sendCleanupNotification(operation);
      
      console.log(`🧹 Cleanup completed: ${deletedCount} deleted, ${preservedCount} preserved`);
      
      return {
        deletedCount,
        preservedCount,
        totalProcessed: expiredLocations.length,
        operation
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
      const deletedLocationIds = [];
      const deletedLocationTypes = {};
      
      for (const location of expiredLocations) {
        // For non-general locations, always delete if expired
        if (location.locationType !== 'general') {
          // Clean up dependencies first
          await this.cleanupLocationDependencies(location.id, transaction);
          
          // Delete this location
          await location.destroy({ transaction });
          deletedCount++;
          deletedLocationIds.push(location.id);
          
          // Track by location type
          deletedLocationTypes[location.locationType] = (deletedLocationTypes[location.locationType] || 0) + 1;
          
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
            deletedLocationIds.push(location.id);
            deletedLocationTypes.general = (deletedLocationTypes.general || 0) + 1;
            
            console.log(`🗑️ Deleted expired general location ${location.id} with ${totalPoints} points`);
          }
        }
      }
      
      await transaction.commit();
      
      // Add to cleanup history
      const operation = {
        type: 'all_locations_cleanup',
        deletedCount,
        totalProcessed: expiredLocations.length,
        deletedLocationIds,
        deletedLocationTypes,
        timestamp: new Date()
      };
      
      this.addToHistory(operation);
      
      // Send notification
      await this.sendCleanupNotification(operation);
      
      console.log(`🧹 All locations cleanup completed: ${deletedCount} deleted`);
      
      return {
        deletedCount,
        totalProcessed: expiredLocations.length,
        operation
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