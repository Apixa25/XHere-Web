const ReputationService = require('../services/reputationService');
const DownvoteTrackingService = require('../services/downvoteTrackingService');
const { Op } = require('sequelize');
const Location = require('../models/Location');

/**
 * Middleware to validate trust-based posting permissions
 * Combines reputation-based restrictions with downvote penalties
 */
const validateTrustBasedPosting = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { locationType = 'general' } = req.body;

    console.log('🛡️ Trust-based posting validation for user:', userId);
    console.log('🛡️ Location type:', locationType);

    // Check reputation-based posting permissions
    const reputationCheck = await ReputationService.canUserPostLocation(userId, locationType);
    console.log('🛡️ Reputation check result:', reputationCheck);

    // Check downvote penalty restrictions
    const penaltyCheck = await DownvoteTrackingService.checkPostingPermission(userId);
    console.log('🛡️ Penalty check result:', penaltyCheck);

    // Determine final posting permissions
    let canPost = reputationCheck.canPost && penaltyCheck.canPost;
    let reason = null;
    let restrictions = {};

    // If reputation check fails
    if (!reputationCheck.canPost) {
      canPost = false;
      reason = reputationCheck.reason;
      restrictions = reputationCheck.restrictions;
    }
    // If penalty check fails (overrides reputation)
    else if (!penaltyCheck.canPost) {
      canPost = false;
      reason = `Posting restricted due to ${penaltyCheck.penaltyLevel} penalty level`;
      restrictions = penaltyCheck.restrictions;
    }
    // If both pass, use the more restrictive set of restrictions
    else {
      restrictions = {
        maxLocationsPerDay: Math.min(reputationCheck.restrictions.maxLocationsPerDay, penaltyCheck.restrictions.maxLocationsPerDay),
        requiresApproval: reputationCheck.requiresApproval || penaltyCheck.restrictions.requiresApproval,
        creditCost: Math.max(reputationCheck.creditCost, penaltyCheck.restrictions.creditCost)
      };
    }

    // Add posting validation info to request
    req.postingValidation = {
      canPost,
      reason,
      restrictions,
      reputationCheck,
      penaltyCheck,
      locationType
    };

    if (!canPost) {
      return res.status(403).json({
        success: false,
        message: reason,
        restrictions,
        reputationCheck,
        penaltyCheck
      });
    }

    console.log('🛡️ Posting validation passed:', req.postingValidation);
    next();
  } catch (error) {
    console.error('Error in trust-based posting validation:', error);
    res.status(500).json({
      success: false,
      message: 'Error validating posting permissions'
    });
  }
};

/**
 * Middleware to check if location requires approval
 * Sets approval status based on trust level and penalty status
 */
const checkApprovalRequirement = async (req, res, next) => {
  try {
    const postingValidation = req.postingValidation;
    
    if (!postingValidation) {
      return res.status(400).json({
        success: false,
        message: 'Posting validation not found'
      });
    }

    const requiresApproval = postingValidation.restrictions.requiresApproval;
    
    // Add approval info to request
    req.approvalInfo = {
      requiresApproval,
      trustLevel: req.user.trustLevel,
      penaltyLevel: postingValidation.penaltyCheck.penaltyLevel
    };

    console.log('🛡️ Approval requirement check:', req.approvalInfo);
    next();
  } catch (error) {
    console.error('Error checking approval requirement:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking approval requirement'
    });
  }
};

/**
 * Middleware to validate daily posting limits
 * Checks both reputation-based and penalty-based limits
 */
const validateDailyPostingLimit = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const postingValidation = req.postingValidation;
    
    if (!postingValidation) {
      return res.status(400).json({
        success: false,
        message: 'Posting validation not found'
      });
    }

    const maxLocationsPerDay = postingValidation.restrictions.maxLocationsPerDay;
    
    // Count today's locations
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayLocations = await Location.count({
      where: {
        creatorId: userId,
        createdAt: {
          [Op.gte]: today
        }
      }
    });

    console.log('🛡️ Daily posting check:', {
      todayLocations,
      maxLocationsPerDay,
      remaining: maxLocationsPerDay - todayLocations
    });

    if (todayLocations >= maxLocationsPerDay) {
      return res.status(403).json({
        success: false,
        message: `Daily posting limit reached (${todayLocations}/${maxLocationsPerDay})`,
        todayLocations,
        maxLocationsPerDay,
        remaining: 0
      });
    }

    // Add daily limit info to request
    req.dailyLimitInfo = {
      todayLocations,
      maxLocationsPerDay,
      remaining: maxLocationsPerDay - todayLocations
    };

    next();
  } catch (error) {
    console.error('Error validating daily posting limit:', error);
    res.status(500).json({
      success: false,
      message: 'Error validating daily posting limit'
    });
  }
};

/**
 * Middleware to handle location approval workflow
 * For locations that require approval, sets appropriate status
 */
const handleLocationApproval = async (req, res, next) => {
  try {
    const approvalInfo = req.approvalInfo;
    
    if (!approvalInfo) {
      return res.status(400).json({
        success: false,
        message: 'Approval info not found'
      });
    }

    // Set location status based on approval requirement
    if (approvalInfo.requiresApproval) {
      req.body.locationStatus = 'pending';
      req.body.requiresApproval = true;
      console.log('🛡️ Location requires approval - status set to pending');
    } else {
      req.body.locationStatus = 'verified';
      req.body.requiresApproval = false;
      console.log('🛡️ Location approved automatically - status set to verified');
    }

    next();
  } catch (error) {
    console.error('Error handling location approval:', error);
    res.status(500).json({
      success: false,
      message: 'Error handling location approval'
    });
  }
};

module.exports = {
  validateTrustBasedPosting,
  checkApprovalRequirement,
  validateDailyPostingLimit,
  handleLocationApproval
}; 