import api from './api';

/**
 * Content Quality Analysis Service
 * Frontend service for interacting with content quality analysis API
 */
class ContentQualityService {
  /**
   * Analyze content quality for a location
   * @param {Object} locationData - Location data to analyze
   * @param {Object} userData - User data for context
   * @returns {Promise<Object>} Analysis results
   */
  async analyzeContentQuality(locationData, userData = {}) {
    try {
      const response = await api.post('/content-quality/analyze', {
        locationData,
        userData
      });
      return response.data;
    } catch (error) {
      console.error('Content quality analysis failed:', error);
      throw new Error('Failed to analyze content quality');
    }
  }

  /**
   * Validate content for basic requirements
   * @param {Object} locationData - Location data to validate
   * @returns {Promise<Object>} Validation results
   */
  async validateContent(locationData) {
    try {
      const response = await api.post('/content-quality/validate', {
        locationData
      });
      return response.data;
    } catch (error) {
      console.error('Content validation failed:', error);
      throw new Error('Failed to validate content');
    }
  }

  /**
   * Detect spam keywords in content
   * @param {Object} locationData - Location data to check
   * @returns {Promise<Object>} Spam analysis results
   */
  async detectSpam(locationData) {
    try {
      const response = await api.post('/content-quality/detect-spam', {
        locationData
      });
      return response.data;
    } catch (error) {
      console.error('Spam detection failed:', error);
      throw new Error('Failed to detect spam');
    }
  }

  /**
   * Analyze image quality
   * @param {Array} images - Array of image data
   * @returns {Promise<Object>} Image quality analysis
   */
  async analyzeImages(images) {
    try {
      const response = await api.post('/content-quality/analyze-images', {
        images
      });
      return response.data;
    } catch (error) {
      console.error('Image analysis failed:', error);
      throw new Error('Failed to analyze images');
    }
  }

  /**
   * Analyze description quality
   * @param {string} description - Description to analyze
   * @returns {Promise<Object>} Description quality analysis
   */
  async analyzeDescription(description) {
    try {
      const response = await api.post('/content-quality/analyze-description', {
        description
      });
      return response.data;
    } catch (error) {
      console.error('Description analysis failed:', error);
      throw new Error('Failed to analyze description');
    }
  }

  /**
   * Get content quality statistics
   * @param {string} timeRange - Time range for stats (1d, 7d, 30d, 90d)
   * @returns {Promise<Object>} Quality statistics
   */
  async getQualityStats(timeRange = '7d') {
    try {
      const response = await api.get(`/content-quality/stats?timeRange=${timeRange}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get quality stats:', error);
      throw new Error('Failed to get quality statistics');
    }
  }

  /**
   * Get current content quality thresholds
   * @returns {Promise<Object>} Current thresholds
   */
  async getThresholds() {
    try {
      const response = await api.get('/content-quality/thresholds');
      return response.data;
    } catch (error) {
      console.error('Failed to get thresholds:', error);
      throw new Error('Failed to get quality thresholds');
    }
  }

  /**
   * Update content quality thresholds
   * @param {Object} thresholds - New threshold values
   * @returns {Promise<Object>} Updated thresholds
   */
  async updateThresholds(thresholds) {
    try {
      const response = await api.post('/content-quality/update-thresholds', {
        thresholds
      });
      return response.data;
    } catch (error) {
      console.error('Failed to update thresholds:', error);
      throw new Error('Failed to update quality thresholds');
    }
  }

  /**
   * Get quality indicators for content analysis
   * @returns {Promise<Object>} Quality indicators
   */
  async getQualityIndicators() {
    try {
      const response = await api.get('/content-quality/quality-indicators');
      return response.data;
    } catch (error) {
      console.error('Failed to get quality indicators:', error);
      throw new Error('Failed to get quality indicators');
    }
  }

  /**
   * Calculate overall content quality score
   * @param {Object} analysis - Analysis data
   * @returns {Promise<Object>} Score calculation results
   */
  async calculateScore(analysis) {
    try {
      const response = await api.post('/content-quality/calculate-score', {
        analysis
      });
      return response.data;
    } catch (error) {
      console.error('Failed to calculate score:', error);
      throw new Error('Failed to calculate quality score');
    }
  }

  /**
   * Get content quality recommendations for a location
   * @param {string} locationId - Location ID
   * @returns {Promise<Object>} Recommendations
   */
  async getRecommendations(locationId) {
    try {
      const response = await api.get(`/content-quality/recommendations/${locationId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get recommendations:', error);
      throw new Error('Failed to get quality recommendations');
    }
  }

  /**
   * Get content quality risk level definitions
   * @returns {Promise<Object>} Risk level definitions
   */
  async getRiskLevels() {
    try {
      const response = await api.get('/content-quality/risk-levels');
      return response.data;
    } catch (error) {
      console.error('Failed to get risk levels:', error);
      throw new Error('Failed to get risk level definitions');
    }
  }

  /**
   * Analyze content quality in real-time during location creation
   * @param {Object} locationData - Location data being created
   * @returns {Promise<Object>} Real-time analysis results
   */
  async analyzeRealTime(locationData) {
    try {
      const analysis = await this.analyzeContentQuality(locationData);
      
      // Add real-time feedback
      const feedback = {
        ...analysis,
        realTimeFeedback: this.generateRealTimeFeedback(analysis),
        suggestions: this.generateSuggestions(analysis)
      };
      
      return feedback;
    } catch (error) {
      console.error('Real-time analysis failed:', error);
      throw new Error('Failed to analyze content in real-time');
    }
  }

  /**
   * Generate real-time feedback based on analysis
   * @param {Object} analysis - Analysis results
   * @returns {Object} Real-time feedback
   */
  generateRealTimeFeedback(analysis) {
    const feedback = {
      overall: '',
      spam: '',
      images: '',
      description: '',
      suggestions: []
    };

    // Overall quality feedback
    if (analysis.overallScore >= 80) {
      feedback.overall = 'Excellent content quality!';
    } else if (analysis.overallScore >= 60) {
      feedback.overall = 'Good content quality with room for improvement.';
    } else if (analysis.overallScore >= 40) {
      feedback.overall = 'Content quality needs improvement.';
    } else {
      feedback.overall = 'Content quality is poor and needs significant improvement.';
    }

    // Spam feedback
    if (analysis.spamScore > 50) {
      feedback.spam = 'High spam detection - consider removing suspicious keywords.';
    } else if (analysis.spamScore > 20) {
      feedback.spam = 'Some spam indicators detected - review your content.';
    } else {
      feedback.spam = 'No spam detected.';
    }

    // Image feedback
    if (analysis.imageQuality.score < 50) {
      feedback.images = 'Image quality is poor - consider better photos.';
    } else if (analysis.imageQuality.score < 80) {
      feedback.images = 'Image quality could be improved.';
    } else {
      feedback.images = 'Image quality is good.';
    }

    // Description feedback
    if (analysis.descriptionQuality.score < 50) {
      feedback.description = 'Description quality is poor - add more details.';
    } else if (analysis.descriptionQuality.score < 80) {
      feedback.description = 'Description quality could be improved.';
    } else {
      feedback.description = 'Description quality is good.';
    }

    return feedback;
  }

  /**
   * Generate suggestions based on analysis
   * @param {Object} analysis - Analysis results
   * @returns {Array} Suggestions
   */
  generateSuggestions(analysis) {
    const suggestions = [];

    if (analysis.spamScore > 30) {
      suggestions.push('Remove spam keywords like "buy now", "click here", "free money"');
    }

    if (analysis.descriptionQuality.score < 60) {
      suggestions.push('Add more descriptive details about the location');
      suggestions.push('Include specific features or highlights');
    }

    if (analysis.imageQuality.score < 70) {
      suggestions.push('Add higher quality photos');
      suggestions.push('Ensure photos are clear and relevant');
    }

    if (analysis.flags.includes('NO_DESCRIPTION')) {
      suggestions.push('Add a detailed description of the location');
    }

    if (analysis.flags.includes('LOW_UNIQUENESS')) {
      suggestions.push('Use more varied and specific language');
    }

    return suggestions;
  }

  /**
   * Get quality score color based on score
   * @param {number} score - Quality score (0-100)
   * @returns {string} CSS color class
   */
  getScoreColor(score) {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    if (score >= 40) return 'text-danger';
    return 'text-danger';
  }

  /**
   * Get risk level color
   * @param {string} riskLevel - Risk level (LOW, MEDIUM, HIGH, CRITICAL)
   * @returns {string} CSS color class
   */
  getRiskLevelColor(riskLevel) {
    switch (riskLevel) {
      case 'LOW': return 'text-success';
      case 'MEDIUM': return 'text-warning';
      case 'HIGH': return 'text-danger';
      case 'CRITICAL': return 'text-danger font-weight-bold';
      default: return 'text-muted';
    }
  }
}

export default new ContentQualityService(); 