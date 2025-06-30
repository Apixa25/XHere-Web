const Location = require('../models/Location');
const sequelize = require('../config/database');

class LocationStatusService {
  /**
   * Update location status based on current ratings
   * @param {string} locationId - Location ID to update
   * @param {Object} options - Options including transaction
   * @returns {Promise<Object>} Updated location and status change info
   */
  async updateLocationStatus(locationId, options = {}) {
    const transaction = options.transaction || await sequelize.transaction();
    const shouldCommit = !options.transaction;
    
    try {
      const location = await Location.findByPk(locationId, { transaction });
      
      if (!location) {
        throw new Error('Location not found');
      }

      const currentStatus = location.locationStatus;
      const upvotes = location.upvotes || 0;
      const downvotes = location.downvotes || 0;
      const totalPoints = location.totalPoints || 0;
      
      let newStatus = currentStatus;
      let statusReason = null;
      let statusChanged = false;

      // Check for verified status (5+ positive ratings)
      if (upvotes >= 5 && currentStatus !== 'verified') {
        newStatus = 'verified';
        statusReason = `${upvotes} positive ratings`;
        statusChanged = true;
      }
      // Check for flagged status (5+ negative ratings)
      else if (downvotes >= 5 && currentStatus !== 'flagged') {
        newStatus = 'flagged';
        statusReason = `${downvotes} negative ratings`;
        statusChanged = true;
      }
      // Reset to pending if ratings improve
      else if (currentStatus === 'flagged' && downvotes < 5 && upvotes >= 2) {
        newStatus = 'pending';
        statusReason = 'Ratings improved';
        statusChanged = true;
      }

      // Update location if status changed
      if (statusChanged) {
        await location.update({
          locationStatus: newStatus,
          statusUpdatedAt: new Date(),
          statusReason: statusReason
        }, { transaction });

        console.log(`📍 Location ${locationId} status changed: ${currentStatus} → ${newStatus} (${statusReason})`);
      }

      // For general locations, check if they should be preserved from auto-delete
      if (location.locationType === 'general' && totalPoints >= 2) {
        if (location.autoDelete) {
          await location.update({
            autoDelete: false,
            deleteAt: null
          }, { transaction });
          console.log(`✅ General location ${locationId} preserved from auto-delete (${totalPoints} points)`);
        }
      }

      if (shouldCommit) {
        await transaction.commit();
      }

      return {
        location: await Location.findByPk(locationId),
        statusChanged,
        previousStatus: currentStatus,
        newStatus,
        reason: statusReason
      };

    } catch (error) {
      if (shouldCommit) {
        await transaction.rollback();
      }
      console.error('Error updating location status:', error);
      throw error;
    }
  }

  /**
   * Get location status statistics
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Status statistics
   */
  async getStatusStats(options = {}) {
    try {
      const stats = await Location.findAll({
        attributes: [
          'locationStatus',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['locationStatus'],
        ...options
      });

      const statusCounts = {};
      stats.forEach(stat => {
        statusCounts[stat.locationStatus] = parseInt(stat.dataValues.count);
      });

      return {
        pending: statusCounts.pending || 0,
        verified: statusCounts.verified || 0,
        flagged: statusCounts.flagged || 0,
        removed: statusCounts.removed || 0,
        total: Object.values(statusCounts).reduce((sum, count) => sum + count, 0)
      };
    } catch (error) {
      console.error('Error getting status stats:', error);
      throw error;
    }
  }

  /**
   * Get locations by status
   * @param {string} status - Status to filter by
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Locations with specified status
   */
  async getLocationsByStatus(status, options = {}) {
    try {
      return await Location.findAll({
        where: { locationStatus: status },
        include: [{
          model: require('../models/User'),
          as: 'creator',
          attributes: ['id', 'email', 'profile']
        }],
        order: [['statusUpdatedAt', 'DESC']],
        ...options
      });
    } catch (error) {
      console.error('Error getting locations by status:', error);
      throw error;
    }
  }

  /**
   * Manually update location status (admin function)
   * @param {string} locationId - Location ID
   * @param {string} newStatus - New status
   * @param {string} reason - Reason for change
   * @param {Object} options - Options including transaction
   * @returns {Promise<Object>} Updated location
   */
  async manuallyUpdateStatus(locationId, newStatus, reason, options = {}) {
    const transaction = options.transaction || await sequelize.transaction();
    const shouldCommit = !options.transaction;
    
    try {
      const location = await Location.findByPk(locationId, { transaction });
      
      if (!location) {
        throw new Error('Location not found');
      }

      const previousStatus = location.locationStatus;
      
      await location.update({
        locationStatus: newStatus,
        statusUpdatedAt: new Date(),
        statusReason: reason
      }, { transaction });

      if (shouldCommit) {
        await transaction.commit();
      }

      console.log(`🔧 Manual status update: Location ${locationId} ${previousStatus} → ${newStatus} (${reason})`);

      return {
        location: await Location.findByPk(locationId),
        previousStatus,
        newStatus,
        reason
      };

    } catch (error) {
      if (shouldCommit) {
        await transaction.rollback();
      }
      console.error('Error manually updating status:', error);
      throw error;
    }
  }
}

module.exports = new LocationStatusService(); 