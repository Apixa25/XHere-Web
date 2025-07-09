const express = require('express');
const router = express.Router();
const { requireAuth, requireModerator } = require('../middleware/auth');
const reportAppealService = require('../services/reportAppealService');

// User endpoints
router.post('/reports/submit', requireAuth, async (req, res) => {
  try {
    const result = await reportAppealService.submitReport(req.body, req.user.id);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.post('/appeals/submit', requireAuth, async (req, res) => {
  try {
    const result = await reportAppealService.submitAppeal(req.body, req.user.id);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Moderator endpoints
router.get('/for-review', requireModerator, async (req, res) => {
  try {
    const { status, priority, reportType, timeRange, sortBy, sortOrder } = req.query;
    const filters = { status, priority, reportType, timeRange, sortBy, sortOrder };
    
    const result = await reportAppealService.getReportsForReview(filters);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/:reportId/resolve', requireModerator, async (req, res) => {
  try {
    const { reportId } = req.params;
    const resolution = req.body;
    
    const result = await reportAppealService.resolveReport(reportId, resolution, req.user.id);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.get('/:reportId', requireModerator, async (req, res) => {
  try {
    const { reportId } = req.params;
    const result = await reportAppealService.getReportDetails(reportId);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
});

// Admin endpoints
router.get('/admin/stats', requireModerator, async (req, res) => {
  try {
    const stats = await reportAppealService.getAdminStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/admin/moderators', requireModerator, async (req, res) => {
  try {
    const moderators = await reportAppealService.getModerators();
    res.json({ success: true, data: moderators });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/admin/moderators', requireModerator, async (req, res) => {
  try {
    const { userId } = req.body;
    const result = await reportAppealService.addModerator(userId);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.delete('/admin/moderators/:userId', requireModerator, async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await reportAppealService.removeModerator(userId);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.put('/admin/settings', requireModerator, async (req, res) => {
  try {
    const { setting, value } = req.body;
    const result = await reportAppealService.updateSystemSetting(setting, value);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.get('/admin/settings', requireModerator, async (req, res) => {
  try {
    const settings = await reportAppealService.getSystemSettings();
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Appeal endpoints
router.get('/appeals/for-review', requireModerator, async (req, res) => {
  try {
    const { status, priority, timeRange, sortBy, sortOrder } = req.query;
    const filters = { status, priority, timeRange, sortBy, sortOrder };
    
    const result = await reportAppealService.getAppealsForReview(filters);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/appeals/:appealId/resolve', requireModerator, async (req, res) => {
  try {
    const { appealId } = req.params;
    const resolution = req.body;
    
    const result = await reportAppealService.resolveAppeal(appealId, resolution, req.user.id);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// User report history
router.get('/users/:userId/reports', requireModerator, async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await reportAppealService.getUserReportHistory(userId);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Bulk operations
router.post('/bulk-resolve', requireModerator, async (req, res) => {
  try {
    const { reportIds, resolution } = req.body;
    const result = await reportAppealService.bulkResolveReports(reportIds, resolution, req.user.id);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Analytics
router.get('/admin/analytics', requireModerator, async (req, res) => {
  try {
    const { timeRange } = req.query;
    const analytics = await reportAppealService.getModerationAnalytics(timeRange);
    res.json({ success: true, data: analytics });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Export functionality
router.get('/export', requireModerator, async (req, res) => {
  try {
    const filters = req.query;
    const exportData = await reportAppealService.exportReports(filters);
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=reports-export.json');
    res.json(exportData);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Notifications
router.post('/notifications/send', requireModerator, async (req, res) => {
  try {
    const { userId, notification } = req.body;
    const result = await reportAppealService.sendNotification(userId, notification);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Check if user has already reported a location
router.get('/check/:locationId', requireAuth, async (req, res) => {
  try {
    const { locationId } = req.params;
    const result = await reportAppealService.checkUserReport(locationId, req.user.id);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Transparency endpoints
router.get('/transparency/dashboard', async (req, res) => {
  try {
    const { timeRange } = req.query;
    const data = await reportAppealService.getTransparencyDashboard(timeRange);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router; 