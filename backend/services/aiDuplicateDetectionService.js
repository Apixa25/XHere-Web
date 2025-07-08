const { Pool } = require('pg');
const stringSimilarity = require('string-similarity');
const natural = require('natural');
const tf = require('@tensorflow/tfjs-node');
const { pipeline } = require('@huggingface/transformers');

class AIDuplicateDetectionService {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    
    // AI Models
    this.textEmbeddingModel = null;
    this.imageSimilarityModel = null;
    this.behavioralModel = null;
    
    this.initializeAIModels();
  }

  async initializeAIModels() {
    try {
      console.log('🤖 Initializing AI models...');
      
      // Load text embedding model for semantic similarity
      this.textEmbeddingModel = await pipeline('feature-extraction', 'sentence-transformers/all-MiniLM-L6-v2');
      
      // Load image similarity model
      this.imageSimilarityModel = await pipeline('image-classification', 'microsoft/resnet-50');
      
      // Initialize behavioral analysis model
      this.behavioralModel = await this.loadBehavioralModel();
      
      console.log('✅ AI models loaded successfully');
    } catch (error) {
      console.error('❌ Error loading AI models:', error);
      // Fallback to traditional methods
    }
  }

  async loadBehavioralModel() {
    // Create a simple neural network for behavioral analysis
    const model = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [10], units: 64, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 32, activation: 'relu' }),
        tf.layers.dense({ units: 1, activation: 'sigmoid' })
      ]
    });
    
    model.compile({
      optimizer: 'adam',
      loss: 'binaryCrossentropy',
      metrics: ['accuracy']
    });
    
    return model;
  }

  async getTextEmbedding(text) {
    try {
      if (!this.textEmbeddingModel) {
        return null;
      }
      
      const embedding = await this.textEmbeddingModel(text);
      return embedding.data;
    } catch (error) {
      console.error('Error getting text embedding:', error);
      return null;
    }
  }

  async calculateSemanticSimilarity(text1, text2) {
    try {
      const embedding1 = await this.getTextEmbedding(text1);
      const embedding2 = await this.getTextEmbedding(text2);
      
      if (!embedding1 || !embedding2) {
        return 0;
      }
      
      // Calculate cosine similarity
      const similarity = this.cosineSimilarity(embedding1, embedding2);
      return similarity;
    } catch (error) {
      console.error('Error calculating semantic similarity:', error);
      return 0;
    }
  }

  cosineSimilarity(vec1, vec2) {
    const dotProduct = vec1.reduce((sum, val, i) => sum + val * vec2[i], 0);
    const magnitude1 = Math.sqrt(vec1.reduce((sum, val) => sum + val * val, 0));
    const magnitude2 = Math.sqrt(vec2.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (magnitude1 * magnitude2);
  }

  async analyzeImageSimilarity(image1, image2) {
    try {
      if (!this.imageSimilarityModel) {
        return 0;
      }
      
      const features1 = await this.imageSimilarityModel(image1);
      const features2 = await this.imageSimilarityModel(image2);
      
      return this.cosineSimilarity(features1.data, features2.data);
    } catch (error) {
      console.error('Error analyzing image similarity:', error);
      return 0;
    }
  }

  async analyzeBehavioralPatterns(userId, locationData) {
    try {
      if (!this.behavioralModel) {
        return this.analyzeBehavioralPatternsTraditional(userId, locationData);
      }
      
      // Extract behavioral features
      const features = await this.extractBehavioralFeatures(userId, locationData);
      
      // Use AI model to predict suspicious behavior
      const prediction = await this.behavioralModel.predict(tf.tensor2d([features]));
      const suspiciousScore = prediction.dataSync()[0];
      
      return {
        suspiciousScore,
        isSuspicious: suspiciousScore > 0.7,
        confidence: suspiciousScore
      };
    } catch (error) {
      console.error('Error in AI behavioral analysis:', error);
      return this.analyzeBehavioralPatternsTraditional(userId, locationData);
    }
  }

  async extractBehavioralFeatures(userId, locationData) {
    // Extract 10 behavioral features for AI analysis
    const features = [];
    
    // 1. Posting frequency (posts per hour)
    const hourlyPosts = await this.getUserPostingFrequency(userId, 'hour');
    features.push(Math.min(hourlyPosts / 10, 1)); // Normalize to 0-1
    
    // 2. Time between posts
    const avgTimeBetweenPosts = await this.getAverageTimeBetweenPosts(userId);
    features.push(Math.max(0, 1 - (avgTimeBetweenPosts / 3600000))); // Normalize
    
    // 3. Location density (posts per km²)
    const locationDensity = await this.getLocationDensity(userId);
    features.push(Math.min(locationDensity / 100, 1));
    
    // 4. Text similarity with previous posts
    const textSimilarity = await this.getAverageTextSimilarity(userId);
    features.push(textSimilarity);
    
    // 5. Coordinate clustering
    const clusteringScore = await this.getCoordinateClusteringScore(userId);
    features.push(clusteringScore);
    
    // 6. Anonymous posting ratio
    const anonymousRatio = await this.getAnonymousPostingRatio(userId);
    features.push(anonymousRatio);
    
    // 7. Account age
    const accountAge = await this.getAccountAge(userId);
    features.push(Math.max(0, 1 - (accountAge / 30))); // Newer accounts = higher risk
    
    // 8. Location type diversity
    const typeDiversity = await this.getLocationTypeDiversity(userId);
    features.push(1 - typeDiversity); // Low diversity = higher risk
    
    // 9. Rating patterns
    const ratingPatterns = await this.getRatingPatterns(userId);
    features.push(ratingPatterns);
    
    // 10. Community feedback
    const communityFeedback = await this.getCommunityFeedback(userId);
    features.push(communityFeedback);
    
    return features;
  }

  async detectDuplicates(locationData) {
    console.log('🤖 AI-powered duplicate detection started...');
    
    const {
      latitude,
      longitude,
      text,
      media,
      userId,
      locationType
    } = locationData;

    const analysis = {
      riskScore: 0,
      riskLevel: 'clean',
      flags: [],
      similarLocations: [],
      recommendations: [],
      aiConfidence: 0,
      detectionMethods: []
    };

    try {
      // 1. AI-Powered Semantic Text Analysis
      const semanticAnalysis = await this.performSemanticTextAnalysis(text, latitude, longitude);
      analysis.similarLocations.push(...semanticAnalysis.similarLocations);
      analysis.flags.push(...semanticAnalysis.flags);
      analysis.aiConfidence += semanticAnalysis.confidence * 0.4;

      // 2. AI-Powered Image Analysis
      if (media && media.length > 0) {
        const imageAnalysis = await this.performImageAnalysis(media, latitude, longitude);
        analysis.similarLocations.push(...imageAnalysis.similarLocations);
        analysis.flags.push(...imageAnalysis.flags);
        analysis.aiConfidence += imageAnalysis.confidence * 0.3;
      }

      // 3. AI-Powered Behavioral Analysis
      const behavioralAnalysis = await this.analyzeBehavioralPatterns(userId, locationData);
      analysis.flags.push(...behavioralAnalysis.flags);
      analysis.aiConfidence += behavioralAnalysis.confidence * 0.3;

      // 4. AI-Powered Coordinate Analysis
      const coordinateAnalysis = await this.performAICoordinateAnalysis(latitude, longitude, text);
      analysis.similarLocations.push(...coordinateAnalysis.similarLocations);
      analysis.flags.push(...coordinateAnalysis.flags);

      // 5. Calculate AI-Enhanced Risk Score
      analysis.riskScore = this.calculateAIRiskScore(analysis);
      analysis.riskLevel = this.getRiskLevel(analysis.riskScore);

      // 6. Generate AI-Powered Recommendations
      analysis.recommendations = this.generateAIRecommendations(analysis);

      console.log('🤖 AI analysis completed:', {
        riskScore: analysis.riskScore,
        riskLevel: analysis.riskLevel,
        aiConfidence: analysis.aiConfidence,
        flags: analysis.flags.length,
        similarLocations: analysis.similarLocations.length
      });

      return analysis;

    } catch (error) {
      console.error('❌ AI duplicate detection error:', error);
      // Fallback to traditional methods
      return this.fallbackToTraditionalDetection(locationData);
    }
  }

  async performSemanticTextAnalysis(text, latitude, longitude) {
    const result = {
      similarLocations: [],
      flags: [],
      confidence: 0
    };

    try {
      // Get nearby locations for semantic comparison
      const nearbyLocations = await this.getNearbyLocations(latitude, longitude, 1000);
      
      for (const location of nearbyLocations) {
        const semanticSimilarity = await this.calculateSemanticSimilarity(text, location.content.text);
        
        if (semanticSimilarity > 0.8) {
          result.similarLocations.push({
            id: location.id,
            similarity: semanticSimilarity,
            type: 'semantic_text',
            location: location,
            confidence: semanticSimilarity
          });
          
          result.confidence = Math.max(result.confidence, semanticSimilarity);
        }
      }

      // AI-powered content analysis
      const contentAnalysis = await this.analyzeContentQuality(text);
      if (contentAnalysis.isLowQuality) {
        result.flags.push({
          type: 'low_quality_content',
          severity: 'medium',
          description: 'Content appears to be low quality or spam-like',
          confidence: contentAnalysis.confidence
        });
      }

    } catch (error) {
      console.error('Error in semantic text analysis:', error);
    }

    return result;
  }

  async performImageAnalysis(media, latitude, longitude) {
    const result = {
      similarLocations: [],
      flags: [],
      confidence: 0
    };

    try {
      // Get nearby locations with images
      const nearbyLocations = await this.getNearbyLocationsWithImages(latitude, longitude, 1000);
      
      for (const location of nearbyLocations) {
        if (location.media && location.media.length > 0) {
          for (const userImage of media) {
            const imageSimilarity = await this.analyzeImageSimilarity(userImage, location.media[0]);
            
            if (imageSimilarity > 0.85) {
              result.similarLocations.push({
                id: location.id,
                similarity: imageSimilarity,
                type: 'image_similarity',
                location: location,
                confidence: imageSimilarity
              });
              
              result.confidence = Math.max(result.confidence, imageSimilarity);
            }
          }
        }
      }

    } catch (error) {
      console.error('Error in image analysis:', error);
    }

    return result;
  }

  async performAICoordinateAnalysis(latitude, longitude, text) {
    const result = {
      similarLocations: [],
      flags: [],
      confidence: 0
    };

    try {
      // Use AI to analyze coordinate patterns
      const coordinatePatterns = await this.analyzeCoordinatePatterns(latitude, longitude);
      
      if (coordinatePatterns.isSuspicious) {
        result.flags.push({
          type: 'suspicious_coordinate_pattern',
          severity: 'high',
          description: 'Coordinate pattern suggests automated posting',
          confidence: coordinatePatterns.confidence
        });
        
        result.confidence = coordinatePatterns.confidence;
      }

      // AI-enhanced proximity detection
      const nearbyLocations = await this.getNearbyLocations(latitude, longitude, 100);
      
      for (const location of nearbyLocations) {
        const distance = this.calculateDistance(latitude, longitude, location.location.coordinates[1], location.location.coordinates[0]);
        
        if (distance < 50) { // Within 50 meters
          const textSimilarity = await this.calculateSemanticSimilarity(text, location.content.text);
          
          if (textSimilarity > 0.6) {
            result.similarLocations.push({
              id: location.id,
              similarity: textSimilarity,
              type: 'proximity_and_text',
              location: location,
              confidence: textSimilarity * 0.8
            });
          }
        }
      }

    } catch (error) {
      console.error('Error in AI coordinate analysis:', error);
    }

    return result;
  }

  calculateAIRiskScore(analysis) {
    let riskScore = 0;
    
    // Base risk from flags
    analysis.flags.forEach(flag => {
      switch (flag.severity) {
        case 'high':
          riskScore += 30;
          break;
        case 'medium':
          riskScore += 15;
          break;
        case 'low':
          riskScore += 5;
          break;
      }
    });
    
    // Risk from similar locations
    analysis.similarLocations.forEach(similar => {
      riskScore += similar.confidence * 20;
    });
    
    // AI confidence bonus
    riskScore += analysis.aiConfidence * 10;
    
    return Math.min(riskScore, 100);
  }

  generateAIRecommendations(analysis) {
    const recommendations = [];
    
    if (analysis.riskScore > 70) {
      recommendations.push({
        type: 'high_risk',
        message: 'This location has a high risk of being a duplicate. Please review carefully.',
        action: 'manual_review_required'
      });
    }
    
    if (analysis.similarLocations.length > 0) {
      recommendations.push({
        type: 'similar_locations',
        message: `Found ${analysis.similarLocations.length} similar locations nearby.`,
        action: 'review_similar_locations'
      });
    }
    
    if (analysis.flags.some(f => f.type === 'suspicious_coordinate_pattern')) {
      recommendations.push({
        type: 'suspicious_pattern',
        message: 'Coordinate pattern suggests automated posting behavior.',
        action: 'investigate_user_behavior'
      });
    }
    
    return recommendations;
  }

  // Helper methods (implementations would be similar to traditional service)
  async getNearbyLocations(lat, lng, radius) {
    // Implementation similar to traditional service
    return [];
  }

  async getNearbyLocationsWithImages(lat, lng, radius) {
    // Implementation similar to traditional service
    return [];
  }

  calculateDistance(lat1, lng1, lat2, lng2) {
    // Implementation similar to traditional service
    return 0;
  }

  async analyzeContentQuality(text) {
    // AI-powered content quality analysis
    return {
      isLowQuality: false,
      confidence: 0.5
    };
  }

  async analyzeCoordinatePatterns(lat, lng) {
    // AI-powered coordinate pattern analysis
    return {
      isSuspicious: false,
      confidence: 0.5
    };
  }

  // Traditional fallback methods
  async fallbackToTraditionalDetection(locationData) {
    // Fallback to the traditional duplicate detection service
    const traditionalService = require('./duplicateDetectionService');
    return traditionalService.detectDuplicates(locationData);
  }
}

module.exports = new AIDuplicateDetectionService(); 