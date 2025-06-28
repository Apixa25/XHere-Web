const creditService = require('../services/creditService');

/**
 * Middleware to validate if user has sufficient credits
 * Usage: Place after authentication middleware. Expects req.user.id and req.body.amount or req.query.amount
 */
async function validateSufficientCredits(req, res, next) {
  try {
    const amount = parseInt(req.body.amount || req.query.amount, 10);
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid amount is required for credit validation.'
      });
    }
    const hasSufficient = await creditService.hasSufficientCredits(req.user.id, amount);
    if (!hasSufficient) {
      const balance = await creditService.getBalance(req.user.id);
      return res.status(400).json({
        success: false,
        message: 'Insufficient credits',
        balance,
        required: amount
      });
    }
    next();
  } catch (error) {
    console.error('Credit validation middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate credits',
      error: error.message
    });
  }
}

module.exports = { validateSufficientCredits }; 