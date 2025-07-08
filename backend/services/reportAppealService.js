const LocationReport = require('../models/LocationReport');
const LocationAppeal = require('../models/LocationAppeal');
const Location = require('../models/Location');
const User = require('../models/User');
const { Op, fn, col } = require('sequelize');
const sequelize = require('../config/database');

class ReportAppealService {
  /**
   * 📝 Submit a location report with evidence
   * @param {string} locationId - Location ID
   * @param {string} reporterId - User ID of reporter
   * @param {Object} reportData - Report data
   * @returns {Promise<Object>} Report creation result
   */
  static async submitReport(locationId, reporterId, reportData) {
    const transaction = await sequelize.transaction();
    
    try {
      console.log(`📝 Creating report for location ${locationId} by user ${reporterId}`);
      
      // Validate location exists
      const location = await Location.findByPk(locationId);
      if (!location) {
        throw new Error('Location not found');
      }
      
      // Check if user has already reported this location
      const existingReport = await LocationReport.findOne({
        where: {
          locationId,
          reporterId,
          status: { [Op.in]: ['pending', 'under_review'] }
        }
      });
      
      if (existingReport) {
        throw new Error('You have already reported this location');
      }
      
      // Determine priority based on report type and evidence
      const priority = this.calculateReportPriority(reportData.reportType, reportData.evidence);
      
      // Create the report
      const report = await LocationReport.create({
        locationId,
        reporterId,
        reportType: reportData.reportType,
        reason: reportData.reason,
        evidence: reportData.evidence || [],
        priority,
        isAnonymous: reportData.isAnonymous || false,
        contactEmail: reportData.contactEmail
      }, { transaction });
      
      // Update location status if multiple reports exist
      await this.updateLocationStatusForReports(locationId, transaction);
      
      await transaction.commit();
      
      console.log(`✅ Report created successfully: ${report.id}`);
      
      return {
        success: true,
        reportId: report.id,
        message: 'Report submitted successfully',
        priority: report.priority
      };
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error submitting report:', error);
      throw error;
    }
  }
  
  /**
   * ⚖️ Submit an appeal for a removed location
   * @param {string} locationId - Location ID
   * @param {string} appellantId - User ID of appellant
   * @param {Object} appealData - Appeal data
   * @returns {Promise<Object>} Appeal creation result
   */
  static async submitAppeal(locationId, appellantId, appealData) {
    const transaction = await sequelize.transaction();
    
    try {
      console.log(`⚖️ Creating appeal for location ${locationId} by user ${appellantId}`);
      
      // Validate location exists and is removed
      const location = await Location.findByPk(locationId);
      if (!location) {
        throw new Error('Location not found');
      }
      
      if (location.locationStatus !== 'removed') {
        throw new Error('Location is not removed and cannot be appealed');
      }
      
      // Check if user is the creator of the location
      if (location.creatorId !== appellantId) {
        throw new Error('Only the location creator can submit an appeal');
      }
      
      // Check if appeal already exists
      const existingAppeal = await LocationAppeal.findOne({
        where: {
          locationId,
          appellantId,
          status: { [Op.in]: ['pending', 'under_review'] }
        }
      });
      
      if (existingAppeal) {
        throw new Error('You have already submitted an appeal for this location');
      }
      
      // Find the original report that led to removal
      const originalReport = await LocationReport.findOne({
        where: {
          locationId,
          resolution: 'location_removed'
        },
        order: [['resolvedAt', 'DESC']]
      });
      
      // Determine priority and urgency
      const priority = this.calculateAppealPriority(appealData.evidence);
      const isUrgent = this.determineAppealUrgency(appealData.evidence, location);
      
      // Create the appeal
      const appeal = await LocationAppeal.create({
        locationId,
        appellantId,
        originalReportId: originalReport?.id,
        appealReason: appealData.appealReason,
        evidence: appealData.evidence || [],
        priority,
        isUrgent,
        contactEmail: appealData.contactEmail
      }, { transaction });
      
      await transaction.commit();
      
      console.log(`✅ Appeal created successfully: ${appeal.id}`);
      
      return {
        success: true,
        appealId: appeal.id,
        message: 'Appeal submitted successfully',
        priority: appeal.priority,
        isUrgent: appeal.isUrgent
      };
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error submitting appeal:', error);
      throw error;
    }
  }
  
  /**
   * 📊 Get reports for moderation review
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Reports data
   */
  static async getReportsForReview(options = {}) {
    try {
      const { limit = 20, offset = 0, status, priority, reportType } = options;
      
      const whereClause = {};
      if (status) whereClause.status = status;
      if (priority) whereClause.priority = priority;
      if (reportType) whereClause.reportType = reportType;
      
      const reports = await LocationReport.findAll({
        where: whereClause,
        include: [
          {
            model: Location,
            as: 'location',
            attributes: ['id', 'name', 'description', 'locationType', 'locationStatus']
          },
          {
            model: User,
            as: 'reporter',
            attributes: ['id', 'email', 'profile', 'trustLevel']
          },
          {
            model: User,
            as: 'moderator',
            attributes: ['id', 'email', 'profile']
          }
        ],
        order: [
          ['priority', 'DESC'],
          ['createdAt', 'ASC']
        ],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
      
      const totalCount = await LocationReport.count({ where: whereClause });
      
      return {
        reports,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: totalCount
        }
      };
    } catch (error) {
      console.error('❌ Error getting reports for review:', error);
      throw error;
    }
  }
  
  /**
   * ⚖️ Get appeals for review
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Appeals data
   */
  static async getAppealsForReview(options = {}) {
    try {
      const { limit = 20, offset = 0, status, priority, isUrgent } = options;
      
      const whereClause = {};
      if (status) whereClause.status = status;
      if (priority) whereClause.priority = priority;
      if (isUrgent !== undefined) whereClause.isUrgent = isUrgent;
      
      const appeals = await LocationAppeal.findAll({
        where: whereClause,
        include: [
          {
            model: Location,
            as: 'location',
            attributes: ['id', 'name', 'description', 'locationType', 'locationStatus']
          },
          {
            model: User,
            as: 'appellant',
            attributes: ['id', 'email', 'profile', 'trustLevel']
          },
          {
            model: User,
            as: 'reviewer',
            attributes: ['id', 'email', 'profile']
          },
          {
            model: LocationReport,
            as: 'originalReport',
            attributes: ['id', 'reportType', 'reason', 'resolution']
          }
        ],
        order: [
          ['isUrgent', 'DESC'],
          ['priority', 'DESC'],
          ['createdAt', 'ASC']
        ],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
      
      const totalCount = await LocationAppeal.count({ where: whereClause });
      
      return {
        appeals,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: totalCount
        }
      };
    } catch (error) {
      console.error('❌ Error getting appeals for review:', error);
      throw error;
    }
  }
  
  /**
   * 🔍 Review and resolve a report
   * @param {string} reportId - Report ID
   * @param {string} moderatorId - Moderator user ID
   * @param {Object} resolutionData - Resolution data
   * @returns {Promise<Object>} Resolution result
   */
  static async resolveReport(reportId, moderatorId, resolutionData) {
    const transaction = await sequelize.transaction();
    
    try {
      console.log(`🔍 Resolving report ${reportId} by moderator ${moderatorId}`);
      
      const report = await LocationReport.findByPk(reportId, {
        include: [{ model: Location, as: 'location' }]
      });
      
      if (!report) {
        throw new Error('Report not found');
      }
      
      if (report.status === 'resolved') {
        throw new Error('Report has already been resolved');
      }
      
      // Update report with resolution
      await report.update({
        status: 'resolved',
        moderatorId,
        moderatorNotes: resolutionData.notes,
        resolution: resolutionData.resolution,
        resolvedAt: new Date()
      }, { transaction });
      
      // Apply resolution to location
      await this.applyReportResolution(report.locationId, resolutionData.resolution, transaction);
      
      await transaction.commit();
      
      console.log(`✅ Report resolved successfully: ${reportId}`);
      
      return {
        success: true,
        reportId: report.id,
        resolution: resolutionData.resolution,
        message: 'Report resolved successfully'
      };
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error resolving report:', error);
      throw error;
    }
  }
  
  /**
   * ⚖️ Review and decide on an appeal
   * @param {string} appealId - Appeal ID
   * @param {string} reviewerId - Reviewer user ID
   * @param {Object} decisionData - Decision data
   * @returns {Promise<Object>} Decision result
   */
  static async reviewAppeal(appealId, reviewerId, decisionData) {
    const transaction = await sequelize.transaction();
    
    try {
      console.log(`⚖️ Reviewing appeal ${appealId} by reviewer ${reviewerId}`);
      
      const appeal = await LocationAppeal.findByPk(appealId, {
        include: [{ model: Location, as: 'location' }]
      });
      
      if (!appeal) {
        throw new Error('Appeal not found');
      }
      
      if (appeal.status === 'approved' || appeal.status === 'rejected') {
        throw new Error('Appeal has already been reviewed');
      }
      
      // Update appeal with decision
      await appeal.update({
        status: decisionData.decision === 'location_restored' ? 'approved' : 'rejected',
        reviewerId,
        reviewerNotes: decisionData.notes,
        decision: decisionData.decision,
        compensationAmount: decisionData.compensationAmount || 0,
        reviewedAt: new Date()
      }, { transaction });
      
      // Apply appeal decision to location
      await this.applyAppealDecision(appeal.locationId, decisionData.decision, transaction);
      
      // Award compensation if applicable
      if (decisionData.compensationAmount > 0) {
        await this.awardCompensation(appeal.appellantId, decisionData.compensationAmount, transaction);
      }
      
      await transaction.commit();
      
      console.log(`✅ Appeal reviewed successfully: ${appealId}`);
      
      return {
        success: true,
        appealId: appeal.id,
        decision: decisionData.decision,
        message: 'Appeal reviewed successfully'
      };
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error reviewing appeal:', error);
      throw error;
    }
  }
  
  /**
   * 📊 Get transparency dashboard data
   * @param {string} timeRange - Time range for data
   * @returns {Promise<Object>} Transparency data
   */
  static async getTransparencyData(timeRange = '30d') {
    try {
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      // Get report statistics
      const reportStats = await LocationReport.findAll({
        attributes: [
          'status',
          'reportType',
          'resolution',
          [fn('COUNT', col('id')), 'count']
        ],
        where: {
          createdAt: { [Op.gte]: startDate }
        },
        group: ['status', 'reportType', 'resolution'],
        raw: true
      });
      
      // Get appeal statistics
      const appealStats = await LocationAppeal.findAll({
        attributes: [
          'status',
          'decision',
          [fn('COUNT', col('id')), 'count']
        ],
        where: {
          createdAt: { [Op.gte]: startDate }
        },
        group: ['status', 'decision'],
        raw: true
      });
      
      // Get moderator activity
      const moderatorActivity = await LocationReport.findAll({
        attributes: [
          'moderatorId',
          [fn('COUNT', col('id')), 'reportsResolved']
        ],
        where: {
          moderatorId: { [Op.ne]: null },
          status: 'resolved',
          createdAt: { [Op.gte]: startDate }
        },
        group: ['moderatorId'],
        include: [{ model: User, as: 'moderator', attributes: ['email'] }],
        raw: true
      });
      
      return {
        timeRange,
        generatedAt: new Date(),
        reportStats: this.processReportStats(reportStats),
        appealStats: this.processAppealStats(appealStats),
        moderatorActivity,
        summary: {
          totalReports: reportStats.reduce((sum, stat) => sum + parseInt(stat.count), 0),
          totalAppeals: appealStats.reduce((sum, stat) => sum + parseInt(stat.count), 0),
          averageResolutionTime: await this.calculateAverageResolutionTime(startDate)
        }
      };
    } catch (error) {
      console.error('❌ Error getting transparency data:', error);
      throw error;
    }
  }
  
  // Helper methods
  static calculateReportPriority(reportType, evidence) {
    let priority = 'medium';
    
    // High priority for certain report types
    if (['offensive', 'fake'].includes(reportType)) {
      priority = 'high';
    }
    
    // Urgent if substantial evidence provided
    if (evidence && evidence.length > 2) {
      priority = 'urgent';
    }
    
    return priority;
  }
  
  static calculateAppealPriority(evidence) {
    let priority = 'medium';
    
    // High priority if substantial evidence provided
    if (evidence && evidence.length > 3) {
      priority = 'high';
    }
    
    return priority;
  }
  
  static determineAppealUrgency(evidence, location) {
    // Urgent if location was highly rated or had significant community value
    if (location.totalPoints > 50 || evidence.length > 5) {
      return true;
    }
    return false;
  }
  
  static async updateLocationStatusForReports(locationId, transaction) {
    const reportCount = await LocationReport.count({
      where: {
        locationId,
        status: { [Op.in]: ['pending', 'under_review'] }
      },
      transaction
    });
    
    // Flag location if multiple reports exist
    if (reportCount >= 3) {
      await Location.update(
        { locationStatus: 'flagged' },
        { where: { id: locationId }, transaction }
      );
    }
  }
  
  static async applyReportResolution(locationId, resolution, transaction) {
    const location = await Location.findByPk(locationId, { transaction });
    
    switch (resolution) {
      case 'location_removed':
        await location.update({ locationStatus: 'removed' }, { transaction });
        break;
      case 'location_flagged':
        await location.update({ locationStatus: 'flagged' }, { transaction });
        break;
      case 'user_suspended':
        // Handle user suspension logic
        break;
      default:
        // No action needed
        break;
    }
  }
  
  static async applyAppealDecision(locationId, decision, transaction) {
    const location = await Location.findByPk(locationId, { transaction });
    
    switch (decision) {
      case 'location_restored':
        await location.update({ locationStatus: 'verified' }, { transaction });
        break;
      case 'partial_restoration':
        await location.update({ locationStatus: 'pending' }, { transaction });
        break;
      default:
        // Location remains removed
        break;
    }
  }
  
  static async awardCompensation(userId, amount, transaction) {
    const user = await User.findByPk(userId, { transaction });
    if (user) {
      await user.update({
        credits: user.credits + amount
      }, { transaction });
    }
  }
  
  static processReportStats(stats) {
    const processed = {};
    stats.forEach(stat => {
      const key = `${stat.status}_${stat.reportType}`;
      processed[key] = parseInt(stat.count);
    });
    return processed;
  }
  
  static processAppealStats(stats) {
    const processed = {};
    stats.forEach(stat => {
      const key = `${stat.status}_${stat.decision}`;
      processed[key] = parseInt(stat.count);
    });
    return processed;
  }
  
  static async calculateAverageResolutionTime(startDate) {
    const resolvedReports = await LocationReport.findAll({
      where: {
        status: 'resolved',
        resolvedAt: { [Op.gte]: startDate }
      },
      attributes: [
        [fn('AVG', fn('EXTRACT', 'EPOCH', fn('AGE', col('resolvedAt'), col('createdAt')))), 'avgSeconds']
      ],
      raw: true
    });
    
    return resolvedReports[0]?.avgSeconds || 0;
  }
}

module.exports = ReportAppealService; 