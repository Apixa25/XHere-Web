const LocationReport = require('../models/LocationReport');
const LocationAppeal = require('../models/LocationAppeal');
const Location = require('../models/Location');
const User = require('../models/User');
const { Op, fn, col, literal } = require('sequelize');

class ReportAppealService {
  /**
   * 📝 Submit a location report
   */
  async submitReport(reportData, reporterId) {
    try {
      const { locationId, reportType, reason, evidence, isAnonymous, contactEmail } = reportData;

      // Check if user has already reported this location
      const existingReport = await LocationReport.findOne({
        where: {
          locationId: locationId,
          reporterId: reporterId
        }
      });

      if (existingReport) {
        throw new Error('You have already reported this location');
      }

      // Validate location exists
      const location = await Location.findByPk(locationId);
      if (!location) {
        throw new Error('Location not found');
      }

      // Create the report
      const report = await LocationReport.create({
        locationId,
        reporterId,
        reportType,
        reason: reason.trim(),
        evidence: evidence || [],
        isAnonymous: isAnonymous || false,
        contactEmail: contactEmail || null,
        status: 'pending',
        priority: this.calculatePriority(reportType, reason)
      });

      return {
        reportId: report.id,
        status: report.status,
        createdAt: report.createdAt
      };
    } catch (error) {
      throw new Error(`Failed to submit report: ${error.message}`);
    }
  }

  /**
   * ⚖️ Submit an appeal for a removed location
   */
  async submitAppeal(appealData, appellantId) {
    try {
      const { locationId, appealReason, evidence, contactEmail } = appealData;

      // Validate location exists and was removed
      const location = await Location.findByPk(locationId);
      if (!location) {
        throw new Error('Location not found');
      }

      if (location.status !== 'removed') {
        throw new Error('Location is not removed and cannot be appealed');
      }

      // Check if user has already appealed this location
      const existingAppeal = await LocationAppeal.findOne({
        where: {
          locationId: locationId,
          appellantId: appellantId
        }
      });

      if (existingAppeal) {
        throw new Error('You have already appealed this location');
      }

      // Create the appeal
      const appeal = await LocationAppeal.create({
        locationId,
        appellantId,
        appealReason: appealReason.trim(),
        evidence: evidence || [],
        contactEmail: contactEmail || null,
        status: 'pending'
      });

      return {
        appealId: appeal.id,
        status: appeal.status,
        createdAt: appeal.createdAt
      };
    } catch (error) {
      throw new Error(`Failed to submit appeal: ${error.message}`);
    }
  }

  /**
   * 🔍 Get reports for moderation review
   */
  async getReportsForReview(filters = {}) {
    try {
      const {
        status,
        priority,
        reportType,
        timeRange = '7d',
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = filters;

      // Calculate date range
      const dateRange = this.calculateDateRange(timeRange);

      // Build where clause
      const whereClause = {};
      if (status && status !== 'all') whereClause.status = status;
      if (priority && priority !== 'all') whereClause.priority = priority;
      if (reportType && reportType !== 'all') whereClause.reportType = reportType;
      if (dateRange) whereClause.createdAt = { [Op.gte]: dateRange };

      // Get reports with associations
      const reports = await LocationReport.findAll({
        where: whereClause,
        include: [
          {
            model: Location,
            as: 'location',
            include: [{ model: User, as: 'creator' }]
          },
          {
            model: User,
            as: 'reporter'
          }
        ],
        order: [[sortBy, sortOrder.toUpperCase()]],
        limit: 50
      });

      // Get statistics
      const stats = await this.getReportStats();

      return {
        reports,
        stats,
        pagination: {
          total: reports.length,
          limit: 50
        }
      };
    } catch (error) {
      throw new Error(`Failed to get reports for review: ${error.message}`);
    }
  }

  /**
   * 🔍 Resolve a report
   */
  async resolveReport(reportId, resolution, moderatorId) {
    try {
      const report = await LocationReport.findByPk(reportId);
      if (!report) {
        throw new Error('Report not found');
      }

      // Update report status
      await report.update({
        status: resolution.status,
        resolvedBy: moderatorId,
        resolvedAt: new Date(),
        resolutionNotes: resolution.notes,
        resolutionAction: resolution.action
      });

      // Handle location actions based on resolution
      await this.handleLocationAction(report.locationId, resolution.action);

      // Send notifications if requested
      if (resolution.notifyReporter) {
        await this.sendNotification(report.reporterId, {
          type: 'report_resolved',
          title: 'Your report has been resolved',
          message: `Your report has been reviewed and ${resolution.action}.`,
          data: { reportId, resolution: resolution.action }
        });
      }

      if (resolution.notifyLocationOwner) {
        const location = await Location.findByPk(report.locationId);
        if (location && location.userId) {
          await this.sendNotification(location.userId, {
            type: 'location_action',
            title: 'Action taken on your location',
            message: `An action has been taken on your location: ${resolution.action}.`,
            data: { locationId: report.locationId, action: resolution.action }
          });
        }
      }

      return {
        success: true,
        reportId: report.id,
        status: report.status
      };
    } catch (error) {
      throw new Error(`Failed to resolve report: ${error.message}`);
    }
  }

  /**
   * 📊 Get report details
   */
  async getReportDetails(reportId) {
    try {
      const report = await LocationReport.findByPk(reportId, {
        include: [
          {
            model: Location,
            as: 'location',
            include: [{ model: User, as: 'creator' }]
          },
          {
            model: User,
            as: 'reporter'
          }
        ]
      });

      if (!report) {
        throw new Error('Report not found');
      }

      return report;
    } catch (error) {
      throw new Error(`Failed to get report details: ${error.message}`);
    }
  }

  /**
   * 📊 Get admin statistics
   */
  async getAdminStats() {
    try {
      const [
        totalReports,
        pendingReports,
        resolvedReports,
        totalUsers,
        activeModerators
      ] = await Promise.all([
        LocationReport.count(),
        LocationReport.count({ where: { status: 'pending' } }),
        LocationReport.count({ where: { status: 'resolved' } }),
        User.count(),
        User.count({ where: { isModerator: true } })
      ]);

      return {
        totalReports,
        pendingReports,
        resolvedReports,
        totalUsers,
        activeModerators,
        systemHealth: 'good'
      };
    } catch (error) {
      throw new Error(`Failed to get admin stats: ${error.message}`);
    }
  }

  /**
   * 👥 Get moderators list
   */
  async getModerators() {
    try {
      const moderators = await User.findAll({
        where: { isModerator: true },
        attributes: ['id', 'email', 'profile'],
        include: [
          {
            model: LocationReport,
            as: 'reportsReviewed',
            where: { status: 'resolved' },
            required: false,
            attributes: []
          }
        ],
        group: ['User.id']
      });

      return moderators.map(moderator => ({
        ...moderator.toJSON(),
        reportsHandled: moderator.reportsReviewed?.length || 0
      }));
    } catch (error) {
      throw new Error(`Failed to get moderators: ${error.message}`);
    }
  }

  /**
   * ➕ Add moderator
   */
  async addModerator(userId) {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      await user.update({ isModerator: true });
      return { success: true, userId };
    } catch (error) {
      throw new Error(`Failed to add moderator: ${error.message}`);
    }
  }

  /**
   * 🗑️ Remove moderator
   */
  async removeModerator(userId) {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      await user.update({ isModerator: false });
      return { success: true, userId };
    } catch (error) {
      throw new Error(`Failed to remove moderator: ${error.message}`);
    }
  }

  /**
   * ⚙️ Update system setting
   */
  async updateSystemSetting(setting, value) {
    try {
      // In a real implementation, you would store settings in a database
      // For now, we'll just return success
      console.log(`Setting updated: ${setting} = ${value}`);
      return { success: true, setting, value };
    } catch (error) {
      throw new Error(`Failed to update setting: ${error.message}`);
    }
  }

  /**
   * ⚙️ Get system settings
   */
  async getSystemSettings() {
    try {
      // Mock settings for now
      return {
        autoModeration: true,
        requireEvidence: true,
        maxReportsPerUser: 5,
        reportCooldown: 24,
        moderatorApprovalRequired: false
      };
    } catch (error) {
      throw new Error(`Failed to get system settings: ${error.message}`);
    }
  }

  /**
   * ⚖️ Get appeals for review
   */
  async getAppealsForReview(filters = {}) {
    try {
      const {
        status,
        priority,
        timeRange = '7d',
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = filters;

      const dateRange = this.calculateDateRange(timeRange);
      const whereClause = {};
      if (status && status !== 'all') whereClause.status = status;
      if (dateRange) whereClause.createdAt = { [Op.gte]: dateRange };

      const appeals = await LocationAppeal.findAll({
        where: whereClause,
        include: [
          {
            model: Location,
            as: 'location'
          },
          {
            model: User,
            as: 'appellant'
          }
        ],
        order: [[sortBy, sortOrder.toUpperCase()]],
        limit: 50
      });

      return {
        appeals,
        pagination: {
          total: appeals.length,
          limit: 50
        }
      };
    } catch (error) {
      throw new Error(`Failed to get appeals for review: ${error.message}`);
    }
  }

  /**
   * ⚖️ Resolve appeal
   */
  async resolveAppeal(appealId, resolution, moderatorId) {
    try {
      const appeal = await LocationAppeal.findByPk(appealId);
      if (!appeal) {
        throw new Error('Appeal not found');
      }

      await appeal.update({
        status: resolution.status,
        resolvedBy: moderatorId,
        resolvedAt: new Date(),
        resolutionNotes: resolution.notes,
        resolutionAction: resolution.action
      });

      return {
        success: true,
        appealId: appeal.id,
        status: appeal.status
      };
    } catch (error) {
      throw new Error(`Failed to resolve appeal: ${error.message}`);
    }
  }

  /**
   * 📊 Get user report history
   */
  async getUserReportHistory(userId) {
    try {
      const reports = await LocationReport.findAll({
        where: { reporterId: userId },
        include: [
          {
            model: Location,
            as: 'location'
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: 20
      });

      return reports;
    } catch (error) {
      throw new Error(`Failed to get user report history: ${error.message}`);
    }
  }

  /**
   * 📦 Bulk resolve reports
   */
  async bulkResolveReports(reportIds, resolution, moderatorId) {
    try {
      const results = await Promise.all(
        reportIds.map(reportId => this.resolveReport(reportId, resolution, moderatorId))
      );

      return {
        success: true,
        resolvedCount: results.length,
        results
      };
    } catch (error) {
      throw new Error(`Failed to bulk resolve reports: ${error.message}`);
    }
  }

  /**
   * 📈 Get moderation analytics
   */
  async getModerationAnalytics(timeRange = '30d') {
    try {
      const dateRange = this.calculateDateRange(timeRange);
      
      const [totalReports, resolvedReports, averageResolutionTime] = await Promise.all([
        LocationReport.count({ where: { createdAt: { [Op.gte]: dateRange } } }),
        LocationReport.count({ 
          where: { 
            status: 'resolved',
            createdAt: { [Op.gte]: dateRange }
          }
        }),
        LocationReport.findOne({
          where: { 
            status: 'resolved',
            createdAt: { [Op.gte]: dateRange }
          },
          attributes: [
            [fn('AVG', fn('EXTRACT', 'EPOCH', literal('"resolvedAt" - "createdAt"'))), 'avgResolutionTime']
          ]
        })
      ]);

      return {
        totalReports,
        resolvedReports,
        averageResolutionTime: averageResolutionTime?.dataValues?.avgResolutionTime || 0,
        timeRange
      };
    } catch (error) {
      throw new Error(`Failed to get moderation analytics: ${error.message}`);
    }
  }

  /**
   * 📤 Export reports
   */
  async exportReports(filters = {}) {
    try {
      const reports = await this.getReportsForReview(filters);
      return reports.reports;
    } catch (error) {
      throw new Error(`Failed to export reports: ${error.message}`);
    }
  }

  /**
   * 📧 Send notification
   */
  async sendNotification(userId, notification) {
    try {
      // In a real implementation, you would send actual notifications
      console.log(`Notification sent to user ${userId}:`, notification);
      return { success: true, userId, notification };
    } catch (error) {
      throw new Error(`Failed to send notification: ${error.message}`);
    }
  }

  /**
   * 🔍 Check if user has already reported a location
   */
  async checkUserReport(locationId, userId) {
    try {
      const existingReport = await LocationReport.findOne({
        where: {
          locationId: locationId,
          reporterId: userId
        },
        include: [
          {
            model: Location,
            as: 'location'
          }
        ]
      });

      return {
        hasExistingReport: !!existingReport,
        existingReport: existingReport ? {
          id: existingReport.id,
          reportType: existingReport.reportType,
          status: existingReport.status,
          createdAt: existingReport.createdAt,
          location: existingReport.location
        } : null
      };
    } catch (error) {
      throw new Error(`Failed to check user report: ${error.message}`);
    }
  }

  /**
   * 📊 Get transparency dashboard data
   */
  async getTransparencyDashboard(timeRange = '30d') {
    try {
      const dateRange = this.calculateDateRange(timeRange);
      
      const [totalReports, totalAppeals, reportsByType] = await Promise.all([
        LocationReport.count({ where: { createdAt: { [Op.gte]: dateRange } } }),
        LocationAppeal.count({ where: { createdAt: { [Op.gte]: dateRange } } }),
        LocationReport.findAll({
          where: { createdAt: { [Op.gte]: dateRange } },
          attributes: [
            'reportType',
            [fn('COUNT', col('id')), 'count']
          ],
          group: ['reportType']
        })
      ]);

      const reportsByTypeMap = {};
      reportsByType.forEach(item => {
        reportsByTypeMap[item.reportType] = parseInt(item.dataValues.count);
      });

      return {
        totalReports,
        totalAppeals,
        reportsByType: reportsByTypeMap,
        timeRange
      };
    } catch (error) {
      throw new Error(`Failed to get transparency dashboard: ${error.message}`);
    }
  }

  // Helper methods
  calculatePriority(reportType, reason) {
    const urgentKeywords = ['urgent', 'emergency', 'dangerous', 'illegal'];
    const hasUrgentKeywords = urgentKeywords.some(keyword => 
      reason.toLowerCase().includes(keyword)
    );

    if (hasUrgentKeywords || reportType === 'inappropriate') return 'urgent';
    if (reportType === 'spam') return 'high';
    if (reportType === 'duplicate') return 'medium';
    return 'low';
  }

  calculateDateRange(timeRange) {
    const now = new Date();
    switch (timeRange) {
      case '1d':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '90d':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
  }

  async getReportStats() {
    try {
      const [pending, underReview, resolved, total] = await Promise.all([
        LocationReport.count({ where: { status: 'pending' } }),
        LocationReport.count({ where: { status: 'under_review' } }),
        LocationReport.count({ where: { status: 'resolved' } }),
        LocationReport.count()
      ]);

      return { pending, underReview, resolved, total };
    } catch (error) {
      console.error('Error getting report stats:', error);
      return { pending: 0, underReview: 0, resolved: 0, total: 0 };
    }
  }

  async handleLocationAction(locationId, action) {
    try {
      const location = await Location.findByPk(locationId);
      if (!location) return;

      switch (action) {
        case 'remove_location':
          await location.update({ status: 'removed' });
          break;
        case 'flag_for_review':
          await location.update({ status: 'flagged' });
          break;
        case 'warn_location_owner':
          // Just log the warning, no location status change
          console.log(`Warning issued for location ${locationId}`);
          break;
        default:
          // No action needed
          break;
      }
    } catch (error) {
      console.error('Error handling location action:', error);
    }
  }
}

module.exports = new ReportAppealService(); 