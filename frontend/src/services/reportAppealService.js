import api from './api';

const reportAppealService = {
  // Existing methods
  submitReport: async (reportData) => {
    try {
      const response = await api.post('/reports/submit', reportData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to submit report');
    }
  },

  submitAppeal: async (appealData) => {
    try {
      const response = await api.post('/appeals/submit', appealData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to submit appeal');
    }
  },

  getTransparencyData: async () => {
    try {
      const response = await api.get('/transparency/dashboard');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to load transparency data');
    }
  },

  // New methods for Moderator Dashboard
  getReportsForReview: async (filters = {}) => {
    try {
      const response = await api.get('/reports/for-review', { params: filters });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to load reports for review');
    }
  },

  resolveReport: async (reportId, resolution) => {
    try {
      const response = await api.post(`/reports/${reportId}/resolve`, resolution);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to resolve report');
    }
  },

  getReportDetails: async (reportId) => {
    try {
      const response = await api.get(`/reports/${reportId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to load report details');
    }
  },

  // New methods for Admin Panel
  getAdminStats: async () => {
    try {
      const response = await api.get('/reports/admin/stats');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to load admin statistics');
    }
  },

  getModerators: async () => {
    try {
      const response = await api.get('/reports/admin/moderators');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to load moderators');
    }
  },

  addModerator: async (userId) => {
    try {
      const response = await api.post('/reports/admin/moderators', { userId });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to add moderator');
    }
  },

  removeModerator: async (userId) => {
    try {
      const response = await api.delete(`/reports/admin/moderators/${userId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to remove moderator');
    }
  },

  updateSystemSetting: async (setting, value) => {
    try {
      const response = await api.put('/reports/admin/settings', { setting, value });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update system setting');
    }
  },

  getSystemSettings: async () => {
    try {
      const response = await api.get('/reports/admin/settings');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to load system settings');
    }
  },

  // Appeal methods
  getAppealsForReview: async (filters = {}) => {
    try {
      const response = await api.get('/appeals/for-review', { params: filters });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to load appeals for review');
    }
  },

  resolveAppeal: async (appealId, resolution) => {
    try {
      const response = await api.post(`/appeals/${appealId}/resolve`, resolution);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to resolve appeal');
    }
  },

  // User report history
  getUserReportHistory: async (userId) => {
    try {
      const response = await api.get(`/users/${userId}/reports`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to load user report history');
    }
  },

  // Bulk operations
  bulkResolveReports: async (reportIds, resolution) => {
    try {
      const response = await api.post('/reports/bulk-resolve', { reportIds, resolution });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to bulk resolve reports');
    }
  },

  // Analytics
  getModerationAnalytics: async (timeRange = '30d') => {
    try {
      const response = await api.get('/reports/admin/analytics', { params: { timeRange } });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to load moderation analytics');
    }
  },

  // Export functionality
  exportReports: async (filters = {}) => {
    try {
      const response = await api.get('/reports/export', { 
        params: filters,
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to export reports');
    }
  },

  // Notification methods
  sendNotification: async (userId, notification) => {
    try {
      const response = await api.post('/notifications/send', { userId, notification });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to send notification');
    }
  },

  // Check if user has already reported a location
  checkUserReport: async (locationId) => {
    try {
      const response = await api.get(`/reports/check/${locationId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to check user report');
    }
  }
};

export default reportAppealService; 