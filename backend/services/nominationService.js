const Location = require('../models/Location');
const User = require('../models/User');
const LocationNomination = require('../models/LocationNomination');
const NominationVote = require('../models/NominationVote');
const creditService = require('./creditService');
const officialLocationService = require('./officialLocationService');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

class NominationService {
  /**
   * Create a nomination for a location (Community Path)
   * @param {string} locationId - Location ID to nominate
   * @param {string} nominatorId - User creating the nomination
   * @param {string} reason - Reason for nomination
   * @returns {Promise<Object>} Nomination details
   */
  async createNomination(locationId, nominatorId, reason = null) {
    const transaction = await sequelize.transaction();
    
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

      // Check if nominator is the creator (should use creator path instead)
      if (location.creatorId === nominatorId) {
        throw new Error('You cannot nominate your own location. Use "Make Official" instead.');
      }

      // Check if there's already a pending nomination for this location
      const existingNomination = await LocationNomination.findOne({
        where: {
          locationId,
          status: 'pending'
        },
        transaction
      });

      if (existingNomination) {
        throw new Error('This location already has a pending nomination');
      }

      // Check if user has enough credits (5 credits required for nomination)
      const userBalance = await creditService.getBalance(nominatorId);
      if (userBalance < 5) {
        throw new Error('Insufficient credits. Creating a nomination requires 5 credits.');
      }

      // Check for boundary conflicts (150-foot radius)
      const conflicts = await officialLocationService.checkBoundaryConflicts(location.location, transaction);
      if (conflicts.length > 0) {
        throw new Error(`Cannot nominate location. There are ${conflicts.length} official locations within 150 feet.`);
      }

      // Spend 5 credits
      await creditService.spendCredits(
        nominatorId,
        5,
        'spend',
        {
          description: `Nominated location "${location.content.text}" for official status`,
          locationId: location.id,
          action: 'create_nomination'
        },
        { transaction }
      );

      // Create nomination
      const nomination = await LocationNomination.create({
        locationId,
        nominatorId,
        reason,
        status: 'pending',
        votesRequired: 3,
        currentVotes: 0,
        creatorResponse: 'pending',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        creditsSpent: 5
      }, { transaction });

      // Commit transaction
      await transaction.commit();

      // Return nomination with associations
      const nominationWithAssociations = await LocationNomination.findByPk(nomination.id, {
        include: [
          {
            model: Location,
            as: 'location',
            include: [{
              model: User,
              as: 'creator',
              attributes: ['id', 'email', 'profile']
            }]
          },
          {
            model: User,
            as: 'nominator',
            attributes: ['id', 'email', 'profile']
          }
        ]
      });

      return {
        nomination: nominationWithAssociations,
        message: 'Nomination created successfully! It will expire in 7 days and requires 3 community votes.',
        creditsSpent: 5
      };

    } catch (error) {
      await transaction.rollback();
      console.error('Error creating nomination:', error);
      throw error;
    }
  }

  /**
   * Vote on a nomination
   * @param {number} nominationId - Nomination ID
   * @param {string} voterId - User voting
   * @param {string} voteType - 'upvote' or 'downvote'
   * @returns {Promise<Object>} Vote result
   */
  async voteOnNomination(nominationId, voterId, voteType) {
    const transaction = await sequelize.transaction();
    
    try {
      // Get the nomination
      const nomination = await LocationNomination.findByPk(nominationId, {
        include: [{
          model: Location,
          as: 'location',
          include: [{
            model: User,
            as: 'creator',
            attributes: ['id', 'email']
          }]
        }],
        transaction
      });

      if (!nomination) {
        throw new Error('Nomination not found');
      }

      if (nomination.status !== 'pending') {
        throw new Error('Nomination is no longer pending');
      }

      if (nomination.expiresAt < new Date()) {
        throw new Error('Nomination has expired');
      }

      // Check if user has already voted
      const existingVote = await NominationVote.findOne({
        where: {
          nominationId,
          voterId
        },
        transaction
      });

      if (existingVote) {
        throw new Error('You have already voted on this nomination');
      }

      // Check if voter is the nominator (can't vote on own nomination)
      if (nomination.nominatorId === voterId) {
        throw new Error('You cannot vote on your own nomination');
      }

      // Check if voter is the location creator (can't vote on own location)
      if (nomination.location.creatorId === voterId) {
        throw new Error('You cannot vote on nominations for your own location');
      }

      // Create the vote
      await NominationVote.create({
        nominationId,
        voterId,
        voteType
      }, { transaction });

      // Update vote count
      const voteCount = await NominationVote.count({
        where: {
          nominationId,
          voteType: 'upvote'
        },
        transaction
      });

      await nomination.update({
        currentVotes: voteCount
      }, { transaction });

      // Check if nomination has enough votes
      if (voteCount >= nomination.votesRequired) {
        await nomination.update({
          status: 'approved'
        }, { transaction });
      }

      // Commit transaction
      await transaction.commit();

      // Return updated nomination
      const updatedNomination = await LocationNomination.findByPk(nominationId, {
        include: [
          {
            model: Location,
            as: 'location',
            include: [{
              model: User,
              as: 'creator',
              attributes: ['id', 'email', 'profile']
            }]
          },
          {
            model: User,
            as: 'nominator',
            attributes: ['id', 'email', 'profile']
          },
          {
            model: NominationVote,
            as: 'votes',
            include: [{
              model: User,
              as: 'voter',
              attributes: ['id', 'email']
            }]
          }
        ]
      });

      return {
        nomination: updatedNomination,
        message: `Vote recorded successfully! ${voteCount}/${nomination.votesRequired} votes required.`,
        voteCount,
        isApproved: voteCount >= nomination.votesRequired
      };

    } catch (error) {
      await transaction.rollback();
      console.error('Error voting on nomination:', error);
      throw error;
    }
  }

  /**
   * Creator responds to nomination
   * @param {number} nominationId - Nomination ID
   * @param {string} creatorId - Location creator ID
   * @param {string} response - 'accepted' or 'rejected'
   * @returns {Promise<Object>} Response result
   */
  async creatorRespondToNomination(nominationId, creatorId, response) {
    const transaction = await sequelize.transaction();
    
    try {
      // Get the nomination
      const nomination = await LocationNomination.findByPk(nominationId, {
        include: [{
          model: Location,
          as: 'location',
          include: [{
            model: User,
            as: 'creator',
            attributes: ['id', 'email']
          }]
        }],
        transaction
      });

      if (!nomination) {
        throw new Error('Nomination not found');
      }

      if (nomination.location.creatorId !== creatorId) {
        throw new Error('Only the location creator can respond to nominations');
      }

      if (nomination.creatorResponse !== 'pending') {
        throw new Error('Nomination has already been responded to');
      }

      if (nomination.status !== 'approved') {
        throw new Error('Nomination must be approved by community before creator can respond');
      }

      // Update creator response
      await nomination.update({
        creatorResponse: response
      }, { transaction });

      // If accepted, make the location official
      if (response === 'accepted') {
        const result = await officialLocationService.makeLocationOfficial(
          nomination.locationId,
          nomination.nominatorId,
          transaction
        );

        await nomination.update({
          status: 'approved'
        }, { transaction });

        await transaction.commit();

        return {
          nomination,
          location: result.location,
          message: 'Location made official successfully!',
          creditsSpent: result.creditsSpent
        };
      } else {
        // If rejected, mark nomination as rejected
        await nomination.update({
          status: 'rejected'
        }, { transaction });

        await transaction.commit();

        return {
          nomination,
          message: 'Nomination rejected by location creator'
        };
      }

    } catch (error) {
      await transaction.rollback();
      console.error('Error responding to nomination:', error);
      throw error;
    }
  }

  /**
   * Admin makes location official (Admin Path)
   * @param {string} locationId - Location ID
   * @param {string} adminId - Admin user ID
   * @returns {Promise<Object>} Result
   */
  async adminMakeOfficial(locationId, adminId) {
    const transaction = await sequelize.transaction();
    
    try {
      // Verify admin status
      const admin = await User.findByPk(adminId, { transaction });
      if (!admin || !admin.isAdmin) {
        throw new Error('Only admins can make locations official');
      }

      // Use the official location service but with admin override
      const result = await officialLocationService.makeLocationOfficial(
        locationId,
        adminId,
        transaction,
        true // admin override flag
      );

      await transaction.commit();

      return {
        location: result.location,
        message: 'Location made official by admin',
        creditsSpent: 0 // No credits spent for admin actions
      };

    } catch (error) {
      await transaction.rollback();
      console.error('Error making location official by admin:', error);
      throw error;
    }
  }

  /**
   * Get pending nominations
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of pending nominations
   */
  async getPendingNominations(options = {}) {
    try {
      const query = {
        where: {
          status: 'pending',
          expiresAt: {
            [Op.gt]: new Date()
          }
        },
        include: [
          {
            model: Location,
            as: 'location',
            include: [{
              model: User,
              as: 'creator',
              attributes: ['id', 'email', 'profile']
            }]
          },
          {
            model: User,
            as: 'nominator',
            attributes: ['id', 'email', 'profile']
          },
          {
            model: NominationVote,
            as: 'votes',
            include: [{
              model: User,
              as: 'voter',
              attributes: ['id', 'email']
            }]
          }
        ],
        order: [['createdAt', 'DESC']]
      };

      if (options.limit) {
        query.limit = options.limit;
      }

      if (options.offset) {
        query.offset = options.offset;
      }

      return await LocationNomination.findAll(query);
    } catch (error) {
      console.error('Error getting pending nominations:', error);
      throw error;
    }
  }

  /**
   * Get nominations by user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of user's nominations
   */
  async getNominationsByUser(userId) {
    try {
      return await LocationNomination.findAll({
        where: {
          nominatorId: userId
        },
        include: [
          {
            model: Location,
            as: 'location',
            include: [{
              model: User,
              as: 'creator',
              attributes: ['id', 'email', 'profile']
            }]
          },
          {
            model: User,
            as: 'nominator',
            attributes: ['id', 'email', 'profile']
          },
          {
            model: NominationVote,
            as: 'votes',
            include: [{
              model: User,
              as: 'voter',
              attributes: ['id', 'email']
            }]
          }
        ],
        order: [['createdAt', 'DESC']]
      });
    } catch (error) {
      console.error('Error getting user nominations:', error);
      throw error;
    }
  }

  /**
   * Get nominations for user's locations (where they are the creator)
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of nominations for user's locations
   */
  async getNominationsForUserLocations(userId) {
    try {
      return await LocationNomination.findAll({
        include: [
          {
            model: Location,
            as: 'location',
            where: {
              creatorId: userId
            },
            include: [{
              model: User,
              as: 'creator',
              attributes: ['id', 'email', 'profile']
            }]
          },
          {
            model: User,
            as: 'nominator',
            attributes: ['id', 'email', 'profile']
          },
          {
            model: NominationVote,
            as: 'votes',
            include: [{
              model: User,
              as: 'voter',
              attributes: ['id', 'email']
            }]
          }
        ],
        order: [['createdAt', 'DESC']]
      });
    } catch (error) {
      console.error('Error getting nominations for user locations:', error);
      throw error;
    }
  }

  /**
   * Get nomination by ID
   * @param {number} nominationId - Nomination ID
   * @returns {Promise<Object>} Nomination details
   */
  async getNominationById(nominationId) {
    try {
      return await LocationNomination.findByPk(nominationId, {
        include: [
          {
            model: Location,
            as: 'location',
            include: [{
              model: User,
              as: 'creator',
              attributes: ['id', 'email', 'profile']
            }]
          },
          {
            model: User,
            as: 'nominator',
            attributes: ['id', 'email', 'profile']
          },
          {
            model: NominationVote,
            as: 'votes',
            include: [{
              model: User,
              as: 'voter',
              attributes: ['id', 'email']
            }]
          }
        ]
      });
    } catch (error) {
      console.error('Error getting nomination by ID:', error);
      throw error;
    }
  }

  /**
   * Clean up expired nominations
   * @returns {Promise<number>} Number of nominations cleaned up
   */
  async cleanupExpiredNominations() {
    const transaction = await sequelize.transaction();
    
    try {
      const expiredNominations = await LocationNomination.findAll({
        where: {
          status: 'pending',
          expiresAt: {
            [Op.lt]: new Date()
          }
        },
        transaction
      });

      let cleanedCount = 0;

      for (const nomination of expiredNominations) {
        // Update status to failed
        await nomination.update({
          status: 'failed',
          creatorResponse: 'expired'
        }, { transaction });

        // Refund credits to nominator if nomination failed
        await creditService.addCredits(
          nomination.nominatorId,
          nomination.creditsSpent,
          'refund',
          {
            description: `Refund for expired nomination "${nomination.location?.content?.text || 'Unknown location'}"`,
            nominationId: nomination.id,
            action: 'nomination_expired'
          },
          { transaction }
        );

        cleanedCount++;
      }

      await transaction.commit();
      return cleanedCount;

    } catch (error) {
      await transaction.rollback();
      console.error('Error cleaning up expired nominations:', error);
      throw error;
    }
  }

  /**
   * Get all nominations with optional filters
   * @param {Object} options - Filter options
   * @returns {Promise<Array>} Array of nominations
   */
  async getAllNominations(options = {}) {
    try {
      const query = {
        include: [
          {
            model: Location,
            as: 'location',
            include: [{
              model: User,
              as: 'creator',
              attributes: ['id', 'email', 'profile']
            }]
          },
          {
            model: User,
            as: 'nominator',
            attributes: ['id', 'email', 'profile']
          },
          {
            model: NominationVote,
            as: 'votes',
            include: [{
              model: User,
              as: 'voter',
              attributes: ['id', 'email', 'profile']
            }]
          }
        ],
        order: [['createdAt', 'DESC']]
      };

      // Add status filter
      if (options.status) {
        query.where = { status: options.status };
      }

      // Add pagination
      if (options.limit) {
        query.limit = options.limit;
      }
      if (options.offset) {
        query.offset = options.offset;
      }

      const nominations = await LocationNomination.findAll(query);
      return nominations;

    } catch (error) {
      console.error('Error getting all nominations:', error);
      throw error;
    }
  }

  /**
   * Get nominations for a specific location
   * @param {string} locationId - Location ID
   * @returns {Promise<Array>} Array of nominations for the location
   */
  async getNominationsByLocation(locationId) {
    try {
      const nominations = await LocationNomination.findAll({
        where: { locationId },
        include: [
          {
            model: Location,
            as: 'location',
            include: [{
              model: User,
              as: 'creator',
              attributes: ['id', 'email', 'profile']
            }]
          },
          {
            model: User,
            as: 'nominator',
            attributes: ['id', 'email', 'profile']
          },
          {
            model: NominationVote,
            as: 'votes',
            include: [{
              model: User,
              as: 'voter',
              attributes: ['id', 'email', 'profile']
            }]
          }
        ],
        order: [['createdAt', 'DESC']]
      });

      return nominations;

    } catch (error) {
      console.error('Error getting nominations by location:', error);
      throw error;
    }
  }
}

module.exports = new NominationService(); 