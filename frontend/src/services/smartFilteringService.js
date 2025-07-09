import api from './api';

/**
 * Smart Filtering Service for Frontend
 * Handles all smart filtering operations including analysis, review queue, and transparency
 */
class SmartFilteringService {
  constructor() {
    this.baseUrl = '/smart-filtering';
  }

  /**
   * Analyze location for smart filtering
   * @param {Object} locationData - Location data to analyze
   * @param {Object} userData - User data for context
   * @returns {Promise<Object>} Filtering analysis results
   */
  async analyzeLocation(locationData, userData = {}) {
    try {
      console.log('🛡️ Frontend: Starting smart filtering analysis');
      console.log('🛡️ Frontend: locationData:', locationData);
      console.log('🛡️ Frontend: userData:', userData);
      console.log('🛡️ Frontend: userData.userId:', userData?.userId);
      
      console.log('🛡️ Frontend: Making API call to:', `${this.baseUrl}/analyze`);
      console.log('🛡️ Frontend: Request payload:', { locationData, userData });
      
      const response = await api.post(`${this.baseUrl}/analyze`, {
        locationData,
        userData
      });
      
      console.log('🛡️ Frontend: API call successful');
      console.log('🛡️ Frontend: Response data:', response);
      console.log('🛡️ Frontend: Response data type:', typeof response);
      console.log('🛡️ Frontend: Response data keys:', Object.keys(response));
      
      // Handle both possible response formats
      if (response.analysis) {
        console.log('🛡️ Frontend: Using response.analysis');
        return response.analysis;
      } else if (response.overallRisk !== undefined) {
        console.log('🛡️ Frontend: Using response directly');
        return response;
      } else {
        console.error('❌ Frontend: Unexpected response format:', response);
        throw new Error('Unexpected response format from backend');
      }
    } catch (error) {
      console.error('❌ Frontend: Smart filtering analysis failed:', error);
      throw new Error('Smart filtering analysis failed: ' + (error.response?.data?.message || error.message));
    }
  }

  /**
   * Add location to review queue
   * @param {Object} locationData - Location data
   * @param {Object} analysis - Filtering analysis
   * @param {string} moderatorId - Moderator ID
   * @returns {Promise<Object>} Review queue entry
   */
  async addToReviewQueue(locationData, analysis, moderatorId = null) {
    try {
      console.log('📋 Frontend: Adding location to review queue');
      
      const response = await api.post(`${this.baseUrl}/add-to-queue`, {
        locationData,
        analysis,
        moderatorId
      });

      console.log('✅ Frontend: Location added to review queue');
      return response.data;
    } catch (error) {
      console.error('❌ Frontend: Failed to add to review queue:', error);
      throw new Error('Failed to add to review queue: ' + (error.response?.data?.message || error.message));
    }
  }

  /**
   * Get review queue statistics
   * @returns {Promise<Object>} Queue statistics
   */
  async getReviewQueueStats() {
    try {
      console.log('📊 Frontend: Getting review queue statistics');
      
      const response = await api.get(`${this.baseUrl}/queue-stats`);
      
      console.log('✅ Frontend: Review queue statistics retrieved');
      return response.data;
    } catch (error) {
      console.error('❌ Frontend: Failed to get review queue stats:', error);
      throw new Error('Failed to get review queue statistics: ' + (error.response?.data?.message || error.message));
    }
  }

  /**
   * Get review queue items
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Review queue items
   */
  async getReviewQueueItems(filters = {}) {
    try {
      console.log('📋 Frontend: Getting review queue items');
      
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.category) params.append('category', filters.category);
      if (filters.priority) params.append('priority', filters.priority);
      if (filters.limit) params.append('limit', filters.limit);
      if (filters.offset) params.append('offset', filters.offset);
      
      const response = await api.get(`${this.baseUrl}/queue-items?${params.toString()}`);
      
      console.log('✅ Frontend: Review queue items retrieved');
      return response.data;
    } catch (error) {
      console.error('❌ Frontend: Failed to get review queue items:', error);
      throw new Error('Failed to get review queue items: ' + (error.response?.data?.message || error.message));
    }
  }

  /**
   * Process review decision
   * @param {string} reviewId - Review ID
   * @param {string} decision - Decision (approve/reject/escalate)
   * @param {string} reason - Decision reason
   * @returns {Promise<Object>} Processing result
   */
  async processReviewDecision(reviewId, decision, reason = '') {
    try {
      console.log(`📋 Frontend: Processing review decision: ${decision}`);
      
      const response = await api.post(`${this.baseUrl}/process-review`, {
        reviewId,
        decision,
        reason
      });

      console.log('✅ Frontend: Review decision processed');
      return response.data;
    } catch (error) {
      console.error('❌ Frontend: Failed to process review decision:', error);
      throw new Error('Failed to process review decision: ' + (error.response?.data?.message || error.message));
    }
  }

  /**
   * Perform bulk moderation actions
   * @param {Array} reviewIds - Array of review IDs
   * @param {string} action - Action to perform
   * @returns {Promise<Object>} Bulk action result
   */
  async bulkModerationAction(reviewIds, action) {
    try {
      console.log(`📋 Frontend: Processing bulk moderation: ${action} for ${reviewIds.length} items`);
      
      const response = await api.post(`${this.baseUrl}/bulk-moderation`, {
        reviewIds,
        action
      });

      console.log('✅ Frontend: Bulk moderation completed');
      return response.data;
    } catch (error) {
      console.error('❌ Frontend: Failed to process bulk moderation:', error);
      throw new Error('Failed to process bulk moderation: ' + (error.response?.data?.message || error.message));
    }
  }

  /**
   * Get transparency report
   * @param {string} timeRange - Time range for report
   * @returns {Promise<Object>} Transparency report
   */
  async getTransparencyReport(timeRange = '30d') {
    try {
      console.log('📊 Frontend: Generating transparency report');
      
      const response = await api.get(`${this.baseUrl}/transparency-report?timeRange=${timeRange}`);
      
      console.log('✅ Frontend: Transparency report generated');
      return response.data;
    } catch (error) {
      console.error('❌ Frontend: Failed to generate transparency report:', error);
      throw new Error('Failed to generate transparency report: ' + (error.response?.data?.message || error.message));
    }
  }

  /**
   * Get current filtering thresholds
   * @returns {Promise<Object>} Current threshold values
   */
  async getThresholds() {
    try {
      console.log('⚙️ Frontend: Getting smart filtering thresholds');
      
      const response = await api.get(`${this.baseUrl}/thresholds`);
      
      console.log('✅ Frontend: Smart filtering thresholds retrieved');
      return response.data;
    } catch (error) {
      console.error('❌ Frontend: Failed to get thresholds:', error);
      throw new Error('Failed to get smart filtering thresholds: ' + (error.response?.data?.message || error.message));
    }
  }

  /**
   * Update filtering thresholds
   * @param {Object} thresholds - New threshold values
   * @returns {Promise<Object>} Updated thresholds
   */
  async updateThresholds(thresholds) {
    try {
      console.log('⚙️ Frontend: Updating smart filtering thresholds');
      
      const response = await api.post(`${this.baseUrl}/update-thresholds`, {
        thresholds
      });

      console.log('✅ Frontend: Smart filtering thresholds updated');
      return response.data;
    } catch (error) {
      console.error('❌ Frontend: Failed to update thresholds:', error);
      throw new Error('Failed to update smart filtering thresholds: ' + (error.response?.data?.message || error.message));
    }
  }

  /**
   * Get filtering categories
   * @returns {Promise<Object>} Filtering categories
   */
  async getFilteringCategories() {
    try {
      console.log('📋 Frontend: Getting filtering categories');
      
      const response = await api.get(`${this.baseUrl}/filtering-categories`);
      
      console.log('✅ Frontend: Filtering categories retrieved');
      return response.data;
    } catch (error) {
      console.error('❌ Frontend: Failed to get filtering categories:', error);
      throw new Error('Failed to get filtering categories: ' + (error.response?.data?.message || error.message));
    }
  }

  /**
   * Get review statuses
   * @returns {Promise<Object>} Review statuses
   */
  async getReviewStatuses() {
    try {
      console.log('📋 Frontend: Getting review statuses');
      
      const response = await api.get(`${this.baseUrl}/review-statuses`);
      
      console.log('✅ Frontend: Review statuses retrieved');
      return response.data;
    } catch (error) {
      console.error('❌ Frontend: Failed to get review statuses:', error);
      throw new Error('Failed to get review statuses: ' + (error.response?.data?.message || error.message));
    }
  }

  /**
   * Automatically filter location based on analysis
   * @param {Object} locationData - Location data
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Automatic filtering result
   */
  async autoFilter(locationData, userData = {}) {
    try {
      console.log('🤖 Frontend: Running automatic filtering');
      
      const response = await api.post(`${this.baseUrl}/auto-filter`, {
        locationData,
        userData
      });

      console.log('✅ Frontend: Automatic filtering completed');
      return response.data;
    } catch (error) {
      console.error('❌ Frontend: Automatic filtering failed:', error);
      throw new Error('Automatic filtering failed: ' + (error.response?.data?.message || error.message));
    }
  }

  /**
   * Get smart filtering system health
   * @returns {Promise<Object>} System health information
   */
  async getSystemHealth() {
    try {
      console.log('🏥 Frontend: Getting smart filtering system health');
      
      const response = await api.get(`${this.baseUrl}/system-health`);
      
      console.log('✅ Frontend: System health retrieved');
      return response.data;
    } catch (error) {
      console.error('❌ Frontend: Failed to get system health:', error);
      throw new Error('Failed to get system health: ' + (error.response?.data?.message || error.message));
    }
  }

  /**
   * Real-time filtering feedback for location creation
   * @param {Object} locationData - Location data being created
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Real-time feedback
   */
  async getRealTimeFeedback(locationData, userData = {}) {
    try {
      console.log('🔄 Frontend: Getting real-time filtering feedback');
      
      const analysis = await this.analyzeLocation(locationData, userData);
      
      const feedback = {
        isBlocked: analysis.autoBlocked,
        requiresReview: analysis.reviewRequired,
        riskScore: analysis.overallRisk,
        flags: analysis.flags,
        recommendations: analysis.recommendations,
        action: analysis.filteringDecision,
        message: this.generateFeedbackMessage(analysis)
      };

      console.log('✅ Frontend: Real-time feedback generated');
      return feedback;
    } catch (error) {
      console.error('❌ Frontend: Failed to get real-time feedback:', error);
      throw error;
    }
  }

  /**
   * Generate user-friendly feedback message
   * @param {Object} analysis - Analysis results
   * @returns {string} User-friendly message
   */
  generateFeedbackMessage(analysis) {
    if (analysis.autoBlocked) {
      return 'This location has been automatically blocked due to filtering criteria. Please review and modify your submission.';
    } else if (analysis.reviewRequired) {
      return 'This location requires manual review before being published. It will be reviewed by our moderation team.';
    } else if (analysis.overallRisk > 50) {
      return 'This location has been flagged for monitoring. Please ensure your content meets our community guidelines.';
    } else {
      return 'This location passed our filtering checks and will be published immediately.';
    }
  }

  /**
   * Get filtering statistics for dashboard
   * @returns {Promise<Object>} Filtering statistics
   */
  async getFilteringStats() {
    try {
      console.log('📊 Frontend: Getting filtering statistics');
      
      const [queueStats, transparencyReport, systemHealth] = await Promise.all([
        this.getReviewQueueStats(),
        this.getTransparencyReport('7d'),
        this.getSystemHealth()
      ]);

      const stats = {
        queueStats: queueStats?.stats || {
          totalItems: 0,
          pendingReview: 0,
          approvedToday: 0,
          rejectedToday: 0,
          averageReviewTime: 0
        },
        transparencyReport: transparencyReport?.report || {
          totalFiltered: 0,
          autoBlocked: 0,
          manualReview: 0,
          falsePositives: 0,
          accuracy: 0
        },
        systemHealth: systemHealth?.health || {
          status: 'unknown',
          lastCheck: new Date(),
          uptime: 0,
          performance: 0
        },
        lastUpdated: new Date()
      };

      console.log('✅ Frontend: Filtering statistics retrieved');
      return stats;
    } catch (error) {
      console.error('❌ Frontend: Failed to get filtering statistics:', error);
      // Return default stats instead of throwing error
      return {
        queueStats: {
          totalItems: 0,
          pendingReview: 0,
          approvedToday: 0,
          rejectedToday: 0,
          averageReviewTime: 0
        },
        transparencyReport: {
          totalFiltered: 0,
          autoBlocked: 0,
          manualReview: 0,
          falsePositives: 0,
          accuracy: 0
        },
        systemHealth: {
          status: 'unknown',
          lastCheck: new Date(),
          uptime: 0,
          performance: 0
        },
        lastUpdated: new Date()
      };
    }
  }
}

export default new SmartFilteringService(); 