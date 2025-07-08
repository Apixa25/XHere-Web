const Location = require('../models/Location');
const User = require('../models/User');
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const stringSimilarity = require('string-similarity');

/**
 * 🛡️ Duplicate Detection Service
 * AI-powered spam prevention through intelligent duplicate detection
 */
class DuplicateDetectionService {
  
  /**
   * 🔍 Detect similar coordinates within a radius
   * @param {number} latitude - Target latitude
   * @param {number} longitude - Target longitude
   * @param {number} radiusMeters - Search radius in meters (default: 50m)
   * @returns {Promise<Array>} Array of similar locations
   */
  async detectSimilarCoordinates(latitude, longitude, radiusMeters = 50) {
    try {
      console.log(`🔍 Checking for similar coordinates at (${latitude}, ${longitude}) within ${radiusMeters}m`);
      
      const similarLocations = await Location.findAll({
        where: {
          location: sequelize.literal(`
            ST_DWithin(
              location::geometry, 
              ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326), 
              ${radiusMeters}
            )
          `)
        },
        include: [{
          model: User,
          as: 'creator',
          attributes: ['id', 'email', 'profile']
        }],
        order: [
          [sequelize.literal(`ST_Distance(location::geometry, ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326))`), 'ASC']
        ],
        limit: 10
      });

      console.log(`🔍 Found ${similarLocations.length} locations within ${radiusMeters}m radius`);
      return similarLocations;
    } catch (error) {
      console.error('❌ Error detecting similar coordinates:', error);
      throw error;
    }
  }

  /**
   * 🎯 Fuzzy matching for location names and descriptions
   * @param {string} text - Text to match against
   * @param {number} similarityThreshold - Minimum similarity score (0-1)
   * @returns {Promise<Array>} Array of similar locations
   */
  async detectSimilarText(text, similarityThreshold = 0.7) {
    try {
      console.log(`🎯 Checking for similar text: "${text}" with threshold ${similarityThreshold}`);
      
      // Get all locations with text content
      const allLocations = await Location.findAll({
        where: {
          'content.text': {
            [Op.ne]: null,
            [Op.ne]: ''
          }
        },
        include: [{
          model: User,
          as: 'creator',
          attributes: ['id', 'email', 'profile']
        }],
        limit: 1000 // Limit for performance
      });

      const similarLocations = [];
      const normalizedText = text.toLowerCase().trim();

      for (const location of allLocations) {
        const locationText = location.content.text.toLowerCase().trim();
        
        // Skip if text is too short
        if (locationText.length < 3 || normalizedText.length < 3) continue;
        
        // Calculate similarity using string-similarity library
        const similarity = stringSimilarity.compareTwoStrings(normalizedText, locationText);
        
        if (similarity >= similarityThreshold) {
          similarLocations.push({
            ...location.toJSON(),
            similarityScore: similarity
          });
        }
      }

      // Sort by similarity score (highest first)
      similarLocations.sort((a, b) => b.similarityScore - a.similarityScore);
      
      console.log(`🎯 Found ${similarLocations.length} locations with similar text (threshold: ${similarityThreshold})`);
      return similarLocations.slice(0, 10); // Return top 10 matches
    } catch (error) {
      console.error('❌ Error detecting similar text:', error);
      throw error;
    }
  }

  /**
   * 🕵️ Detect clustering patterns for suspicious activity
   * @param {string} userId - User ID to check for clustering
   * @param {number} timeWindowHours - Time window in hours (default: 24)
   * @param {number} maxLocationsPerWindow - Maximum locations per time window (default: 5)
   * @returns {Promise<Object>} Clustering analysis results
   */
  async detectClusteringPatterns(userId, timeWindowHours = 24, maxLocationsPerWindow = 5) {
    try {
      console.log(`🕵️ Checking for clustering patterns for user ${userId}`);
      
      const timeWindow = new Date(Date.now() - (timeWindowHours * 60 * 60 * 1000));
      
      // Get user's recent locations
      const recentLocations = await Location.findAll({
        where: {
          creatorId: userId,
          createdAt: {
            [Op.gte]: timeWindow
          }
        },
        order: [['createdAt', 'DESC']]
      });

      if (recentLocations.length === 0) {
        return {
          isClustering: false,
          locationsInWindow: 0,
          suspiciousPatterns: [],
          riskScore: 0
        };
      }

      // Analyze clustering patterns
      const suspiciousPatterns = [];
      let riskScore = 0;

      // Pattern 1: Too many locations in time window
      if (recentLocations.length > maxLocationsPerWindow) {
        suspiciousPatterns.push({
          type: 'excessive_posting',
          description: `User posted ${recentLocations.length} locations in ${timeWindowHours} hours`,
          severity: 'high'
        });
        riskScore += 30;
      }

      // Pattern 2: Locations too close together geographically
      const closeLocations = [];
      for (let i = 0; i < recentLocations.length; i++) {
        for (let j = i + 1; j < recentLocations.length; j++) {
          const loc1 = recentLocations[i];
          const loc2 = recentLocations[j];
          
          const distance = this.calculateDistance(
            loc1.location.coordinates[1], loc1.location.coordinates[0],
            loc2.location.coordinates[1], loc2.location.coordinates[0]
          );
          
          if (distance < 100) { // Within 100 meters
            closeLocations.push({
              location1: loc1.id,
              location2: loc2.id,
              distance: Math.round(distance)
            });
          }
        }
      }

      if (closeLocations.length > 0) {
        suspiciousPatterns.push({
          type: 'geographic_clustering',
          description: `Found ${closeLocations.length} pairs of locations within 100m of each other`,
          details: closeLocations,
          severity: 'medium'
        });
        riskScore += 20;
      }

      // Pattern 3: Similar content patterns
      const textSimilarities = [];
      for (let i = 0; i < recentLocations.length; i++) {
        for (let j = i + 1; j < recentLocations.length; j++) {
          const loc1 = recentLocations[i];
          const loc2 = recentLocations[j];
          
          if (loc1.content.text && loc2.content.text) {
            const similarity = stringSimilarity.compareTwoStrings(
              loc1.content.text.toLowerCase(),
              loc2.content.text.toLowerCase()
            );
            
            if (similarity > 0.8) {
              textSimilarities.push({
                location1: loc1.id,
                location2: loc2.id,
                similarity: Math.round(similarity * 100)
              });
            }
          }
        }
      }

      if (textSimilarities.length > 0) {
        suspiciousPatterns.push({
          type: 'content_similarity',
          description: `Found ${textSimilarities.length} pairs with very similar content`,
          details: textSimilarities,
          severity: 'medium'
        });
        riskScore += 15;
      }

      // Pattern 4: Rapid posting (locations created very quickly)
      const rapidPostings = [];
      for (let i = 1; i < recentLocations.length; i++) {
        const timeDiff = recentLocations[i-1].createdAt - recentLocations[i].createdAt;
        const minutesDiff = timeDiff / (1000 * 60);
        
        if (minutesDiff < 5) { // Less than 5 minutes between posts
          rapidPostings.push({
            location1: recentLocations[i].id,
            location2: recentLocations[i-1].id,
            timeDiffMinutes: Math.round(minutesDiff)
          });
        }
      }

      if (rapidPostings.length > 0) {
        suspiciousPatterns.push({
          type: 'rapid_posting',
          description: `Found ${rapidPostings.length} instances of rapid posting (< 5 minutes apart)`,
          details: rapidPostings,
          severity: 'high'
        });
        riskScore += 25;
      }

      const isClustering = riskScore >= 30; // Threshold for clustering detection

      console.log(`🕵️ Clustering analysis complete - Risk score: ${riskScore}, Patterns found: ${suspiciousPatterns.length}`);
      
      return {
        isClustering,
        locationsInWindow: recentLocations.length,
        suspiciousPatterns,
        riskScore,
        timeWindowHours,
        maxLocationsPerWindow
      };
    } catch (error) {
      console.error('❌ Error detecting clustering patterns:', error);
      throw error;
    }
  }

  /**
   * 📝 Comprehensive duplicate detection for new location
   * @param {Object} locationData - New location data
   * @param {string} userId - User creating the location
   * @returns {Promise<Object>} Comprehensive duplicate analysis
   */
  async detectDuplicates(locationData, userId) {
    try {
      console.log(`🛡️ Running comprehensive duplicate detection for user ${userId}`);
      
      const { latitude, longitude, text, locationType } = locationData;
      
      // Run all detection methods
      const [
        similarCoordinates,
        similarText,
        clusteringAnalysis
      ] = await Promise.all([
        this.detectSimilarCoordinates(latitude, longitude),
        this.detectSimilarText(text),
        this.detectClusteringPatterns(userId)
      ]);

      // Calculate overall risk score
      let totalRiskScore = 0;
      const duplicateFlags = [];

      // Coordinate similarity risk
      if (similarCoordinates.length > 0) {
        const closestDistance = similarCoordinates[0].distance || 0;
        if (closestDistance < 25) {
          duplicateFlags.push({
            type: 'very_close_coordinates',
            description: `Location is very close to existing location (${closestDistance}m)`,
            severity: 'high',
            riskScore: 40
          });
          totalRiskScore += 40;
        } else if (closestDistance < 50) {
          duplicateFlags.push({
            type: 'close_coordinates',
            description: `Location is close to existing location (${closestDistance}m)`,
            severity: 'medium',
            riskScore: 20
          });
          totalRiskScore += 20;
        }
      }

      // Text similarity risk
      if (similarText.length > 0) {
        const highestSimilarity = similarText[0].similarityScore;
        if (highestSimilarity > 0.9) {
          duplicateFlags.push({
            type: 'very_similar_text',
            description: `Text is very similar to existing location (${Math.round(highestSimilarity * 100)}% match)`,
            severity: 'high',
            riskScore: 35
          });
          totalRiskScore += 35;
        } else if (highestSimilarity > 0.7) {
          duplicateFlags.push({
            type: 'similar_text',
            description: `Text is similar to existing location (${Math.round(highestSimilarity * 100)}% match)`,
            severity: 'medium',
            riskScore: 15
          });
          totalRiskScore += 15;
        }
      }

      // Clustering risk
      if (clusteringAnalysis.isClustering) {
        duplicateFlags.push({
          type: 'clustering_pattern',
          description: `User shows clustering behavior (risk score: ${clusteringAnalysis.riskScore})`,
          severity: 'high',
          riskScore: clusteringAnalysis.riskScore
        });
        totalRiskScore += clusteringAnalysis.riskScore;
      }

      // Determine overall duplicate status
      let duplicateStatus = 'clean';
      if (totalRiskScore >= 70) {
        duplicateStatus = 'high_risk';
      } else if (totalRiskScore >= 40) {
        duplicateStatus = 'medium_risk';
      } else if (totalRiskScore >= 20) {
        duplicateStatus = 'low_risk';
      }

      const analysis = {
        duplicateStatus,
        totalRiskScore,
        duplicateFlags,
        similarCoordinates: similarCoordinates.slice(0, 5), // Top 5 closest
        similarText: similarText.slice(0, 5), // Top 5 most similar
        clusteringAnalysis,
        recommendations: this.generateRecommendations(duplicateFlags, totalRiskScore)
      };

      console.log(`🛡️ Duplicate detection complete - Status: ${duplicateStatus}, Risk Score: ${totalRiskScore}`);
      
      return analysis;
    } catch (error) {
      console.error('❌ Error in comprehensive duplicate detection:', error);
      throw error;
    }
  }

  /**
   * 📊 Generate recommendations based on duplicate analysis
   * @param {Array} duplicateFlags - Array of duplicate flags
   * @param {number} totalRiskScore - Total risk score
   * @returns {Array} Array of recommendations
   */
  generateRecommendations(duplicateFlags, totalRiskScore) {
    const recommendations = [];

    if (totalRiskScore >= 70) {
      recommendations.push({
        action: 'reject',
        reason: 'High risk of duplicate - recommend rejection',
        priority: 'high'
      });
    } else if (totalRiskScore >= 40) {
      recommendations.push({
        action: 'review',
        reason: 'Medium risk - recommend manual review',
        priority: 'medium'
      });
    }

    // Specific recommendations based on flags
    duplicateFlags.forEach(flag => {
      switch (flag.type) {
        case 'very_close_coordinates':
          recommendations.push({
            action: 'warn',
            reason: 'Location is very close to existing location - consider moving or combining',
            priority: 'high'
          });
          break;
        case 'very_similar_text':
          recommendations.push({
            action: 'warn',
            reason: 'Text is very similar to existing location - consider editing description',
            priority: 'high'
          });
          break;
        case 'clustering_pattern':
          recommendations.push({
            action: 'limit',
            reason: 'User showing clustering behavior - consider posting limits',
            priority: 'medium'
          });
          break;
      }
    });

    return recommendations;
  }

  /**
   * 📍 Calculate distance between two coordinates using Haversine formula
   * @param {number} lat1 - Latitude 1
   * @param {number} lon1 - Longitude 1
   * @param {number} lat2 - Latitude 2
   * @param {number} lon2 - Longitude 2
   * @returns {number} Distance in meters
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * 📝 Report duplicate for manual review
   * @param {string} locationId - ID of the location being reported
   * @param {string} reporterId - ID of the user reporting
   * @param {Object} duplicateAnalysis - Analysis results
   * @returns {Promise<Object>} Report creation result
   */
  async reportDuplicate(locationId, reporterId, duplicateAnalysis) {
    try {
      console.log(`📝 Creating duplicate report for location ${locationId}`);
      
      // Store report in database (you might want to create a separate table for this)
      const report = {
        locationId,
        reporterId,
        reportType: 'duplicate',
        analysis: duplicateAnalysis,
        status: 'pending',
        createdAt: new Date()
      };

      // For now, we'll log the report
      // TODO: Create a proper reports table
      console.log('📝 Duplicate report created:', report);
      
      return {
        success: true,
        reportId: `report_${Date.now()}`,
        message: 'Duplicate report submitted successfully'
      };
    } catch (error) {
      console.error('❌ Error reporting duplicate:', error);
      throw error;
    }
  }

  /**
   * 🔍 Get duplicate detection statistics
   * @param {string} userId - Optional user ID to filter
   * @returns {Promise<Object>} Statistics object
   */
  async getDuplicateStats(userId = null) {
    try {
      const whereClause = userId ? { creatorId: userId } : {};
      
      const totalLocations = await Location.count({ where: whereClause });
      const flaggedLocations = await Location.count({
        where: {
          ...whereClause,
          locationStatus: {
            [Op.in]: ['flagged', 'removed']
          }
        }
      });

      return {
        totalLocations,
        flaggedLocations,
        flagRate: totalLocations > 0 ? (flaggedLocations / totalLocations * 100).toFixed(2) : 0,
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('❌ Error getting duplicate stats:', error);
      throw error;
    }
  }
}

module.exports = new DuplicateDetectionService(); 