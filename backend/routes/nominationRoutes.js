const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const nominationService = require('../services/nominationService');

// Get all nominations (with optional filters)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, limit, offset } = req.query;
    const options = {};
    
    if (status) options.status = status;
    if (limit) options.limit = parseInt(limit);
    if (offset) options.offset = parseInt(offset);

    const nominations = await nominationService.getAllNominations(options);

    res.json({
      success: true,
      nominations: nominations
    });

  } catch (error) {
    console.error('Error getting nominations:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Create a nomination for a location (Community Path)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { locationId, reason } = req.body;
    const nominatorId = req.user.id;

    console.log('🏆 Creating nomination:', { locationId, nominatorId, reason });

    const result = await nominationService.createNomination(locationId, nominatorId, reason);

    res.json({
      success: true,
      message: result.message,
      nomination: result.nomination,
      creditsSpent: result.creditsSpent
    });

  } catch (error) {
    console.error('Error creating nomination:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Get nominations for a specific location
router.get('/location/:locationId', authenticateToken, async (req, res) => {
  try {
    const { locationId } = req.params;
    
    const nominations = await nominationService.getNominationsByLocation(locationId);

    res.json({
      success: true,
      nominations: nominations
    });

  } catch (error) {
    console.error('Error getting location nominations:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Vote on a nomination
router.post('/:nominationId/vote', authenticateToken, async (req, res) => {
  try {
    const { nominationId } = req.params;
    const { voteType } = req.body;
    const voterId = req.user.id;

    console.log('🗳️ Voting on nomination:', { nominationId, voterId, voteType });

    const result = await nominationService.voteOnNomination(nominationId, voterId, voteType);

    res.json({
      success: true,
      message: result.message,
      nomination: result.nomination,
      voteCount: result.voteCount,
      isApproved: result.isApproved
    });

  } catch (error) {
    console.error('Error voting on nomination:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Creator responds to nomination
router.post('/:nominationId/respond', authenticateToken, async (req, res) => {
  try {
    const { nominationId } = req.params;
    const { response } = req.body;
    const creatorId = req.user.id;

    console.log('👤 Creator responding to nomination:', { nominationId, creatorId, response });

    const result = await nominationService.creatorRespondToNomination(nominationId, creatorId, response);

    res.json({
      success: true,
      message: result.message,
      nomination: result.nomination,
      location: result.location,
      creditsSpent: result.creditsSpent
    });

  } catch (error) {
    console.error('Error responding to nomination:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Admin makes location official (Admin Path)
router.post('/:locationId/admin-make-official', authenticateToken, async (req, res) => {
  try {
    const { locationId } = req.params;
    const adminId = req.user.id;

    console.log('👑 Admin making location official:', { locationId, adminId });

    const result = await nominationService.adminMakeOfficial(locationId, adminId);

    res.json({
      success: true,
      message: result.message,
      location: result.location,
      creditsSpent: result.creditsSpent
    });

  } catch (error) {
    console.error('Error making location official by admin:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Get pending nominations
router.get('/pending', authenticateToken, async (req, res) => {
  try {
    const { limit, offset } = req.query;
    const options = {};
    
    if (limit) options.limit = parseInt(limit);
    if (offset) options.offset = parseInt(offset);

    const nominations = await nominationService.getPendingNominations(options);

    res.json({
      success: true,
      nominations: nominations
    });

  } catch (error) {
    console.error('Error getting pending nominations:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Get user's nominations (nominations they created)
router.get('/my-nominations', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const nominations = await nominationService.getNominationsByUser(userId);

    res.json({
      success: true,
      nominations: nominations
    });

  } catch (error) {
    console.error('Error getting user nominations:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Get nominations for user's locations (where they are the creator)
router.get('/for-my-locations', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const nominations = await nominationService.getNominationsForUserLocations(userId);

    res.json({
      success: true,
      nominations: nominations
    });

  } catch (error) {
    console.error('Error getting nominations for user locations:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Get nomination by ID
router.get('/:nominationId', authenticateToken, async (req, res) => {
  try {
    const { nominationId } = req.params;
    
    const nomination = await nominationService.getNominationById(nominationId);

    if (!nomination) {
      return res.status(404).json({
        success: false,
        message: 'Nomination not found'
      });
    }

    res.json({
      success: true,
      nomination: nomination
    });

  } catch (error) {
    console.error('Error getting nomination:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Clean up expired nominations (admin only)
router.post('/cleanup-expired', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only admins can clean up expired nominations'
      });
    }

    const cleanedCount = await nominationService.cleanupExpiredNominations();

    res.json({
      success: true,
      message: `Cleaned up ${cleanedCount} expired nominations`,
      cleanedCount: cleanedCount
    });

  } catch (error) {
    console.error('Error cleaning up expired nominations:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router; 