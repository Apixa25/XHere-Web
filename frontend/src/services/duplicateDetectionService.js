import api from './api';

/**
 * 🛡️ Frontend Duplicate Detection Service
 * Handles all duplicate detection API interactions
 */
class DuplicateDetectionService {
  
  /**
   * 🔍 Check for duplicates before creating a location
   * @param {Object} locationData - Location data to check
   * @returns {Promise<Object>} Duplicate analysis results
   */
  async checkDuplicates(locationData) {
    try {
      const { latitude, longitude, text, locationType } = locationData;
      
      const response = await api.get('/duplicate-detection/check', {
        params: {
          latitude,
          longitude,
          text,
          locationType: locationType || 'general'
        }
      });
      
      console.log('🔍 Duplicate check response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error checking for duplicates:', error);
      throw error;
    }
  }

  /**
   * 📝 Report a location as a duplicate
   * @param {string} locationId - ID of the location to report
   * @param {Object} analysis - Duplicate analysis data
   * @returns {Promise<Object>} Report submission result
   */
  async reportDuplicate(locationId, analysis) {
    try {
      const response = await api.post('/duplicate-detection/report', {
        locationId,
        analysis
      });
      
      console.log('📝 Duplicate report submitted:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error reporting duplicate:', error);
      throw error;
    }
  }

  /**
   * 📍 Find locations with similar coordinates
   * @param {number} latitude - Latitude to check
   * @param {number} longitude - Longitude to check
   * @param {number} radius - Search radius in meters
   * @returns {Promise<Object>} Similar locations
   */
  async findSimilarCoordinates(latitude, longitude, radius = 50) {
    try {
      const response = await api.get('/duplicate-detection/similar-coordinates', {
        params: {
          latitude,
          longitude,
          radius
        }
      });
      
      console.log('📍 Similar coordinates found:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error finding similar coordinates:', error);
      throw error;
    }
  }

  /**
   * 🎯 Find locations with similar text content
   * @param {string} text - Text to search for
   * @param {number} threshold - Similarity threshold (0-1)
   * @returns {Promise<Object>} Similar text locations
   */
  async findSimilarText(text, threshold = 0.7) {
    try {
      const response = await api.get('/duplicate-detection/similar-text', {
        params: {
          text,
          threshold
        }
      });
      
      console.log('🎯 Similar text found:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error finding similar text:', error);
      throw error;
    }
  }

  /**
   * 🕵️ Analyze user's posting patterns for clustering
   * @param {string} userId - User ID to analyze (optional)
   * @param {number} timeWindow - Time window in hours
   * @param {number} maxLocations - Max locations per window
   * @returns {Promise<Object>} Clustering analysis
   */
  async analyzeClustering(userId = null, timeWindow = 24, maxLocations = 5) {
    try {
      const params = {
        timeWindow,
        maxLocations
      };
      
      if (userId) {
        params.userId = userId;
      }
      
      const response = await api.get('/duplicate-detection/clustering-analysis', {
        params
      });
      
      console.log('🕵️ Clustering analysis:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error analyzing clustering:', error);
      throw error;
    }
  }

  /**
   * 📊 Get duplicate detection statistics
   * @param {string} userId - Optional user ID to filter
   * @returns {Promise<Object>} Statistics data
   */
  async getStats(userId = null) {
    try {
      const params = {};
      if (userId) {
        params.userId = userId;
      }
      
      const response = await api.get('/duplicate-detection/stats', {
        params
      });
      
      console.log('📊 Duplicate detection stats:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error getting duplicate stats:', error);
      throw error;
    }
  }

  /**
   * 🛡️ Validate location before creation
   * @param {Object} locationData - Location data to validate
   * @returns {Promise<Object>} Validation results
   */
  async validateLocation(locationData) {
    try {
      const { latitude, longitude, text, locationType } = locationData;
      
      const response = await api.post('/duplicate-detection/validate-location', {
        latitude,
        longitude,
        text,
        locationType: locationType || 'general'
      });
      
      console.log('🛡️ Location validation:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error validating location:', error);
      throw error;
    }
  }

  /**
   * 🎯 Pre-check location before form submission
   * @param {Object} locationData - Location data to pre-check
   * @returns {Promise<Object>} Pre-check results
   */
  async preCheckLocation(locationData) {
    try {
      // This is a lightweight check before the full validation
      const { latitude, longitude, text } = locationData;
      
      if (!latitude || !longitude || !text) {
        return {
          success: false,
          error: 'Missing required location data'
        };
      }

      // Quick coordinate check
      const coordinateCheck = await this.findSimilarCoordinates(latitude, longitude, 25);
      
      // Quick text check
      const textCheck = await this.findSimilarText(text, 0.8);
      
      const hasNearbyLocations = coordinateCheck.similarLocations.length > 0;
      const hasSimilarText = textCheck.similarLocations.length > 0;
      
      let riskLevel = 'low';
      let warnings = [];
      
      if (hasNearbyLocations && hasSimilarText) {
        riskLevel = 'high';
        warnings.push('Very similar location found nearby');
      } else if (hasNearbyLocations || hasSimilarText) {
        riskLevel = 'medium';
        if (hasNearbyLocations) warnings.push('Location found nearby');
        if (hasSimilarText) warnings.push('Similar text content found');
      }
      
      return {
        success: true,
        riskLevel,
        warnings,
        nearbyCount: coordinateCheck.similarLocations.length,
        similarTextCount: textCheck.similarLocations.length,
        shouldProceed: riskLevel !== 'high'
      };
    } catch (error) {
      console.error('❌ Error in location pre-check:', error);
      return {
        success: false,
        error: 'Failed to pre-check location',
        shouldProceed: true // Allow proceeding if check fails
      };
    }
  }

  /**
   * 🎮 Get user-friendly duplicate detection tips
   * @returns {Array} Array of helpful tips
   */
  getDuplicatePreventionTips() {
    return [
      {
        icon: '📍',
        title: 'Check Your Location',
        description: 'Make sure your location is at least 50 meters away from existing locations'
      },
      {
        icon: '📝',
        title: 'Unique Descriptions',
        description: 'Write unique, detailed descriptions that clearly differentiate your location'
      },
      {
        icon: '🕐',
        title: 'Timing Matters',
        description: 'Avoid posting multiple locations in rapid succession (wait at least 5 minutes)'
      },
      {
        icon: '🎯',
        title: 'Be Specific',
        description: 'Include specific details like business names, unique features, or exact addresses'
      },
      {
        icon: '📸',
        title: 'Add Photos',
        description: 'Include photos to help distinguish your location from similar ones'
      }
    ];
  }

  /**
   * 🎨 Format duplicate analysis for display
   * @param {Object} analysis - Raw analysis data
   * @returns {Object} Formatted analysis for UI
   */
  formatAnalysisForDisplay(analysis) {
    if (!analysis) return null;
    
    return {
      status: analysis.duplicateStatus,
      riskScore: analysis.totalRiskScore,
      flags: analysis.duplicateFlags || [],
      similarLocations: analysis.similarCoordinates || [],
      recommendations: analysis.recommendations || [],
      clustering: analysis.clusteringAnalysis || {},
      isHighRisk: analysis.duplicateStatus === 'high_risk',
      isMediumRisk: analysis.duplicateStatus === 'medium_risk',
      isLowRisk: analysis.duplicateStatus === 'low_risk',
      isClean: analysis.duplicateStatus === 'clean'
    };
  }
}

export default new DuplicateDetectionService(); 