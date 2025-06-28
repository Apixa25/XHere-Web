const express = require('express');
const router = express.Router();
const creditService = require('../services/creditService');
const { authenticateToken } = require('../middleware/auth');
const stripe = require('../utils/stripe');

/**
 * @route   GET /api/credits/balance
 * @desc    Get user's current credit balance
 * @access  Private
 */
router.get('/balance', authenticateToken, async (req, res) => {
  try {
    const balance = await creditService.getBalance(req.user.id);
    res.json({
      success: true,
      balance,
      message: 'Credit balance retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting credit balance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get credit balance',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/credits/transactions
 * @desc    Get user's transaction history
 * @access  Private
 */
router.get('/transactions', authenticateToken, async (req, res) => {
  try {
    const { limit = 50, offset = 0, type = null } = req.query;
    
    const transactions = await creditService.getTransactionHistory(req.user.id, {
      limit: parseInt(limit),
      offset: parseInt(offset),
      type
    });

    res.json({
      success: true,
      transactions,
      message: 'Transaction history retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting transaction history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get transaction history',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/credits/stats
 * @desc    Get user's credit statistics
 * @access  Private
 */
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const stats = await creditService.getCreditStats(req.user.id);
    res.json({
      success: true,
      stats,
      message: 'Credit statistics retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting credit stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get credit statistics',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/credits/packages
 * @desc    Get available credit packages
 * @access  Public
 */
router.get('/packages', async (req, res) => {
  try {
    const packages = creditService.getCreditPackages();
    res.json({
      success: true,
      packages,
      message: 'Credit packages retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting credit packages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get credit packages',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/credits/add
 * @desc    Add credits to user account (admin only)
 * @access  Private (Admin)
 */
router.post('/add', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const { userId, amount, transactionType, description, metadata } = req.body;

    if (!userId || !amount || !transactionType) {
      return res.status(400).json({
        success: false,
        message: 'userId, amount, and transactionType are required'
      });
    }

    const result = await creditService.addCredits(
      userId,
      amount,
      transactionType,
      description,
      metadata
    );

    res.json({
      success: true,
      user: result.user,
      transaction: result.transaction,
      message: 'Credits added successfully'
    });
  } catch (error) {
    console.error('Error adding credits:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add credits',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/credits/spend
 * @desc    Spend credits from user account
 * @access  Private
 */
router.post('/spend', authenticateToken, async (req, res) => {
  try {
    const { amount, description, metadata } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid amount is required'
      });
    }

    const result = await creditService.spendCredits(
      req.user.id,
      amount,
      description,
      metadata
    );

    res.json({
      success: true,
      user: result.user,
      transaction: result.transaction,
      message: 'Credits spent successfully'
    });
  } catch (error) {
    console.error('Error spending credits:', error);
    
    if (error.message === 'Insufficient credits') {
      return res.status(400).json({
        success: false,
        message: 'Insufficient credits',
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to spend credits',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/credits/validate
 * @desc    Validate if user has sufficient credits
 * @access  Private
 */
router.post('/validate', authenticateToken, async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid amount is required'
      });
    }

    const hasSufficient = await creditService.hasSufficientCredits(req.user.id, amount);
    const balance = await creditService.getBalance(req.user.id);

    res.json({
      success: true,
      hasSufficient,
      balance,
      required: amount,
      message: hasSufficient ? 'Sufficient credits available' : 'Insufficient credits'
    });
  } catch (error) {
    console.error('Error validating credits:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate credits',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/credits/summary
 * @desc    Get comprehensive credit summary for user
 * @access  Private
 */
router.get('/summary', authenticateToken, async (req, res) => {
  try {
    const [balance, stats, recentTransactions] = await Promise.all([
      creditService.getBalance(req.user.id),
      creditService.getCreditStats(req.user.id),
      creditService.getTransactionHistory(req.user.id, { limit: 5 })
    ]);

    res.json({
      success: true,
      summary: {
        balance,
        stats,
        recentTransactions
      },
      message: 'Credit summary retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting credit summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get credit summary',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/credits/create-payment-intent
 * @desc    Create a Stripe PaymentIntent for buying credits
 * @access  Private
 */
router.post('/create-payment-intent', authenticateToken, async (req, res) => {
  try {
    const { credits } = req.body;
    if (!credits || credits <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid credits amount' });
    }

    // Example: $1 per credit (adjust as needed)
    const amount = credits * 100; // in cents

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      metadata: {
        userId: req.user.id,
        credits,
      },
    });

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      message: 'Payment intent created',
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ success: false, message: 'Failed to create payment intent', error: error.message });
  }
});

/**
 * @route   GET /api/credits/stripe-publishable-key
 * @desc    Get Stripe publishable key for frontend
 * @access  Public
 */
router.get('/stripe-publishable-key', (req, res) => {
  res.json({ key: process.env.STRIPE_PUBLISHABLE_KEY });
});

// Stripe webhook endpoint
router.post(
  '/stripe-webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      const userId = paymentIntent.metadata.userId;
      const credits = parseInt(paymentIntent.metadata.credits, 10);

      console.log(
        `Received payment_intent.succeeded for user ${userId} for ${credits} credits`
      );

      try {
        await creditService.addCredits(
          userId,
          credits,
          'purchase',
          'Stripe payment',
          { paymentIntentId: paymentIntent.id }
        );
        console.log(
          `Credited ${credits} credits to user ${userId} for payment ${paymentIntent.id}`
        );
      } catch (error) {
        console.error('Failed to credit user after payment:', error);
      }
    }

    // Respond to Stripe
    res.status(200).json({ received: true });
  }
);

module.exports = router; 