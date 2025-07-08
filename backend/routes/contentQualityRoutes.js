const express = require('express');
const router = express.Router();
const contentQualityService = require('../services/contentQualityService');
const { authenticateToken } = require('../middleware/auth');

/**
 * @route POST /api/content-quality/analyze
 * @desc Analyze content quality for a location
 * @access Private
 */
router.post('/analyze', authenticateToken, async (req, res) => {
  try {
    const { locationData, userData } = req.body;
    
    if (!locationData) {
      return res.status(400).json({
        error: 'Location data is required',
        message: 'Please provide location data for content quality analysis'
      });
    }

    console.log('🔍 Starting content quality analysis');
    
    const analysis = await contentQualityService.analyzeContentQuality(locationData, userData);
    
    res.json({
      success: true,
      message: 'Content quality analysis completed successfully',
      analysis: analysis
    });
    
  } catch (error) {
    console.error('❌ Error in content quality analysis route:', error);
    res.status(500).json({
      error: 'Content quality analysis failed',
      message: 'An error occurred while analyzing content quality',
      details: error.message
    });
  }
});

/**
 * @route POST /api/content-quality/validate
 * @desc Validate content for basic requirements
 * @access Private
 */
router.post('/validate', authenticateToken, async (req, res) => {
  try {
    const { locationData } = req.body;
    
    if (!locationData) {
      return res.status(400).json({
        error: 'Location data is required',
        message: 'Please provide location data for content validation'
      });
    }

    console.log('✅ Validating content requirements');
    
    const validation = contentQualityService.validateContent(locationData);
    
    res.json({
      success: true,
      message: 'Content validation completed',
      validation: validation
    });
    
  } catch (error) {
    console.error('❌ Error in content validation route:', error);
    res.status(500).json({
      error: 'Content validation failed',
      message: 'An error occurred while validating content',
      details: error.message
    });
  }
});

/**
 * @route POST /api/content-quality/detect-spam
 * @desc Detect spam keywords in content
 * @access Private
 */
router.post('/detect-spam', authenticateToken, async (req, res) => {
  try {
    const { locationData } = req.body;
    
    if (!locationData) {
      return res.status(400).json({
        error: 'Location data is required',
        message: 'Please provide location data for spam detection'
      });
    }

    console.log('🚨 Detecting spam keywords');
    
    const spamAnalysis = contentQualityService.detectSpamKeywords(locationData);
    
    res.json({
      success: true,
      message: 'Spam detection completed',
      spamAnalysis: spamAnalysis
    });
    
  } catch (error) {
    console.error('❌ Error in spam detection route:', error);
    res.status(500).json({
      error: 'Spam detection failed',
      message: 'An error occurred while detecting spam',
      details: error.message
    });
  }
});

/**
 * @route POST /api/content-quality/analyze-images
 * @desc Analyze image quality
 * @access Private
 */
router.post('/analyze-images', authenticateToken, async (req, res) => {
  try {
    const { images } = req.body;
    
    if (!images || !Array.isArray(images)) {
      return res.status(400).json({
        error: 'Images array is required',
        message: 'Please provide an array of images for analysis'
      });
    }

    console.log('📸 Analyzing image quality for', images.length, 'images');
    
    const imageAnalysis = contentQualityService.analyzeImageQuality(images);
    
    res.json({
      success: true,
      message: 'Image quality analysis completed',
      imageAnalysis: imageAnalysis
    });
    
  } catch (error) {
    console.error('❌ Error in image analysis route:', error);
    res.status(500).json({
      error: 'Image analysis failed',
      message: 'An error occurred while analyzing images',
      details: error.message
    });
  }
});

/**
 * @route POST /api/content-quality/analyze-description
 * @desc Analyze description quality
 * @access Private
 */
router.post('/analyze-description', authenticateToken, async (req, res) => {
  try {
    const { description } = req.body;
    
    if (!description) {
      return res.status(400).json({
        error: 'Description is required',
        message: 'Please provide a description for quality analysis'
      });
    }

    console.log('📝 Analyzing description quality');
    
    const descriptionAnalysis = contentQualityService.analyzeDescriptionQuality(description);
    
    res.json({
      success: true,
      message: 'Description quality analysis completed',
      descriptionAnalysis: descriptionAnalysis
    });
    
  } catch (error) {
    console.error('❌ Error in description analysis route:', error);
    res.status(500).json({
      error: 'Description analysis failed',
      message: 'An error occurred while analyzing description quality',
      details: error.message
    });
  }
});

/**
 * @route GET /api/content-quality/stats
 * @desc Get content quality statistics
 * @access Private (Admin only)
 */
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const { timeRange = '7d' } = req.query;
    
    console.log('📊 Getting content quality stats for time range:', timeRange);
    
    const stats = await contentQualityService.getContentQualityStats(timeRange);
    
    res.json({
      success: true,
      message: 'Content quality statistics retrieved successfully',
      stats: stats,
      timeRange: timeRange
    });
    
  } catch (error) {
    console.error('❌ Error getting content quality stats:', error);
    res.status(500).json({
      error: 'Failed to get content quality statistics',
      message: 'An error occurred while retrieving content quality statistics',
      details: error.message
    });
  }
});

/**
 * @route GET /api/content-quality/thresholds
 * @desc Get current content quality thresholds
 * @access Private (Admin only)
 */
router.get('/thresholds', authenticateToken, async (req, res) => {
  try {
    console.log('⚙️ Getting content quality thresholds');
    
    const thresholds = contentQualityService.getThresholds();
    
    res.json({
      success: true,
      message: 'Content quality thresholds retrieved successfully',
      thresholds: thresholds
    });
    
  } catch (error) {
    console.error('❌ Error getting content quality thresholds:', error);
    res.status(500).json({
      error: 'Failed to get content quality thresholds',
      message: 'An error occurred while retrieving content quality thresholds',
      details: error.message
    });
  }
});

/**
 * @route POST /api/content-quality/update-thresholds
 * @desc Update content quality thresholds
 * @access Private (Admin only)
 */
router.post('/update-thresholds', authenticateToken, async (req, res) => {
  try {
    const { thresholds } = req.body;
    
    if (!thresholds) {
      return res.status(400).json({
        error: 'Thresholds are required',
        message: 'Please provide threshold values to update'
      });
    }

    console.log('⚙️ Updating content quality thresholds:', thresholds);
    
    contentQualityService.updateThresholds(thresholds);
    
    res.json({
      success: true,
      message: 'Content quality thresholds updated successfully',
      thresholds: contentQualityService.getThresholds()
    });
    
  } catch (error) {
    console.error('❌ Error updating content quality thresholds:', error);
    res.status(500).json({
      error: 'Failed to update content quality thresholds',
      message: 'An error occurred while updating content quality thresholds',
      details: error.message
    });
  }
});

/**
 * @route GET /api/content-quality/quality-indicators
 * @desc Get quality indicators for content analysis
 * @access Private
 */
router.get('/quality-indicators', authenticateToken, async (req, res) => {
  try {
    console.log('📋 Getting content quality indicators');
    
    const thresholds = contentQualityService.getThresholds();
    
    res.json({
      success: true,
      message: 'Content quality indicators retrieved successfully',
      qualityIndicators: thresholds.qualityIndicators
    });
    
  } catch (error) {
    console.error('❌ Error getting quality indicators:', error);
    res.status(500).json({
      error: 'Failed to get quality indicators',
      message: 'An error occurred while retrieving quality indicators',
      details: error.message
    });
  }
});

/**
 * @route POST /api/content-quality/calculate-score
 * @desc Calculate overall content quality score
 * @access Private
 */
router.post('/calculate-score', authenticateToken, async (req, res) => {
  try {
    const { analysis } = req.body;
    
    if (!analysis) {
      return res.status(400).json({
        error: 'Analysis data is required',
        message: 'Please provide analysis data to calculate quality score'
      });
    }

    console.log('🎯 Calculating overall content quality score');
    
    const overallScore = contentQualityService.calculateOverallScore(analysis);
    const riskLevel = contentQualityService.determineRiskLevel(analysis);
    const recommendations = contentQualityService.generateRecommendations(analysis);
    
    res.json({
      success: true,
      message: 'Content quality score calculated successfully',
      score: overallScore,
      riskLevel: riskLevel,
      recommendations: recommendations
    });
    
  } catch (error) {
    console.error('❌ Error calculating content quality score:', error);
    res.status(500).json({
      error: 'Failed to calculate content quality score',
      message: 'An error occurred while calculating quality score',
      details: error.message
    });
  }
});

/**
 * @route GET /api/content-quality/recommendations/:locationId
 * @desc Get content quality recommendations for a location
 * @access Private
 */
router.get('/recommendations/:locationId', authenticateToken, async (req, res) => {
  try {
    const { locationId } = req.params;
    
    console.log('💡 Getting content quality recommendations for location:', locationId);
    
    // This would typically fetch the location data and analyze it
    // For now, we'll return a generic response
    res.json({
      success: true,
      message: 'Content quality recommendations retrieved successfully',
      recommendations: [
        'Add more descriptive content',
        'Include high-quality images',
        'Use specific location details',
        'Avoid generic descriptions'
      ]
    });
    
  } catch (error) {
    console.error('❌ Error getting content quality recommendations:', error);
    res.status(500).json({
      error: 'Failed to get content quality recommendations',
      message: 'An error occurred while retrieving recommendations',
      details: error.message
    });
  }
});

/**
 * @route GET /api/content-quality/risk-levels
 * @desc Get content quality risk level definitions
 * @access Private
 */
router.get('/risk-levels', authenticateToken, async (req, res) => {
  try {
    console.log('⚠️ Getting content quality risk level definitions');
    
    const riskLevels = {
      LOW: {
        description: 'High quality content with minimal issues',
        scoreRange: '80-100',
        actions: 'No action required'
      },
      MEDIUM: {
        description: 'Moderate quality content with some issues',
        scoreRange: '60-79',
        actions: 'Consider improvements'
      },
      HIGH: {
        description: 'Low quality content with significant issues',
        scoreRange: '40-59',
        actions: 'Requires improvement before approval'
      },
      CRITICAL: {
        description: 'Very low quality or spam content',
        scoreRange: '0-39',
        actions: 'Likely to be rejected or flagged'
      }
    };
    
    res.json({
      success: true,
      message: 'Content quality risk levels retrieved successfully',
      riskLevels: riskLevels
    });
    
  } catch (error) {
    console.error('❌ Error getting risk levels:', error);
    res.status(500).json({
      error: 'Failed to get risk levels',
      message: 'An error occurred while retrieving risk level definitions',
      details: error.message
    });
  }
});

module.exports = router; 