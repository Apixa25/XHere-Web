const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const duplicateDetectionService = require('../services/duplicateDetectionService');

/**
 * 🔍 Duplicate Detection Routes
 * AI-powered spam prevention through intelligent duplicate detection
 */

// GET /api/duplicate-detection/check
// Check for duplicates before creating a new location
router.get('/check', authenticateToken, async (req, res) => {
  try {
    const { latitude, longitude, text, locationType } = req.query;
    
    if (!latitude || !longitude || !text) {
      return res.status(400).json({
        error: 'Missing required parameters: latitude, longitude, text'
      });
    }

    console.log(`🔍 Duplicate check requested for location at (${latitude}, ${longitude})`);
    
    const locationData = {
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      text: text.trim(),
      locationType: locationType || 'general'
    };

    const analysis = await duplicateDetectionService.detectDuplicates(locationData, req.user.id);
    
    res.json({
      success: true,
      analysis,
      message: `Duplicate detection complete - Status: ${analysis.duplicateStatus}`
    });
  } catch (error) {
    console.error('❌ Error in duplicate check:', error);
    res.status(500).json({
      error: 'Failed to check for duplicates',
      details: error.message
    });
  }
});

// POST /api/duplicate-detection/report
// Report a location as a duplicate
router.post('/report', authenticateToken, async (req, res) => {
  try {
    const { locationId, analysis } = req.body;
    
    if (!locationId) {
      return res.status(400).json({
        error: 'Missing required parameter: locationId'
      });
    }

    console.log(`📝 Duplicate report requested for location ${locationId}`);
    
    const reportResult = await duplicateDetectionService.reportDuplicate(
      locationId,
      req.user.id,
      analysis
    );
    
    res.json({
      success: true,
      report: reportResult,
      message: 'Duplicate report submitted successfully'
    });
  } catch (error) {
    console.error('❌ Error reporting duplicate:', error);
    res.status(500).json({
      error: 'Failed to report duplicate',
      details: error.message
    });
  }
});

// GET /api/duplicate-detection/similar-coordinates
// Find locations with similar coordinates
router.get('/similar-coordinates', authenticateToken, async (req, res) => {
  try {
    const { latitude, longitude, radius = 50 } = req.query;
    
    if (!latitude || !longitude) {
      return res.status(400).json({
        error: 'Missing required parameters: latitude, longitude'
      });
    }

    console.log(`🔍 Similar coordinates check at (${latitude}, ${longitude}) within ${radius}m`);
    
    const similarLocations = await duplicateDetectionService.detectSimilarCoordinates(
      parseFloat(latitude),
      parseFloat(longitude),
      parseInt(radius)
    );
    
    res.json({
      success: true,
      similarLocations,
      count: similarLocations.length,
      message: `Found ${similarLocations.length} similar locations`
    });
  } catch (error) {
    console.error('❌ Error finding similar coordinates:', error);
    res.status(500).json({
      error: 'Failed to find similar coordinates',
      details: error.message
    });
  }
});

// GET /api/duplicate-detection/similar-text
// Find locations with similar text content
router.get('/similar-text', authenticateToken, async (req, res) => {
  try {
    const { text, threshold = 0.7 } = req.query;
    
    if (!text) {
      return res.status(400).json({
        error: 'Missing required parameter: text'
      });
    }

    console.log(`🎯 Similar text check for: "${text}" with threshold ${threshold}`);
    
    const similarLocations = await duplicateDetectionService.detectSimilarText(
      text.trim(),
      parseFloat(threshold)
    );
    
    res.json({
      success: true,
      similarLocations,
      count: similarLocations.length,
      message: `Found ${similarLocations.length} locations with similar text`
    });
  } catch (error) {
    console.error('❌ Error finding similar text:', error);
    res.status(500).json({
      error: 'Failed to find similar text',
      details: error.message
    });
  }
});

// GET /api/duplicate-detection/clustering-analysis
// Analyze user's posting patterns for clustering
router.get('/clustering-analysis', authenticateToken, async (req, res) => {
  try {
    const { userId, timeWindow = 24, maxLocations = 5 } = req.query;
    
    const targetUserId = userId || req.user.id;
    
    console.log(`🕵️ Clustering analysis for user ${targetUserId}`);
    
    const clusteringAnalysis = await duplicateDetectionService.detectClusteringPatterns(
      targetUserId,
      parseInt(timeWindow),
      parseInt(maxLocations)
    );
    
    res.json({
      success: true,
      clusteringAnalysis,
      message: clusteringAnalysis.isClustering 
        ? 'Clustering patterns detected' 
        : 'No clustering patterns detected'
    });
  } catch (error) {
    console.error('❌ Error analyzing clustering patterns:', error);
    res.status(500).json({
      error: 'Failed to analyze clustering patterns',
      details: error.message
    });
  }
});

// GET /api/duplicate-detection/stats
// Get duplicate detection statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.query;
    
    console.log(`📊 Duplicate detection stats requested${userId ? ` for user ${userId}` : ''}`);
    
    const stats = await duplicateDetectionService.getDuplicateStats(userId);
    
    res.json({
      success: true,
      stats,
      message: 'Duplicate detection statistics retrieved successfully'
    });
  } catch (error) {
    console.error('❌ Error getting duplicate stats:', error);
    res.status(500).json({
      error: 'Failed to get duplicate detection statistics',
      details: error.message
    });
  }
});

// POST /api/duplicate-detection/validate-location
// Comprehensive validation for new location creation
router.post('/validate-location', authenticateToken, async (req, res) => {
  try {
    const { latitude, longitude, text, locationType } = req.body;
    
    if (!latitude || !longitude || !text) {
      return res.status(400).json({
        error: 'Missing required parameters: latitude, longitude, text'
      });
    }

    console.log(`🛡️ Comprehensive location validation for user ${req.user.id}`);
    
    const locationData = {
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      text: text.trim(),
      locationType: locationType || 'general'
    };

    const analysis = await duplicateDetectionService.detectDuplicates(locationData, req.user.id);
    
    // Determine if location should be allowed, flagged, or rejected
    let validationResult = {
      allowed: true,
      requiresReview: false,
      autoReject: false,
      warnings: []
    };

    if (analysis.duplicateStatus === 'high_risk') {
      validationResult.allowed = false;
      validationResult.autoReject = true;
      validationResult.warnings.push('High risk of duplicate - automatic rejection');
    } else if (analysis.duplicateStatus === 'medium_risk') {
      validationResult.allowed = true;
      validationResult.requiresReview = true;
      validationResult.warnings.push('Medium risk detected - manual review recommended');
    } else if (analysis.duplicateStatus === 'low_risk') {
      validationResult.warnings.push('Low risk detected - proceed with caution');
    }

    // Add specific warnings based on flags
    analysis.duplicateFlags.forEach(flag => {
      if (flag.severity === 'high') {
        validationResult.warnings.push(flag.description);
      }
    });

    res.json({
      success: true,
      validation: validationResult,
      analysis,
      message: `Location validation complete - ${validationResult.allowed ? 'Allowed' : 'Rejected'}`
    });
  } catch (error) {
    console.error('❌ Error validating location:', error);
    res.status(500).json({
      error: 'Failed to validate location',
      details: error.message
    });
  }
});

module.exports = router; 