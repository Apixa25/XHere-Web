const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { validateLocationPurchaseCredits, validateOfficialLocationCredits, getUserCredits } = require('../middleware/credit');
const locationTradingService = require('../services/locationTradingService');
const sequelize = require('../config/database');

/**
 * @route POST /api/ownership/purchase
 * @desc Purchase a location
 * @access Private
 */
router.post('/purchase', 
  authenticateToken, 
  validateLocationPurchaseCredits,
  async (req, res) => {
    try {
      const { locationId } = req.body;
      const buyerId = req.user.id;

      if (!locationId) {
        return res.status(400).json({ 
          success: false, 
          message: 'Location ID is required' 
        });
      }

      await sequelize.transaction(async (t) => {
        const result = await locationTradingService.purchaseLocation({ buyerId, locationId, transaction: t });
        res.json({ 
          success: true, 
          message: 'Location purchased successfully!',
          ...result 
        });
      });
    } catch (error) {
      console.error('Purchase location error:', error);
      res.status(400).json({ 
        success: false, 
        message: error.message 
      });
    }
  }
);

/**
 * @route GET /api/ownership/:locationId
 * @desc Get location ownership information
 * @access Public
 */
router.get('/:locationId', async (req, res) => {
  try {
    const { locationId } = req.params;
    const ownership = await locationTradingService.getLocationOwnership(locationId);
    
    res.json({ 
      success: true, 
      ownership 
    });
  } catch (error) {
    console.error('Get ownership error:', error);
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
});

/**
 * @route GET /api/ownership/:locationId/price
 * @desc Get location price information
 * @access Public
 */
router.get('/:locationId/price', async (req, res) => {
  try {
    const { locationId } = req.params;
    const priceInfo = await locationTradingService.getLocationPriceInfo(locationId);
    
    res.json({ 
      success: true, 
      priceInfo 
    });
  } catch (error) {
    console.error('Get price info error:', error);
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
});

/**
 * @route GET /api/ownership/:locationId/validate
 * @desc Validate if user can purchase location
 * @access Private
 */
router.get('/:locationId/validate', 
  authenticateToken, 
  getUserCredits,
  async (req, res) => {
    try {
      const { locationId } = req.params;
      const userId = req.user.id;
      
      const validation = await locationTradingService.validatePurchase(userId, locationId);
      
      // Add user's current credit balance to response
      validation.userCredits = req.userCredits;
      
      res.json({ 
        success: true, 
        validation 
      });
    } catch (error) {
      console.error('Validate purchase error:', error);
      res.status(400).json({ 
        success: false, 
        message: error.message 
      });
    }
  }
);

/**
 * @route POST /api/ownership/:locationId/official
 * @desc Make a location official (costs 300 credits)
 * @access Private
 */
router.post('/:locationId/official', 
  authenticateToken, 
  validateOfficialLocationCredits,
  async (req, res) => {
    try {
      const { locationId } = req.params;
      const userId = req.user.id;
      
      const result = await locationTradingService.makeLocationOfficial({ userId, locationId });
      
      res.json({ 
        success: true, 
        message: 'Location is now official!',
        ...result 
      });
    } catch (error) {
      console.error('Make official error:', error);
      res.status(400).json({ 
        success: false, 
        message: error.message 
      });
    }
  }
);

/**
 * @route GET /api/ownership/:locationId/history
 * @desc Get purchase history for a location
 * @access Public
 */
router.get('/:locationId/history', async (req, res) => {
  try {
    const { locationId } = req.params;
    const history = await locationTradingService.getPurchaseHistory(locationId);
    
    res.json({ 
      success: true, 
      history 
    });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
});

/**
 * @route GET /api/ownership/user/me
 * @desc Get current user's owned locations
 * @access Private
 */
router.get('/user/me', 
  authenticateToken, 
  async (req, res) => {
    try {
      const userId = req.user.id;
      const ownedLocations = await locationTradingService.getUserOwnedLocations(userId);
      
      res.json({ 
        success: true, 
        ownedLocations 
      });
    } catch (error) {
      console.error('Get user owned locations error:', error);
      res.status(400).json({ 
        success: false, 
        message: error.message 
      });
    }
  }
);

/**
 * @route GET /api/ownership/user/:userId
 * @desc Get all locations owned by a user
 * @access Private (user can only see their own locations)
 */
router.get('/user/:userId', 
  authenticateToken, 
  async (req, res) => {
    try {
      const { userId } = req.params;
      const requestingUserId = req.user.id;
      
      // Users can only see their own owned locations
      if (userId !== requestingUserId) {
        return res.status(403).json({ 
          success: false, 
          message: 'You can only view your own owned locations' 
        });
      }
      
      const ownedLocations = await locationTradingService.getUserOwnedLocations(userId);
      
      res.json({ 
        success: true, 
        ownedLocations 
      });
    } catch (error) {
      console.error('Get user owned locations error:', error);
      res.status(400).json({ 
        success: false, 
        message: error.message 
      });
    }
  }
);

module.exports = router; 