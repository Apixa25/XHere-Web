const express = require('express');
const router = express.Router();
const ReportAppealService = require('../services/reportAppealService');
const { authenticateToken, requireModerator } = require('../middleware/auth');
const LocationReport = require('../models/LocationReport');
const Location = require('../models/Location');

/**
 * 📝 REPORT SUBMISSION ENDPOINTS
 */

/**
 * @route POST /api/reports/submit
 * @desc Submit a location report with evidence
 * @access Authenticated users
 */
// Submit a new report
router.post('/submit', authenticateToken, async (req, res) => {
  try {
    const { locationId, reportType, reason, evidence, isAnonymous, contactEmail } = req.body;
    const reporterId = req.user.id;

    // Validate required fields
    if (!locationId || !reportType || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Location ID, report type, and reason are required'
      });
    }

    // Check if user has already reported this location
    const existingReport = await LocationReport.findOne({
      where: {
        locationId: locationId,
        reporterId: reporterId
      }
    });

    if (existingReport) {
      return res.status(409).json({
        success: false,
        message: 'You have already reported this location',
        existingReport: {
          id: existingReport.id,
          reportType: existingReport.reportType,
          status: existingReport.status,
          createdAt: existingReport.createdAt
        }
      });
    }

    // Validate location exists
    const location = await Location.findByPk(locationId);
    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Location not found'
      });
    }

    // Create the report
    const reportData = {
      reportType,
      reason: reason.trim(),
      evidence: evidence || [],
      isAnonymous: isAnonymous || false,
      contactEmail: contactEmail || null
    };
    
    const result = await ReportAppealService.submitReport(locationId, reporterId, reportData);
    const report = await LocationReport.findByPk(result.reportId);

    console.log('✅ Report submitted successfully:', {
      reportId: report.id,
      locationId: report.locationId,
      reporterId: report.reporterId,
      reportType: report.reportType
    });

    res.status(201).json({
      success: true,
      message: 'Report submitted successfully',
      report: {
        id: report.id,
        reportType: report.reportType,
        status: report.status,
        createdAt: report.createdAt
      }
    });

  } catch (error) {
    console.error('❌ Error submitting report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit report'
    });
  }
});

/**
 * @route GET /api/reports/my-reports
 * @desc Get user's submitted reports
 * @access Authenticated users
 */
router.get('/my-reports', authenticateToken, async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    
    const reports = await ReportAppealService.getUserReports(req.user.id, {
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    res.json({
      success: true,
      reports: reports.reports,
      pagination: reports.pagination
    });
  } catch (error) {
    console.error('❌ Error getting user reports:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * 🔍 MODERATION ENDPOINTS
 */

/**
 * @route GET /api/reports/for-review
 * @desc Get reports for moderation review
 * @access Moderators only
 */
router.get('/for-review', authenticateToken, requireModerator, async (req, res) => {
  try {
    const { limit = 20, offset = 0, status, priority, reportType } = req.query;
    
    const result = await ReportAppealService.getReportsForReview({
      limit: parseInt(limit),
      offset: parseInt(offset),
      status,
      priority,
      reportType
    });
    
    res.json({
      success: true,
      reports: result.reports,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('❌ Error getting reports for review:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @route POST /api/reports/:reportId/resolve
 * @desc Resolve a report
 * @access Moderators only
 */
router.post('/:reportId/resolve', authenticateToken, requireModerator, async (req, res) => {
  try {
    const { reportId } = req.params;
    const { resolution, notes } = req.body;
    
    if (!resolution) {
      return res.status(400).json({
        success: false,
        message: 'Resolution is required'
      });
    }
    
    const validResolutions = ['location_removed', 'location_flagged', 'warning_issued', 'no_action', 'user_suspended'];
    if (!validResolutions.includes(resolution)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid resolution type'
      });
    }
    
    const resolutionData = {
      resolution,
      notes: notes || ''
    };
    
    const result = await ReportAppealService.resolveReport(reportId, req.user.id, resolutionData);
    
    res.json({
      success: true,
      message: 'Report resolved successfully',
      ...result
    });
  } catch (error) {
    console.error('❌ Error resolving report:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * ⚖️ APPEAL SUBMISSION ENDPOINTS
 */

/**
 * @route POST /api/appeals/submit
 * @desc Submit an appeal for a removed location
 * @access Authenticated users
 */
router.post('/appeals/submit', authenticateToken, async (req, res) => {
  try {
    const { locationId, appealReason, evidence, contactEmail } = req.body;
    
    if (!locationId || !appealReason) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: locationId, appealReason'
      });
    }
    
    const appealData = {
      appealReason,
      evidence: evidence || [],
      contactEmail
    };
    
    const result = await ReportAppealService.submitAppeal(locationId, req.user.id, appealData);
    
    res.json({
      success: true,
      message: 'Appeal submitted successfully',
      ...result
    });
  } catch (error) {
    console.error('❌ Error submitting appeal:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @route GET /api/appeals/my-appeals
 * @desc Get user's submitted appeals
 * @access Authenticated users
 */
router.get('/appeals/my-appeals', authenticateToken, async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    
    const appeals = await ReportAppealService.getUserAppeals(req.user.id, {
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    res.json({
      success: true,
      appeals: appeals.appeals,
      pagination: appeals.pagination
    });
  } catch (error) {
    console.error('❌ Error getting user appeals:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @route GET /api/appeals/for-review
 * @desc Get appeals for review
 * @access Moderators only
 */
router.get('/appeals/for-review', authenticateToken, requireModerator, async (req, res) => {
  try {
    const { limit = 20, offset = 0, status, priority, isUrgent } = req.query;
    
    const result = await ReportAppealService.getAppealsForReview({
      limit: parseInt(limit),
      offset: parseInt(offset),
      status,
      priority,
      isUrgent: isUrgent === 'true'
    });
    
    res.json({
      success: true,
      appeals: result.appeals,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('❌ Error getting appeals for review:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @route POST /api/appeals/:appealId/review
 * @desc Review and decide on an appeal
 * @access Moderators only
 */
router.post('/appeals/:appealId/review', authenticateToken, requireModerator, async (req, res) => {
  try {
    const { appealId } = req.params;
    const { decision, notes, compensationAmount } = req.body;
    
    if (!decision) {
      return res.status(400).json({
        success: false,
        message: 'Decision is required'
      });
    }
    
    const validDecisions = ['location_restored', 'location_remains_removed', 'partial_restoration', 'compensation_granted'];
    if (!validDecisions.includes(decision)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid decision type'
      });
    }
    
    const decisionData = {
      decision,
      notes: notes || '',
      compensationAmount: compensationAmount || 0
    };
    
    const result = await ReportAppealService.reviewAppeal(appealId, req.user.id, decisionData);
    
    res.json({
      success: true,
      message: 'Appeal reviewed successfully',
      ...result
    });
  } catch (error) {
    console.error('❌ Error reviewing appeal:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * 📊 TRANSPARENCY ENDPOINTS
 */

/**
 * @route GET /api/transparency/dashboard
 * @desc Get transparency dashboard data
 * @access Public
 */
router.get('/transparency/dashboard', async (req, res) => {
  try {
    const { timeRange = '30d' } = req.query;
    
    const transparencyData = await ReportAppealService.getTransparencyData(timeRange);
    
    res.json({
      success: true,
      ...transparencyData
    });
  } catch (error) {
    console.error('❌ Error getting transparency data:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @route GET /api/transparency/reports
 * @desc Get public report statistics
 * @access Public
 */
router.get('/transparency/reports', async (req, res) => {
  try {
    const { timeRange = '30d' } = req.query;
    
    const transparencyData = await ReportAppealService.getTransparencyData(timeRange);
    
    res.json({
      success: true,
      timeRange: transparencyData.timeRange,
      reportStats: transparencyData.reportStats,
      summary: {
        totalReports: transparencyData.summary.totalReports,
        averageResolutionTime: transparencyData.summary.averageResolutionTime
      }
    });
  } catch (error) {
    console.error('❌ Error getting report statistics:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @route GET /api/transparency/appeals
 * @desc Get public appeal statistics
 * @access Public
 */
router.get('/transparency/appeals', async (req, res) => {
  try {
    const { timeRange = '30d' } = req.query;
    
    const transparencyData = await ReportAppealService.getTransparencyData(timeRange);
    
    res.json({
      success: true,
      timeRange: transparencyData.timeRange,
      appealStats: transparencyData.appealStats,
      summary: {
        totalAppeals: transparencyData.summary.totalAppeals
      }
    });
  } catch (error) {
    console.error('❌ Error getting appeal statistics:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @route GET /api/transparency/moderator-activity
 * @desc Get moderator activity statistics
 * @access Moderators only
 */
router.get('/transparency/moderator-activity', authenticateToken, requireModerator, async (req, res) => {
  try {
    const { timeRange = '30d' } = req.query;
    
    const transparencyData = await ReportAppealService.getTransparencyData(timeRange);
    
    res.json({
      success: true,
      timeRange: transparencyData.timeRange,
      moderatorActivity: transparencyData.moderatorActivity,
      summary: {
        totalReports: transparencyData.summary.totalReports,
        totalAppeals: transparencyData.summary.totalAppeals,
        averageResolutionTime: transparencyData.summary.averageResolutionTime
      }
    });
  } catch (error) {
    console.error('❌ Error getting moderator activity:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Check if user has already reported a location
router.get('/check-existing', authenticateToken, async (req, res) => {
  try {
    const { locationId } = req.query;
    const userId = req.user.id;

    if (!locationId) {
      return res.status(400).json({
        success: false,
        message: 'Location ID is required'
      });
    }

    // Check if user has already reported this location
    const existingReport = await LocationReport.findOne({
      where: {
        locationId: locationId,
        reporterId: userId
      },
      include: [
        {
          model: Location,
          as: 'location',
          attributes: ['id', 'content']
        }
      ]
    });

    if (existingReport) {
      return res.json({
        success: true,
        hasExistingReport: true,
        existingReport: {
          id: existingReport.id,
          reportType: existingReport.reportType,
          reason: existingReport.reason,
          status: existingReport.status,
          createdAt: existingReport.createdAt,
          location: existingReport.location
        }
      });
    }

    return res.json({
      success: true,
      hasExistingReport: false,
      existingReport: null
    });

  } catch (error) {
    console.error('Error checking existing report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check existing report'
    });
  }
});

module.exports = router; 