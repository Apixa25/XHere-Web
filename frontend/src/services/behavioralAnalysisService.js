import api from './api';

const behavioralAnalysisService = {
  /**
   * Analyze user behavior patterns
   */
  async analyzeUserBehavior(userId, locationData = null) {
    try {
      const response = await api.post('/behavioral-analysis/analyze', {
        userId,
        locationData
      });
      return response;
    } catch (error) {
      console.error('Error analyzing user behavior:', error);
      throw error;
    }
  },

  /**
   * Get behavioral analysis for a specific user
   */
  async getUserBehavior(userId) {
    try {
      const response = await api.get(`/behavioral-analysis/user/${userId}`);
      return response;
    } catch (error) {
      console.error('Error getting user behavior:', error);
      throw error;
    }
  },

  /**
   * Get behavioral analysis statistics
   */
  async getBehavioralStats(timeRange = '7d') {
    try {
      const response = await api.get(`/behavioral-analysis/stats?timeRange=${timeRange}`);
      return response;
    } catch (error) {
      console.error('Error getting behavioral stats:', error);
      throw error;
    }
  },

  /**
   * Get list of suspicious users
   */
  async getSuspiciousUsers(limit = 20) {
    try {
      const response = await api.get(`/behavioral-analysis/suspicious-users?limit=${limit}`);
      return response;
    } catch (error) {
      console.error('Error getting suspicious users:', error);
      throw error;
    }
  },

  /**
   * Check posting patterns for a user
   */
  async checkPostingPatterns(userId) {
    try {
      const response = await api.post('/behavioral-analysis/check-posting-patterns', {
        userId
      });
      return response;
    } catch (error) {
      console.error('Error checking posting patterns:', error);
      throw error;
    }
  },

  /**
   * Detect suspicious activity for a user
   */
  async detectSuspiciousActivity(userId, locationData = null) {
    try {
      const response = await api.post('/behavioral-analysis/detect-suspicious-activity', {
        userId,
        locationData
      });
      return response;
    } catch (error) {
      console.error('Error detecting suspicious activity:', error);
      throw error;
    }
  },

  /**
   * Calculate behavior score for a user
   */
  async calculateBehaviorScore(userId, analysis = null) {
    try {
      const response = await api.post('/behavioral-analysis/calculate-score', {
        userId,
        analysis
      });
      return response;
    } catch (error) {
      console.error('Error calculating behavior score:', error);
      throw error;
    }
  },

  /**
   * Get detailed posting patterns for a user
   */
  async getUserPatterns(userId) {
    try {
      const response = await api.get(`/behavioral-analysis/user/${userId}/patterns`);
      return response;
    } catch (error) {
      console.error('Error getting user patterns:', error);
      throw error;
    }
  },

  /**
   * Get behavioral flags for a user
   */
  async getUserFlags(userId) {
    try {
      const response = await api.get(`/behavioral-analysis/user/${userId}/flags`);
      return response;
    } catch (error) {
      console.error('Error getting user flags:', error);
      throw error;
    }
  },

  /**
   * Get behavioral recommendations for a user
   */
  async getUserRecommendations(userId) {
    try {
      const response = await api.get(`/behavioral-analysis/user/${userId}/recommendations`);
      return response;
    } catch (error) {
      console.error('Error getting user recommendations:', error);
      throw error;
    }
  },

  /**
   * Update behavioral analysis thresholds
   */
  async updateThresholds(thresholds) {
    try {
      const response = await api.post('/behavioral-analysis/update-thresholds', {
        thresholds
      });
      return response;
    } catch (error) {
      console.error('Error updating thresholds:', error);
      throw error;
    }
  },

  /**
   * Get current behavioral analysis thresholds
   */
  async getThresholds() {
    try {
      const response = await api.get('/behavioral-analysis/thresholds');
      return response;
    } catch (error) {
      console.error('Error getting thresholds:', error);
      throw error;
    }
  },

  /**
   * Get risk level color for UI display
   */
  getRiskLevelColor(riskLevel) {
    switch (riskLevel) {
      case 'low':
        return '#4CAF50'; // Green
      case 'medium':
        return '#FF9800'; // Orange
      case 'high':
        return '#F44336'; // Red
      default:
        return '#9E9E9E'; // Grey
    }
  },

  /**
   * Get risk level icon for UI display
   */
  getRiskLevelIcon(riskLevel) {
    switch (riskLevel) {
      case 'low':
        return '✅';
      case 'medium':
        return '⚠️';
      case 'high':
        return '🚨';
      default:
        return '❓';
    }
  },

  /**
   * Format risk score for display
   */
  formatRiskScore(score) {
    if (score >= 80) return 'High Risk';
    if (score >= 60) return 'Medium Risk';
    if (score >= 30) return 'Low Risk';
    return 'Clean';
  },

  /**
   * Get flag severity color
   */
  getFlagSeverityColor(severity) {
    switch (severity) {
      case 'high':
        return '#F44336'; // Red
      case 'medium':
        return '#FF9800'; // Orange
      case 'low':
        return '#FFC107'; // Yellow
      default:
        return '#9E9E9E'; // Grey
    }
  },

  /**
   * Get flag severity icon
   */
  getFlagSeverityIcon(severity) {
    switch (severity) {
      case 'high':
        return '🚨';
      case 'medium':
        return '⚠️';
      case 'low':
        return '💡';
      default:
        return 'ℹ️';
    }
  }
};

export default behavioralAnalysisService; 