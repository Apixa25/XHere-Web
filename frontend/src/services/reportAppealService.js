import api from './api';

class ReportAppealService {
  constructor() {
    this.baseUrl = '/api';
  }

  /**
   * 📝 Submit a location report
   * @param {Object} reportData - Report data
   * @returns {Promise<Object>} Report submission result
   */
  async submitReport(reportData) {
    try {
      console.log('📝 Frontend: Submitting location report');
      
      const response = await api.post('/reports/submit', reportData);
      
      console.log('✅ Frontend: Report submitted successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Frontend: Error submitting report:', error);
      throw new Error('Failed to submit report: ' + (error.response?.data?.message || error.message));
    }
  }

  /**
   * ⚖️ Submit an appeal for a removed location
   * @param {Object} appealData - Appeal data
   * @returns {Promise<Object>} Appeal submission result
   */
  async submitAppeal(appealData) {
    try {
      console.log('⚖️ Frontend: Submitting location appeal');
      
      const response = await api.post('/appeals/submit', appealData);
      
      console.log('✅ Frontend: Appeal submitted successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Frontend: Error submitting appeal:', error);
      throw new Error('Failed to submit appeal: ' + (error.response?.data?.message || error.message));
    }
  }

  /**
   * 📊 Get user's submitted reports
   * @param {Object} options - Query options
   * @returns {Promise<Object>} User reports
   */
  async getMyReports(options = {}) {
    try {
      console.log('📊 Frontend: Getting user reports');
      
      const params = new URLSearchParams();
      if (options.limit) params.append('limit', options.limit);
      if (options.offset) params.append('offset', options.offset);
      
      const response = await api.get(`/reports/my-reports?${params}`);
      
      console.log('✅ Frontend: User reports retrieved');
      return response.data;
    } catch (error) {
      console.error('❌ Frontend: Error getting user reports:', error);
      throw new Error('Failed to get user reports: ' + (error.response?.data?.message || error.message));
    }
  }

  /**
   * ⚖️ Get user's submitted appeals
   * @param {Object} options - Query options
   * @returns {Promise<Object>} User appeals
   */
  async getMyAppeals(options = {}) {
    try {
      console.log('⚖️ Frontend: Getting user appeals');
      
      const params = new URLSearchParams();
      if (options.limit) params.append('limit', options.limit);
      if (options.offset) params.append('offset', options.offset);
      
      const response = await api.get(`/appeals/my-appeals?${params}`);
      
      console.log('✅ Frontend: User appeals retrieved');
      return response.data;
    } catch (error) {
      console.error('❌ Frontend: Error getting user appeals:', error);
      throw new Error('Failed to get user appeals: ' + (error.response?.data?.message || error.message));
    }
  }

  /**
   * 🔍 Get reports for moderation review
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Reports for review
   */
  async getReportsForReview(options = {}) {
    try {
      console.log('🔍 Frontend: Getting reports for review');
      
      const params = new URLSearchParams();
      if (options.limit) params.append('limit', options.limit);
      if (options.offset) params.append('offset', options.offset);
      if (options.status) params.append('status', options.status);
      if (options.priority) params.append('priority', options.priority);
      if (options.reportType) params.append('reportType', options.reportType);
      
      const response = await api.get(`/reports/for-review?${params}`);
      
      console.log('✅ Frontend: Reports for review retrieved');
      return response.data;
    } catch (error) {
      console.error('❌ Frontend: Error getting reports for review:', error);
      throw new Error('Failed to get reports for review: ' + (error.response?.data?.message || error.message));
    }
  }

  /**
   * ⚖️ Get appeals for review
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Appeals for review
   */
  async getAppealsForReview(options = {}) {
    try {
      console.log('⚖️ Frontend: Getting appeals for review');
      
      const params = new URLSearchParams();
      if (options.limit) params.append('limit', options.limit);
      if (options.offset) params.append('offset', options.offset);
      if (options.status) params.append('status', options.status);
      if (options.priority) params.append('priority', options.priority);
      if (options.isUrgent !== undefined) params.append('isUrgent', options.isUrgent);
      
      const response = await api.get(`/appeals/for-review?${params}`);
      
      console.log('✅ Frontend: Appeals for review retrieved');
      return response.data;
    } catch (error) {
      console.error('❌ Frontend: Error getting appeals for review:', error);
      throw new Error('Failed to get appeals for review: ' + (error.response?.data?.message || error.message));
    }
  }

  /**
   * 🔍 Resolve a report
   * @param {string} reportId - Report ID
   * @param {Object} resolutionData - Resolution data
   * @returns {Promise<Object>} Resolution result
   */
  async resolveReport(reportId, resolutionData) {
    try {
      console.log(`🔍 Frontend: Resolving report ${reportId}`);
      
      const response = await api.post(`/reports/${reportId}/resolve`, resolutionData);
      
      console.log('✅ Frontend: Report resolved successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Frontend: Error resolving report:', error);
      throw new Error('Failed to resolve report: ' + (error.response?.data?.message || error.message));
    }
  }

  /**
   * ⚖️ Review an appeal
   * @param {string} appealId - Appeal ID
   * @param {Object} decisionData - Decision data
   * @returns {Promise<Object>} Decision result
   */
  async reviewAppeal(appealId, decisionData) {
    try {
      console.log(`⚖️ Frontend: Reviewing appeal ${appealId}`);
      
      const response = await api.post(`/appeals/${appealId}/review`, decisionData);
      
      console.log('✅ Frontend: Appeal reviewed successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Frontend: Error reviewing appeal:', error);
      throw new Error('Failed to review appeal: ' + (error.response?.data?.message || error.message));
    }
  }

  /**
   * 📊 Get transparency dashboard data
   * @param {string} timeRange - Time range for data
   * @returns {Promise<Object>} Transparency data
   */
  async getTransparencyDashboard(timeRange = '30d') {
    try {
      console.log('📊 Frontend: Getting transparency dashboard data');
      
      const response = await api.get(`/transparency/dashboard?timeRange=${timeRange}`);
      
      console.log('✅ Frontend: Transparency dashboard data retrieved');
      return response.data;
    } catch (error) {
      console.error('❌ Frontend: Error getting transparency dashboard:', error);
      throw new Error('Failed to get transparency dashboard: ' + (error.response?.data?.message || error.message));
    }
  }

  /**
   * 📊 Get public report statistics
   * @param {string} timeRange - Time range for data
   * @returns {Promise<Object>} Report statistics
   */
  async getReportStatistics(timeRange = '30d') {
    try {
      console.log('📊 Frontend: Getting report statistics');
      
      const response = await api.get(`/transparency/reports?timeRange=${timeRange}`);
      
      console.log('✅ Frontend: Report statistics retrieved');
      return response.data;
    } catch (error) {
      console.error('❌ Frontend: Error getting report statistics:', error);
      throw new Error('Failed to get report statistics: ' + (error.response?.data?.message || error.message));
    }
  }

  /**
   * 📊 Get public appeal statistics
   * @param {string} timeRange - Time range for data
   * @returns {Promise<Object>} Appeal statistics
   */
  async getAppealStatistics(timeRange = '30d') {
    try {
      console.log('📊 Frontend: Getting appeal statistics');
      
      const response = await api.get(`/transparency/appeals?timeRange=${timeRange}`);
      
      console.log('✅ Frontend: Appeal statistics retrieved');
      return response.data;
    } catch (error) {
      console.error('❌ Frontend: Error getting appeal statistics:', error);
      throw new Error('Failed to get appeal statistics: ' + (error.response?.data?.message || error.message));
    }
  }

  /**
   * 📊 Get moderator activity statistics
   * @param {string} timeRange - Time range for data
   * @returns {Promise<Object>} Moderator activity
   */
  async getModeratorActivity(timeRange = '30d') {
    try {
      console.log('📊 Frontend: Getting moderator activity');
      
      const response = await api.get(`/transparency/moderator-activity?timeRange=${timeRange}`);
      
      console.log('✅ Frontend: Moderator activity retrieved');
      return response.data;
    } catch (error) {
      console.error('❌ Frontend: Error getting moderator activity:', error);
      throw new Error('Failed to get moderator activity: ' + (error.response?.data?.message || error.message));
    }
  }
}

export default new ReportAppealService(); 