const { Op } = require('sequelize');
const sequelize = require('../config/database');
const models = require('../models');
const Location = models.Location;
const User = models.User;
const duplicateDetectionService = require('./duplicateDetectionService');
const behavioralAnalysisService = require('./behavioralAnalysisService');
const contentQualityService = require('./contentQualityService');

/**
 * Smart Filtering and Moderation Service
 * Combines automated filtering with manual review capabilities
 */
class SmartFilteringService {
  constructor() {
    // Filtering thresholds
    this.thresholds = {
      // Automated blocking thresholds
      autoBlock: {
        duplicateRisk: 80,      // High-risk duplicates
        behavioralRisk: 75,     // Suspicious behavior
        contentQuality: 20,     // Very poor content
        spamScore: 80          // High spam detection
      },
      
      // Manual review thresholds
      manualReview: {
        duplicateRisk: 50,      // Medium-risk duplicates
        behavioralRisk: 60,     // Concerning behavior
        contentQuality: 40,     // Poor content
        spamScore: 50          // Moderate spam
      },
      
      // Flagging thresholds
      flagging: {
        duplicateRisk: 30,      // Low-risk duplicates
        behavioralRisk: 40,     // Minor concerns
        contentQuality: 60,     // Below average
        spamScore: 30          // Some spam indicators
      }
    };

    // Review queue statuses
    this.reviewStatuses = {
      PENDING: 'pending',
      APPROVED: 'approved',
      REJECTED: 'rejected',
      ESCALATED: 'escalated'
    };

    // Filtering categories
    this.filteringCategories = {
      DUPLICATE: 'duplicate',
      BEHAVIORAL: 'behavioral',
      CONTENT_QUALITY: 'content_quality',
      SPAM: 'spam',
      MANUAL: 'manual'
    };
  }

  /**
   * Comprehensive filtering analysis for a location
   * @param {Object} locationData - Location data to analyze
   * @param {Object} userData - User data for context
   * @returns {Object} Filtering analysis results
   */
  async analyzeForFiltering(locationData, userData = {}) {
    try {
      console.log('🛡️ Starting comprehensive filtering analysis');

      const analysis = {
        overallRisk: 0,
        filteringDecision: 'allow',
        reviewRequired: false,
        autoBlocked: false,
        flags: [],
        categories: {},
        recommendations: [],
        transparency: {
          analysisTimestamp: new Date(),
          analysisVersion: '1.0',
          systemsUsed: []
        }
      };

      // 1. Duplicate Detection Analysis
      console.log('🔍 Running duplicate detection analysis');
      const duplicateAnalysis = await duplicateDetectionService.detectDuplicates(locationData, userData.userId);
      analysis.categories.duplicate = {
        riskScore: duplicateAnalysis.totalRiskScore,
        status: duplicateAnalysis.duplicateStatus,
        details: duplicateAnalysis
      };
      analysis.transparency.systemsUsed.push('duplicate_detection');

      // 2. Behavioral Analysis
      console.log('🧠 Running behavioral analysis');
      const behavioralAnalysis = await behavioralAnalysisService.analyzeUserBehavior(userData.userId, locationData);
      analysis.categories.behavioral = {
        riskScore: behavioralAnalysis.riskScore,
        riskLevel: behavioralAnalysis.riskLevel,
        isSuspicious: behavioralAnalysis.isSuspicious,
        details: behavioralAnalysis
      };
      analysis.transparency.systemsUsed.push('behavioral_analysis');

      // 3. Content Quality Analysis
      console.log('📝 Running content quality analysis');
      const contentAnalysis = await contentQualityService.analyzeContentQuality(locationData, userData);
      analysis.categories.contentQuality = {
        riskScore: 100 - contentAnalysis.overallScore, // Invert for risk
        qualityScore: contentAnalysis.overallScore,
        spamScore: contentAnalysis.spamScore,
        riskLevel: contentAnalysis.riskLevel,
        details: contentAnalysis
      };
      analysis.transparency.systemsUsed.push('content_quality_analysis');

      // 4. Calculate overall risk score
      analysis.overallRisk = this.calculateOverallRisk(analysis.categories);

      // 5. Determine filtering decision
      const filteringResult = this.determineFilteringDecision(analysis);
      analysis.filteringDecision = filteringResult.decision;
      analysis.reviewRequired = filteringResult.reviewRequired;
      analysis.autoBlocked = filteringResult.autoBlocked;
      analysis.flags = filteringResult.flags;
      analysis.recommendations = filteringResult.recommendations;

      console.log(`✅ Filtering analysis completed. Decision: ${analysis.filteringDecision}, Risk: ${analysis.overallRisk}`);
      return analysis;

    } catch (error) {
      console.error('❌ Error in filtering analysis:', error);
      throw new Error('Filtering analysis failed: ' + error.message);
    }
  }

  /**
   * Calculate overall risk score from all categories
   * @param {Object} categories - Analysis categories
   * @returns {number} Overall risk score (0-100)
   */
  calculateOverallRisk(categories) {
    const weights = {
      duplicate: 0.3,      // 30% weight
      behavioral: 0.3,     // 30% weight
      contentQuality: 0.4  // 40% weight
    };

    let totalRisk = 0;
    let totalWeight = 0;

    if (categories.duplicate) {
      totalRisk += categories.duplicate.riskScore * weights.duplicate;
      totalWeight += weights.duplicate;
    }

    if (categories.behavioral) {
      totalRisk += categories.behavioral.riskScore * weights.behavioral;
      totalWeight += weights.behavioral;
    }

    if (categories.contentQuality) {
      totalRisk += categories.contentQuality.riskScore * weights.contentQuality;
      totalWeight += weights.contentQuality;
    }

    return totalWeight > 0 ? Math.round(totalRisk / totalWeight) : 0;
  }

  /**
   * Determine filtering decision based on analysis
   * @param {Object} analysis - Analysis results
   * @returns {Object} Filtering decision
   */
  determineFilteringDecision(analysis) {
    const result = {
      decision: 'allow',
      reviewRequired: false,
      autoBlocked: false,
      flags: [],
      recommendations: []
    };

    const categories = analysis.categories;

    // Check for automatic blocking conditions
    if (categories.duplicate && categories.duplicate.riskScore >= this.thresholds.autoBlock.duplicateRisk) {
      result.decision = 'block';
      result.autoBlocked = true;
      result.flags.push('HIGH_RISK_DUPLICATE');
      result.recommendations.push('Location blocked due to high duplicate risk');
    } else if (categories.behavioral && categories.behavioral.riskScore >= this.thresholds.autoBlock.behavioralRisk) {
      result.decision = 'block';
      result.autoBlocked = true;
      result.flags.push('SUSPICIOUS_BEHAVIOR');
      result.recommendations.push('Location blocked due to suspicious user behavior');
    } else if (categories.contentQuality && categories.contentQuality.riskScore >= this.thresholds.autoBlock.contentQuality) {
      result.decision = 'block';
      result.autoBlocked = true;
      result.flags.push('POOR_CONTENT_QUALITY');
      result.recommendations.push('Location blocked due to poor content quality');
    } else if (categories.contentQuality && categories.contentQuality.spamScore >= this.thresholds.autoBlock.spamScore) {
      result.decision = 'block';
      result.autoBlocked = true;
      result.flags.push('HIGH_SPAM_SCORE');
      result.recommendations.push('Location blocked due to high spam detection');
    }

    // Check for manual review requirements
    if (!result.autoBlocked) {
      if (categories.duplicate && categories.duplicate.riskScore >= this.thresholds.manualReview.duplicateRisk) {
        result.reviewRequired = true;
        result.flags.push('MEDIUM_RISK_DUPLICATE');
        result.recommendations.push('Manual review recommended for duplicate risk');
      } else if (categories.behavioral && categories.behavioral.riskScore >= this.thresholds.manualReview.behavioralRisk) {
        result.reviewRequired = true;
        result.flags.push('CONCERNING_BEHAVIOR');
        result.recommendations.push('Manual review recommended for user behavior');
      } else if (categories.contentQuality && categories.contentQuality.riskScore >= this.thresholds.manualReview.contentQuality) {
        result.reviewRequired = true;
        result.flags.push('POOR_CONTENT');
        result.recommendations.push('Manual review recommended for content quality');
      } else if (categories.contentQuality && categories.contentQuality.spamScore >= this.thresholds.manualReview.spamScore) {
        result.reviewRequired = true;
        result.flags.push('MODERATE_SPAM');
        result.recommendations.push('Manual review recommended for spam indicators');
      }
    }

    // Add general flags for monitoring
    if (categories.duplicate && categories.duplicate.riskScore >= this.thresholds.flagging.duplicateRisk) {
      result.flags.push('LOW_RISK_DUPLICATE');
    }
    if (categories.behavioral && categories.behavioral.riskScore >= this.thresholds.flagging.behavioralRisk) {
      result.flags.push('MINOR_BEHAVIOR_CONCERNS');
    }
    if (categories.contentQuality && categories.contentQuality.riskScore >= this.thresholds.flagging.contentQuality) {
      result.flags.push('BELOW_AVERAGE_CONTENT');
    }
    if (categories.contentQuality && categories.contentQuality.spamScore >= this.thresholds.flagging.spamScore) {
      result.flags.push('SPAM_INDICATORS');
    }

    return result;
  }

  /**
   * Add location to review queue
   * @param {Object} locationData - Location data
   * @param {Object} analysis - Filtering analysis
   * @param {string} moderatorId - Moderator ID
   * @returns {Object} Review queue entry
   */
  async addToReviewQueue(locationData, analysis, moderatorId = null) {
    try {
      console.log('📋 Adding location to review queue');

      const reviewEntry = {
        locationId: locationData.id,
        creatorId: locationData.creatorId,
        status: this.reviewStatuses.PENDING,
        analysis: analysis,
        flags: analysis.flags,
        riskScore: analysis.overallRisk,
        createdAt: new Date(),
        assignedModeratorId: moderatorId,
        priority: this.calculateReviewPriority(analysis),
        category: this.determineReviewCategory(analysis)
      };

      // Store in database (you can create a ReviewQueue model)
      // For now, we'll return the entry structure
      console.log('✅ Location added to review queue');
      return reviewEntry;

    } catch (error) {
      console.error('❌ Error adding to review queue:', error);
      throw new Error('Failed to add to review queue');
    }
  }

  /**
   * Calculate review priority based on analysis
   * @param {Object} analysis - Analysis results
   * @returns {string} Priority level
   */
  calculateReviewPriority(analysis) {
    if (analysis.overallRisk >= 80) return 'high';
    if (analysis.overallRisk >= 60) return 'medium';
    return 'low';
  }

  /**
   * Determine review category based on analysis
   * @param {Object} analysis - Analysis results
   * @returns {string} Review category
   */
  determineReviewCategory(analysis) {
    const categories = analysis.categories;
    
    if (categories.duplicate && categories.duplicate.riskScore >= 50) {
      return this.filteringCategories.DUPLICATE;
    } else if (categories.behavioral && categories.behavioral.riskScore >= 60) {
      return this.filteringCategories.BEHAVIORAL;
    } else if (categories.contentQuality && categories.contentQuality.spamScore >= 50) {
      return this.filteringCategories.SPAM;
    } else if (categories.contentQuality && categories.contentQuality.riskScore >= 50) {
      return this.filteringCategories.CONTENT_QUALITY;
    }
    
    return this.filteringCategories.MANUAL;
  }

  /**
   * Get review queue statistics
   * @returns {Object} Queue statistics
   */
  async getReviewQueueStats() {
    try {
      // This would query the review queue database
      // For now, return mock statistics
      const stats = {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        escalated: 0,
        byCategory: {
          duplicate: 0,
          behavioral: 0,
          content_quality: 0,
          spam: 0,
          manual: 0
        },
        byPriority: {
          high: 0,
          medium: 0,
          low: 0
        },
        averageWaitTime: 0,
        oldestPending: null
      };

      return stats;

    } catch (error) {
      console.error('❌ Error getting review queue stats:', error);
      throw new Error('Failed to get review queue statistics');
    }
  }

  /**
   * Get review queue items
   * @param {Object} filters - Filter options
   * @returns {Array} Review queue items
   */
  async getReviewQueueItems(filters = {}) {
    try {
      const {
        status = 'pending',
        category = null,
        priority = null,
        limit = 50,
        offset = 0
      } = filters;

      // This would query the review queue database
      // For now, return mock data
      const items = [];

      return items;

    } catch (error) {
      console.error('❌ Error getting review queue items:', error);
      throw new Error('Failed to get review queue items');
    }
  }

  /**
   * Process review decision
   * @param {string} reviewId - Review ID
   * @param {string} decision - Decision (approve/reject/escalate)
   * @param {string} moderatorId - Moderator ID
   * @param {string} reason - Decision reason
   * @returns {Object} Processing result
   */
  async processReviewDecision(reviewId, decision, moderatorId, reason = '') {
    try {
      console.log(`📋 Processing review decision: ${decision}`);

      const result = {
        reviewId,
        decision,
        moderatorId,
        reason,
        processedAt: new Date(),
        success: true
      };

      // Update review status
      if (decision === 'approve') {
        result.newStatus = this.reviewStatuses.APPROVED;
        // Approve the location
      } else if (decision === 'reject') {
        result.newStatus = this.reviewStatuses.REJECTED;
        // Reject the location
      } else if (decision === 'escalate') {
        result.newStatus = this.reviewStatuses.ESCALATED;
        // Escalate to higher authority
      }

      console.log('✅ Review decision processed successfully');
      return result;

    } catch (error) {
      console.error('❌ Error processing review decision:', error);
      throw new Error('Failed to process review decision');
    }
  }

  /**
   * Bulk moderation actions
   * @param {Array} reviewIds - Array of review IDs
   * @param {string} action - Action to perform
   * @param {string} moderatorId - Moderator ID
   * @returns {Object} Bulk action result
   */
  async bulkModerationAction(reviewIds, action, moderatorId) {
    try {
      console.log(`📋 Processing bulk moderation: ${action} for ${reviewIds.length} items`);

      const results = [];
      let successCount = 0;
      let failureCount = 0;

      for (const reviewId of reviewIds) {
        try {
          const result = await this.processReviewDecision(reviewId, action, moderatorId);
          results.push(result);
          successCount++;
        } catch (error) {
          results.push({
            reviewId,
            success: false,
            error: error.message
          });
          failureCount++;
        }
      }

      const bulkResult = {
        totalProcessed: reviewIds.length,
        successCount,
        failureCount,
        action,
        moderatorId,
        processedAt: new Date(),
        results
      };

      console.log(`✅ Bulk moderation completed: ${successCount} successful, ${failureCount} failed`);
      return bulkResult;

    } catch (error) {
      console.error('❌ Error in bulk moderation:', error);
      throw new Error('Failed to process bulk moderation');
    }
  }

  /**
   * Get transparency report
   * @param {string} timeRange - Time range for report
   * @returns {Object} Transparency report
   */
  async getTransparencyReport(timeRange = '30d') {
    try {
      console.log('📊 Generating transparency report');

      const timeRanges = {
        '1d': 1,
        '7d': 7,
        '30d': 30,
        '90d': 90
      };

      const days = timeRanges[timeRange] || 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // This would query the database for actual data
      const report = {
        timeRange,
        generatedAt: new Date(),
        summary: {
          totalLocations: 0,
          autoBlocked: 0,
          manualReview: 0,
          approved: 0,
          rejected: 0,
          averageProcessingTime: 0
        },
        breakdown: {
          byCategory: {
            duplicate: { total: 0, blocked: 0, reviewed: 0 },
            behavioral: { total: 0, blocked: 0, reviewed: 0 },
            content_quality: { total: 0, blocked: 0, reviewed: 0 },
            spam: { total: 0, blocked: 0, reviewed: 0 }
          },
          byRiskLevel: {
            low: { total: 0, blocked: 0, reviewed: 0 },
            medium: { total: 0, blocked: 0, reviewed: 0 },
            high: { total: 0, blocked: 0, reviewed: 0 }
          }
        },
        moderatorActivity: {
          totalDecisions: 0,
          averageResponseTime: 0,
          mostActiveModerators: []
        },
        systemPerformance: {
          averageAnalysisTime: 0,
          falsePositiveRate: 0,
          falseNegativeRate: 0,
          systemUptime: 0
        }
      };

      console.log('✅ Transparency report generated');
      return report;

    } catch (error) {
      console.error('❌ Error generating transparency report:', error);
      throw new Error('Failed to generate transparency report');
    }
  }

  /**
   * Update filtering thresholds
   * @param {Object} newThresholds - New threshold values
   */
  updateThresholds(newThresholds) {
    if (newThresholds.autoBlock) {
      Object.assign(this.thresholds.autoBlock, newThresholds.autoBlock);
    }
    if (newThresholds.manualReview) {
      Object.assign(this.thresholds.manualReview, newThresholds.manualReview);
    }
    if (newThresholds.flagging) {
      Object.assign(this.thresholds.flagging, newThresholds.flagging);
    }

    console.log('⚙️ Smart filtering thresholds updated');
  }

  /**
   * Get current thresholds
   * @returns {Object} Current threshold values
   */
  getThresholds() {
    return this.thresholds;
  }
}

module.exports = new SmartFilteringService(); 