const Location = require('../models/Location');
const User = require('../models/User');
const creditService = require('./creditService');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

class OfficialLocationService {
  /**
   * Make a location official (costs 3 credits)
   * @param {string} locationId - Location ID to make official
   * @param {string} userId - User making the location official
   * @param {Object} transaction - Database transaction (optional)
   * @param {boolean} adminOverride - Whether this is an admin override (optional)
   * @returns {Promise<Object>} Updated location and transaction details
   */
  async makeLocationOfficial(locationId, userId, transaction = null, adminOverride = false) {
    const shouldCommit = !transaction;
    if (!transaction) {
      transaction = await sequelize.transaction();
    }
    
    try {
      // Get the location
      const location = await Location.findByPk(locationId, {
        include: [{
          model: User,
          as: 'creator',
          attributes: ['id', 'email']
        }],
        transaction
      });

      if (!location) {
        throw new Error('Location not found');
      }

      // Check if location is already official
      if (location.isOfficial) {
        throw new Error('Location is already official');
      }

      // For non-admin actions, check credits and boundaries
      if (!adminOverride) {
        // Check if user has enough credits (3 credits required)
        const userBalance = await creditService.getBalance(userId);
        if (userBalance < 3) {
          throw new Error('Insufficient credits. Making a location official requires 3 credits.');
        }

        // Check for boundary conflicts (150-foot radius)
        const conflicts = await this.checkBoundaryConflicts(location.location, transaction);
        if (conflicts.length > 0) {
          throw new Error(`Cannot make location official. There are ${conflicts.length} official locations within 150 feet.`);
        }

        // Spend 3 credits
        await creditService.spendCredits(
          userId,
          3,
          'spend',
          {
            description: `Made location "${location.content.text}" official`,
            locationId: location.id,
            action: 'make_official'
          },
          { transaction }
        );
      }

      // Update location to official
      const officialBoundary = location.location; // Use the same point as boundary center
      await location.update({
        isOfficial: true,
        officialBoundary: officialBoundary,
        officialOwnerId: userId,
        officializedAt: new Date()
      }, { transaction });

      // Commit transaction if we created it
      if (shouldCommit) {
        await transaction.commit();
      }

      // Return updated location with associations
      const updatedLocation = await Location.findByPk(locationId, {
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'email', 'profile']
          },
          {
            model: User,
            as: 'officialOwner',
            attributes: ['id', 'email', 'profile']
          }
        ]
      });

      return {
        location: updatedLocation,
        message: adminOverride ? 'Location made official by admin!' : 'Location made official successfully!',
        creditsSpent: adminOverride ? 0 : 3
      };

    } catch (error) {
      if (shouldCommit) {
        await transaction.rollback();
      }
      console.error('Error making location official:', error);
      throw error;
    }
  }

  /**
   * Check for boundary conflicts within 150 feet
   * @param {Object} locationPoint - Location geometry point
   * @param {Object} transaction - Database transaction
   * @returns {Promise<Array>} Array of conflicting official locations
   */
  async checkBoundaryConflicts(locationPoint, transaction) {
    try {
      // Convert 150 feet to degrees (approximate)
      // 1 degree latitude ≈ 69 miles ≈ 364,320 feet
      // 150 feet ≈ 0.000411 degrees
      const radiusInDegrees = 0.000411;

      const conflicts = await Location.findAll({
        where: {
          isOfficial: true,
          location: sequelize.literal(`
            ST_DWithin(
              location::geometry,
              ST_SetSRID(ST_MakePoint(${locationPoint.coordinates[0]}, ${locationPoint.coordinates[1]}), 4326),
              ${radiusInDegrees}
            )
          `)
        },
        include: [{
          model: User,
          as: 'officialOwner',
          attributes: ['id', 'email']
        }],
        transaction
      });

      return conflicts;
    } catch (error) {
      console.error('Error checking boundary conflicts:', error);
      throw error;
    }
  }

  /**
   * Get all official locations
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of official locations
   */
  async getOfficialLocations(options = {}) {
    try {
      const query = {
        where: {
          isOfficial: true
        },
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'email', 'profile']
          },
          {
            model: User,
            as: 'officialOwner',
            attributes: ['id', 'email', 'profile']
          }
        ],
        order: [['officializedAt', 'DESC']]
      };

      if (options.limit) {
        query.limit = options.limit;
      }

      if (options.offset) {
        query.offset = options.offset;
      }

      return await Location.findAll(query);
    } catch (error) {
      console.error('Error getting official locations:', error);
      throw error;
    }
  }

  /**
   * Get official locations by user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of user's official locations
   */
  async getOfficialLocationsByUser(userId) {
    try {
      return await Location.findAll({
        where: {
          officialOwnerId: userId,
          isOfficial: true
        },
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'email', 'profile']
          },
          {
            model: User,
            as: 'officialOwner',
            attributes: ['id', 'email', 'profile']
          }
        ],
        order: [['officializedAt', 'DESC']]
      });
    } catch (error) {
      console.error('Error getting user official locations:', error);
      throw error;
    }
  }

  /**
   * Check if a location can be made official
   * @param {string} locationId - Location ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Validation result
   */
  async canMakeOfficial(locationId, userId) {
    try {
      const location = await Location.findByPk(locationId);
      if (!location) {
        return { canMake: false, reason: 'Location not found' };
      }

      if (location.isOfficial) {
        return { canMake: false, reason: 'Location is already official' };
      }

      const userBalance = await creditService.getBalance(userId);
      if (userBalance < 3) {
        return { 
          canMake: false, 
          reason: 'Insufficient credits',
          required: 3,
          available: userBalance
        };
      }

      const conflicts = await this.checkBoundaryConflicts(location.location);
      if (conflicts.length > 0) {
        return { 
          canMake: false, 
          reason: 'Boundary conflict',
          conflicts: conflicts.length
        };
      }

      return { canMake: true };
    } catch (error) {
      console.error('Error checking if can make official:', error);
      throw error;
    }
  }

  /**
   * Get official location statistics
   * @returns {Promise<Object>} Statistics about official locations
   */
  async getOfficialLocationStats() {
    try {
      const totalOfficial = await Location.count({
        where: { isOfficial: true }
      });

      const totalLocations = await Location.count();

      const officialPercentage = totalLocations > 0 ? (totalOfficial / totalLocations * 100).toFixed(2) : 0;

      return {
        totalOfficial,
        totalLocations,
        officialPercentage: parseFloat(officialPercentage)
      };
    } catch (error) {
      console.error('Error getting official location stats:', error);
      throw error;
    }
  }
}

module.exports = new OfficialLocationService(); 