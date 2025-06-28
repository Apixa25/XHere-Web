const { LocationOwnership, LocationOwnershipHistory, User, Location } = require('../models');
const creditService = require('./creditService');
const PriceCalculationService = require('./priceCalculationService');
const { sequelize } = require('../config/database');

class LocationTradingService {
  /**
   * Calculate the current price for a location using the doubling algorithm
   * @param {number} basePrice - Base price (default: 100 credits)
   * @param {number} purchaseCount - Number of times the location has been purchased
   * @returns {number} Calculated price
   */
  calculatePrice(basePrice = 100, purchaseCount = 0) {
    return PriceCalculationService.calculatePrice(purchaseCount, basePrice);
  }

  /**
   * Get location ownership information with current price
   * @param {string} locationId - Location ID
   * @returns {Promise<Object>} Ownership information
   */
  async getLocationOwnership(locationId) {
    try {
      let ownership = await LocationOwnership.findOne({ 
        where: { locationId },
        include: [
          { model: Location, as: 'location' },
          { model: User, as: 'owner' }
        ]
      });

      if (!ownership) {
        // Create initial ownership record if it doesn't exist
        const location = await Location.findByPk(locationId);
        if (!location) {
          throw new Error('Location not found');
        }

        ownership = await LocationOwnership.create({
          locationId,
          ownerId: location.creatorId, // Original creator owns it initially
          currentPrice: PriceCalculationService.BASE_PRICE,
          purchaseCount: 0,
          isOfficial: false
        });

        await ownership.reload({
          include: [
            { model: Location, as: 'location' },
            { model: User, as: 'owner' }
          ]
        });
      }

      // Calculate next price for display
      const nextPrice = PriceCalculationService.calculateNextPrice(ownership.purchaseCount);

      return {
        ...ownership.toJSON(),
        nextPrice,
        priceInfo: PriceCalculationService.getPriceInfo(ownership.purchaseCount),
        priceHistory: await this.getPurchaseHistory(locationId)
      };
    } catch (error) {
      console.error('Error getting location ownership:', error);
      throw error;
    }
  }

  /**
   * Purchase a location with comprehensive validation
   * @param {Object} params - Purchase parameters
   * @param {string} params.buyerId - Buyer's user ID
   * @param {string} params.locationId - Location ID to purchase
   * @returns {Promise<Object>} Purchase result
   */
  async purchaseLocation({ buyerId, locationId }) {
    return await sequelize.transaction(async (t) => {
      try {
        // Validate buyer exists
        const buyer = await User.findByPk(buyerId, { 
          transaction: t, 
          lock: t.LOCK.UPDATE 
        });
        if (!buyer) {
          throw new Error('Buyer not found');
        }

        // Get or create ownership record
        let ownership = await LocationOwnership.findOne({ 
          where: { locationId }, 
          transaction: t, 
          lock: t.LOCK.UPDATE 
        });

        if (!ownership) {
          // Create initial ownership if it doesn't exist
          const location = await Location.findByPk(locationId, { transaction: t });
          if (!location) {
            throw new Error('Location not found');
          }

          ownership = await LocationOwnership.create({
            locationId,
            ownerId: location.creatorId,
            currentPrice: PriceCalculationService.BASE_PRICE,
            purchaseCount: 0,
            isOfficial: false
          }, { transaction: t });
        }

        // Check if buyer already owns the location
        if (ownership.ownerId === buyerId) {
          throw new Error('You already own this location');
        }

        // Calculate current price using PriceCalculationService
        const currentPrice = PriceCalculationService.calculatePrice(ownership.purchaseCount);
        
        // Validate price is reasonable
        if (!PriceCalculationService.validatePrice(currentPrice)) {
          throw new Error('Location price is too high to purchase');
        }
        
        // Validate buyer has sufficient credits
        if (buyer.credits < currentPrice) {
          throw new Error(`Insufficient credits. Required: ${PriceCalculationService.formatPrice(currentPrice)}, Available: ${buyer.credits} credits`);
        }

        // Deduct credits from buyer
        await creditService.spendCredits(
          buyerId, 
          currentPrice, 
          'location_purchase', 
          { 
            locationId,
            previousOwnerId: ownership.ownerId,
            purchaseCount: ownership.purchaseCount
          },
          { transaction: t }
        );

        // Add credits to previous owner (if not the original creator)
        const previousOwner = await User.findByPk(ownership.ownerId, { transaction: t });
        if (previousOwner && previousOwner.id !== ownership.ownerId) {
          const sellerProfit = PriceCalculationService.calculateSellerProfit(currentPrice);
          await creditService.addCredits(
            ownership.ownerId,
            sellerProfit,
            'location_sale',
            { locationId, buyerId },
            { transaction: t }
          );
        }

        // Log purchase history
        await LocationOwnershipHistory.create({
          locationId,
          buyerId,
          pricePaid: currentPrice,
          purchasedAt: new Date()
        }, { transaction: t });

        // Transfer ownership
        const newPurchaseCount = ownership.purchaseCount + 1;
        const newPrice = PriceCalculationService.calculatePrice(newPurchaseCount);

        await ownership.update({
          ownerId: buyerId,
          purchaseCount: newPurchaseCount,
          currentPrice: newPrice
        }, { transaction: t });

        // Reload ownership with associations
        await ownership.reload({
          include: [
            { model: Location, as: 'location' },
            { model: User, as: 'owner' }
          ],
          transaction: t
        });

        return {
          success: true,
          ownership: ownership.toJSON(),
          pricePaid: currentPrice,
          nextPrice: newPrice,
          purchaseCount: newPurchaseCount,
          priceInfo: PriceCalculationService.getPriceInfo(newPurchaseCount)
        };
      } catch (error) {
        console.error('Error in purchaseLocation:', error);
        throw error;
      }
    });
  }

  /**
   * Make a location official (costs 3 credits)
   * @param {Object} params - Official status parameters
   * @param {string} params.userId - User ID making the request
   * @param {string} params.locationId - Location ID to make official
   * @returns {Promise<Object>} Result of making location official
   */
  async makeLocationOfficial({ userId, locationId }) {
    return await sequelize.transaction(async (t) => {
      try {
        // Check if user owns the location
        const ownership = await LocationOwnership.findOne({
          where: { locationId, ownerId: userId },
          transaction: t,
          lock: t.LOCK.UPDATE
        });

        if (!ownership) {
          throw new Error('You must own this location to make it official');
        }

        if (ownership.isOfficial) {
          throw new Error('Location is already official');
        }

        // Check if user has enough credits
        const user = await User.findByPk(userId, { transaction: t, lock: t.LOCK.UPDATE });
        if (user.credits < 3) {
          throw new Error('Insufficient credits. Making a location official costs 3 credits.');
        }

        // Deduct credits
        await creditService.spendCredits(
          userId,
          3,
          'make_location_official',
          { locationId },
          { transaction: t }
        );

        // Update ownership to official
        await ownership.update({ isOfficial: true }, { transaction: t });

        return {
          success: true,
          ownership: ownership.toJSON(),
          message: 'Location is now official!'
        };
      } catch (error) {
        console.error('Error making location official:', error);
        throw error;
      }
    });
  }

  /**
   * Get purchase history for a location
   * @param {string} locationId - Location ID
   * @returns {Promise<Array>} Purchase history
   */
  async getPurchaseHistory(locationId) {
    try {
      return await LocationOwnershipHistory.findAll({
        where: { locationId },
        include: [
          { model: Location, as: 'location' },
          { model: User, as: 'buyer' }
        ],
        order: [['purchasedAt', 'DESC']]
      });
    } catch (error) {
      console.error('Error getting purchase history:', error);
      throw error;
    }
  }

  /**
   * Get all locations owned by a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Owned locations
   */
  async getUserOwnedLocations(userId) {
    try {
      return await LocationOwnership.findAll({
        where: { ownerId: userId },
        include: [
          { model: Location, as: 'location' },
          { model: User, as: 'owner' }
        ],
        order: [['updatedAt', 'DESC']]
      });
    } catch (error) {
      console.error('Error getting user owned locations:', error);
      throw error;
    }
  }

  /**
   * Get location price information without purchasing
   * @param {string} locationId - Location ID
   * @returns {Promise<Object>} Price information
   */
  async getLocationPriceInfo(locationId) {
    try {
      const ownership = await this.getLocationOwnership(locationId);
      const currentPrice = PriceCalculationService.calculatePrice(ownership.purchaseCount);
      const nextPrice = PriceCalculationService.calculateNextPrice(ownership.purchaseCount);

      return {
        currentPrice,
        nextPrice,
        purchaseCount: ownership.purchaseCount,
        isOfficial: ownership.isOfficial,
        owner: ownership.owner,
        location: ownership.location,
        priceInfo: PriceCalculationService.getPriceInfo(ownership.purchaseCount),
        priceTrend: PriceCalculationService.analyzePriceTrend(ownership.purchaseCount)
      };
    } catch (error) {
      console.error('Error getting location price info:', error);
      throw error;
    }
  }

  /**
   * Validate if a location can be purchased by a user
   * @param {string} userId - User ID
   * @param {string} locationId - Location ID
   * @returns {Promise<Object>} Validation result
   */
  async validatePurchase(userId, locationId) {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        return { canPurchase: false, reason: 'User not found' };
      }

      const ownership = await this.getLocationOwnership(locationId);
      
      if (ownership.ownerId === userId) {
        return { canPurchase: false, reason: 'You already own this location' };
      }

      const currentPrice = PriceCalculationService.calculatePrice(ownership.purchaseCount);
      
      if (!PriceCalculationService.validatePrice(currentPrice)) {
        return { 
          canPurchase: false, 
          reason: 'Location price is too high to purchase',
          currentPrice: PriceCalculationService.formatPrice(currentPrice)
        };
      }
      
      if (user.credits < currentPrice) {
        return { 
          canPurchase: false, 
          reason: 'Insufficient credits',
          required: currentPrice,
          requiredFormatted: PriceCalculationService.formatPrice(currentPrice),
          available: user.credits
        };
      }

      return { 
        canPurchase: true, 
        currentPrice,
        currentPriceFormatted: PriceCalculationService.formatPrice(currentPrice),
        nextPrice: PriceCalculationService.calculateNextPrice(ownership.purchaseCount),
        nextPriceFormatted: PriceCalculationService.formatPrice(PriceCalculationService.calculateNextPrice(ownership.purchaseCount)),
        userCredits: user.credits,
        priceInfo: PriceCalculationService.getPriceInfo(ownership.purchaseCount)
      };
    } catch (error) {
      console.error('Error validating purchase:', error);
      throw error;
    }
  }
}

module.exports = new LocationTradingService(); 