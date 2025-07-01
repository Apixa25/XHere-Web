const creditService = require('../services/creditService');

/**
 * Middleware to validate if user has sufficient credits
 * @param {number} requiredCredits - Number of credits required
 * @returns {Function} Express middleware function
 */
const validateCredits = (requiredCredits) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      const hasSufficient = await creditService.hasSufficientCredits(userId, requiredCredits);
      
      if (!hasSufficient) {
        const balance = await creditService.getBalance(userId);
        return res.status(400).json({
          success: false,
          message: `Insufficient credits. Required: ${requiredCredits}, Available: ${balance}`,
          required: requiredCredits,
          available: balance
        });
      }

      next();
    } catch (error) {
      console.error('Credit validation error:', error);
      res.status(500).json({
        success: false,
        message: 'Error validating credits'
      });
    }
  };
};

/**
 * Middleware to validate sufficient credits for spending
 * Gets the required amount from request body
 */
const validateSufficientCredits = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { amount } = req.body;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid amount is required'
      });
    }

    const hasSufficient = await creditService.hasSufficientCredits(userId, amount);
    
    if (!hasSufficient) {
      const balance = await creditService.getBalance(userId);
      return res.status(400).json({
        success: false,
        message: `Insufficient credits. Required: ${amount}, Available: ${balance}`,
        required: amount,
        available: balance
      });
    }

    next();
  } catch (error) {
    console.error('Credit validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error validating credits'
    });
  }
};

/**
 * Middleware to validate location purchase credits
 * Uses dynamic credit calculation based on location
 */
const validateLocationPurchaseCredits = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { locationId } = req.body;
    
    if (!locationId) {
      return res.status(400).json({
        success: false,
        message: 'Location ID is required'
      });
    }

    // Import locationTradingService here to avoid circular dependencies
    const locationTradingService = require('../services/locationTradingService');
    const validation = await locationTradingService.validatePurchase(userId, locationId);
    
    if (!validation.canPurchase) {
      return res.status(400).json({
        success: false,
        message: validation.reason,
        validation
      });
    }

    // Add validation info to request for use in route handler
    req.purchaseValidation = validation;
    next();
  } catch (error) {
    console.error('Location purchase credit validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error validating purchase credits'
    });
  }
};

/**
 * Middleware to validate official location credits (300 credits)
 */
const validateOfficialLocationCredits = validateCredits(300);

/**
 * Middleware to get user's credit balance and add to request
 */
const getUserCredits = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const balance = await creditService.getBalance(userId);
    req.userCredits = balance;
    next();
  } catch (error) {
    console.error('Get user credits error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting user credits'
    });
  }
};

/**
 * Middleware to validate location posting credits based on location type
 * General locations are free, all others require 100 credits
 */
const validateLocationPostingCredits = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { locationType } = req.body;
    
    console.log('🔍 Credit middleware - Received request body:', req.body);
    console.log('🔍 Credit middleware - locationType from body:', locationType);
    console.log('🔍 Credit middleware - locationType type:', typeof locationType);
    console.log('🔍 Credit middleware - All body keys:', Object.keys(req.body));
    
    // General locations are free
    if (locationType === 'general') {
      console.log('🔍 Credit middleware - General location detected, no credits required');
      req.requiredCredits = 0;
      req.locationType = locationType;
      return next();
    }
    
    // All other location types require 100 credits
    console.log('🔍 Credit middleware - Non-general location detected, requiring 100 credits');
    req.requiredCredits = 100;
    req.locationType = locationType;
    
    // Check if user has enough credits
    const userBalance = await creditService.getBalance(userId);
    console.log('🔍 Credit middleware - User balance:', userBalance);
    
    if (userBalance < 100) {
      console.log('🔍 Credit middleware - Insufficient credits, rejecting request');
      return res.status(400).json({
        success: false,
        message: `Insufficient credits. ${locationType} locations require 100 credits. You have ${userBalance} credits.`,
        requiredCredits: 100,
        userCredits: userBalance
      });
    }
    
    console.log('🔍 Credit middleware - Sufficient credits, proceeding');
    next();
  } catch (error) {
    console.error('Location posting credit validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error validating posting credits'
    });
  }
};

module.exports = {
  validateCredits,
  validateSufficientCredits,
  validateLocationPurchaseCredits,
  validateOfficialLocationCredits,
  validateLocationPostingCredits,
  getUserCredits
}; 