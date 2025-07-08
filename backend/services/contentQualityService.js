const Location = require('../models/Location');
const User = require('../models/User');
const { Op } = require('sequelize');

/**
 * Content Quality Analysis Service
 * Analyzes location content for spam, quality, and authenticity
 */
class ContentQualityService {
  constructor() {
    // Spam keywords and patterns
    this.spamKeywords = [
      'buy now', 'click here', 'free money', 'make money fast',
      'work from home', 'earn cash', 'get rich quick', 'investment opportunity',
      'limited time', 'act now', 'don\'t miss out', 'exclusive offer',
      'guaranteed', '100% free', 'no risk', 'instant cash',
      'bitcoin', 'crypto', 'forex', 'mlm', 'pyramid scheme',
      'weight loss', 'diet pills', 'miracle cure', 'anti-aging',
      'lottery', 'sweepstakes', 'prize', 'winner', 'congratulations',
      'urgent', 'emergency', 'help needed', 'desperate', 'last chance'
    ];

    // Quality indicators
    this.qualityIndicators = {
      positive: [
        'authentic', 'local', 'community', 'family', 'friendly',
        'delicious', 'fresh', 'homemade', 'traditional', 'cultural',
        'historic', 'scenic', 'beautiful', 'peaceful', 'relaxing',
        'educational', 'informative', 'helpful', 'recommended', 'favorite'
      ],
      negative: [
        'fake', 'spam', 'scam', 'suspicious', 'doubtful',
        'generic', 'copy-paste', 'template', 'automated', 'bot'
      ]
    };

    // Image quality thresholds
    this.imageQualityThresholds = {
      minSize: 50 * 1024, // 50KB minimum
      maxSize: 10 * 1024 * 1024, // 10MB maximum
      minDimensions: { width: 200, height: 200 },
      maxDimensions: { width: 4000, height: 4000 },
      allowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
      suspiciousPatterns: [
        'stock_photo', 'generic', 'template', 'placeholder',
        'watermark', 'copyright', 'commercial', 'advertisement'
      ]
    };

    // Description quality scoring weights
    this.descriptionWeights = {
      length: 0.2,
      uniqueness: 0.3,
      detail: 0.25,
      relevance: 0.15,
      grammar: 0.1
    };
  }

  /**
   * Analyze content quality for a location
   * @param {Object} locationData - Location data to analyze
   * @param {Object} userData - User data for context
   * @returns {Object} Quality analysis results
   */
  async analyzeContentQuality(locationData, userData = {}) {
    try {
      // Add null check for locationData
      if (!locationData) {
        console.warn('⚠️ Content quality: locationData is undefined, returning safe default');
        return {
          overallScore: 0,
          spamScore: 0,
          imageQuality: { score: 0, issues: [] },
          descriptionQuality: { score: 0, issues: [] },
          contentValidation: { passed: false, issues: ['NO_LOCATION_DATA'] },
          recommendations: ['Please provide valid location data'],
          riskLevel: 'HIGH',
          flags: ['NO_LOCATION_DATA']
        };
      }

      console.log('🔍 Starting content quality analysis for location:', locationData.name || 'Unknown');

      const analysis = {
        overallScore: 0,
        spamScore: 0,
        imageQuality: { score: 0, issues: [] },
        descriptionQuality: { score: 0, issues: [] },
        contentValidation: { passed: true, issues: [] },
        recommendations: [],
        riskLevel: 'LOW',
        flags: []
      };

      // 1. Keyword filtering for spam detection
      const spamAnalysis = this.detectSpamKeywords(locationData);
      analysis.spamScore = spamAnalysis.score;
      analysis.flags.push(...spamAnalysis.flags);

      // 2. Image quality analysis
      if (locationData.images && locationData.images.length > 0) {
        const imageAnalysis = this.analyzeImageQuality(locationData.images);
        analysis.imageQuality = imageAnalysis;
        analysis.flags.push(...imageAnalysis.flags || []);
      }

      // 3. Description quality scoring
      const descriptionText = locationData.description || locationData.text || '';
      if (descriptionText) {
        const descriptionAnalysis = this.analyzeDescriptionQuality(descriptionText);
        analysis.descriptionQuality = descriptionAnalysis;
        analysis.flags.push(...descriptionAnalysis.flags || []);
      }

      // 4. Content validation
      const validationResult = this.validateContent(locationData);
      analysis.contentValidation = validationResult;
      analysis.flags.push(...validationResult.flags || []);

      // 5. Calculate overall quality score
      analysis.overallScore = this.calculateOverallScore(analysis);

      // 6. Determine risk level
      analysis.riskLevel = this.determineRiskLevel(analysis);

      // 7. Generate recommendations
      analysis.recommendations = this.generateRecommendations(analysis);

      console.log('✅ Content quality analysis completed. Score:', analysis.overallScore);
      return analysis;

    } catch (error) {
      console.error('❌ Error in content quality analysis:', error);
      throw new Error('Content quality analysis failed: ' + error.message);
    }
  }

  /**
   * Detect spam keywords in content
   * @param {Object} locationData - Location data
   * @returns {Object} Spam analysis results
   */
  detectSpamKeywords(locationData) {
    // Add null check for locationData
    if (!locationData) {
      console.warn('⚠️ Content quality: locationData is undefined, returning safe default');
      return {
        score: 0,
        foundKeywords: [],
        flags: ['NO_LOCATION_DATA']
      };
    }

    const content = [
      locationData.name || '',
      locationData.description || '',
      locationData.text || '', // Handle frontend field name
      locationData.keywords || ''
    ].join(' ').toLowerCase();

    const foundKeywords = [];
    let spamScore = 0;

    // Check for spam keywords
    this.spamKeywords.forEach(keyword => {
      if (content.includes(keyword.toLowerCase())) {
        foundKeywords.push(keyword);
        spamScore += 10; // Each spam keyword adds 10 points
      }
    });

    // Check for suspicious patterns
    const suspiciousPatterns = [
      /(buy|sell|money|cash|earn|profit)/gi,
      /(click|visit|website|url|link)/gi,
      /(free|100%|guaranteed|limited)/gi,
      /(urgent|emergency|act now|don't miss)/gi
    ];

    suspiciousPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        spamScore += matches.length * 2;
      }
    });

    // Check for excessive repetition
    const words = content.split(/\s+/);
    const wordCount = {};
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });

    Object.values(wordCount).forEach(count => {
      if (count > 5) {
        spamScore += (count - 5) * 2;
      }
    });

    return {
      score: Math.min(spamScore, 100),
      foundKeywords,
      flags: foundKeywords.length > 0 ? ['SPAM_KEYWORDS_DETECTED'] : []
    };
  }

  /**
   * Analyze image quality
   * @param {Array} images - Array of image data
   * @returns {Object} Image quality analysis
   */
  analyzeImageQuality(images) {
    const analysis = {
      score: 100,
      issues: [],
      flags: [],
      totalImages: images.length,
      validImages: 0
    };

    images.forEach((image, index) => {
      const imageIssues = [];

      // Check file size
      if (image.size < this.imageQualityThresholds.minSize) {
        imageIssues.push('Image too small');
        analysis.score -= 15;
      } else if (image.size > this.imageQualityThresholds.maxSize) {
        imageIssues.push('Image too large');
        analysis.score -= 10;
      }

      // Check file format
      const fileExtension = image.filename ? 
        image.filename.split('.').pop().toLowerCase() : 
        image.mimetype ? image.mimetype.split('/')[1] : null;

      if (!this.imageQualityThresholds.allowedFormats.includes(fileExtension)) {
        imageIssues.push('Invalid file format');
        analysis.score -= 20;
      }

      // Check for suspicious patterns in filename
      if (image.filename) {
        const suspiciousPattern = this.imageQualityThresholds.suspiciousPatterns.find(
          pattern => image.filename.toLowerCase().includes(pattern)
        );
        if (suspiciousPattern) {
          imageIssues.push('Suspicious filename pattern');
          analysis.score -= 25;
          analysis.flags.push('SUSPICIOUS_IMAGE_FILENAME');
        }
      }

      // Check dimensions if available
      if (image.width && image.height) {
        if (image.width < this.imageQualityThresholds.minDimensions.width ||
            image.height < this.imageQualityThresholds.minDimensions.height) {
          imageIssues.push('Image dimensions too small');
          analysis.score -= 10;
        } else if (image.width > this.imageQualityThresholds.maxDimensions.width ||
                   image.height > this.imageQualityThresholds.maxDimensions.height) {
          imageIssues.push('Image dimensions too large');
          analysis.score -= 5;
        }
      }

      if (imageIssues.length === 0) {
        analysis.validImages++;
      } else {
        analysis.issues.push({
          imageIndex: index,
          issues: imageIssues
        });
      }
    });

    // Adjust score based on valid images ratio
    const validRatio = analysis.validImages / analysis.totalImages;
    analysis.score = Math.max(0, analysis.score * validRatio);

    if (analysis.validImages === 0) {
      analysis.flags.push('NO_VALID_IMAGES');
    }

    return analysis;
  }

  /**
   * Analyze description quality
   * @param {string} description - Location description
   * @returns {Object} Description quality analysis
   */
  analyzeDescriptionQuality(description) {
    const analysis = {
      score: 100,
      issues: [],
      flags: [],
      metrics: {
        length: 0,
        uniqueness: 0,
        detail: 0,
        relevance: 0,
        grammar: 0
      }
    };

    if (!description || description.trim().length === 0) {
      analysis.score = 0;
      analysis.issues.push('No description provided');
      analysis.flags.push('NO_DESCRIPTION');
      return analysis;
    }

    const words = description.trim().split(/\s+/);
    const wordCount = words.length;
    const charCount = description.length;

    // Length scoring (0-100)
    if (wordCount < 5) {
      analysis.metrics.length = 20;
      analysis.issues.push('Description too short');
    } else if (wordCount < 10) {
      analysis.metrics.length = 50;
    } else if (wordCount < 20) {
      analysis.metrics.length = 80;
    } else if (wordCount < 50) {
      analysis.metrics.length = 100;
    } else {
      analysis.metrics.length = 90; // Slightly penalize very long descriptions
    }

    // Uniqueness scoring
    const uniqueWords = new Set(words.map(word => word.toLowerCase()));
    const uniquenessRatio = uniqueWords.size / wordCount;
    analysis.metrics.uniqueness = Math.round(uniquenessRatio * 100);

    if (uniquenessRatio < 0.5) {
      analysis.issues.push('Low word variety');
      analysis.flags.push('LOW_UNIQUENESS');
    }

    // Detail scoring (based on descriptive words)
    const descriptiveWords = words.filter(word => 
      word.length > 6 || 
      /[a-z]{3,}/i.test(word)
    ).length;
    analysis.metrics.detail = Math.min(100, (descriptiveWords / wordCount) * 200);

    // Relevance scoring (check for quality indicators)
    const positiveMatches = this.qualityIndicators.positive.filter(
      indicator => description.toLowerCase().includes(indicator)
    ).length;
    const negativeMatches = this.qualityIndicators.negative.filter(
      indicator => description.toLowerCase().includes(indicator)
    ).length;

    analysis.metrics.relevance = Math.max(0, 50 + (positiveMatches * 10) - (negativeMatches * 20));

    // Basic grammar scoring (simple checks)
    const sentences = description.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgSentenceLength = sentences.reduce((sum, sentence) => 
      sum + sentence.trim().split(/\s+/).length, 0) / sentences.length;

    if (avgSentenceLength >= 5 && avgSentenceLength <= 25) {
      analysis.metrics.grammar = 80;
    } else if (avgSentenceLength > 0) {
      analysis.metrics.grammar = 40;
    } else {
      analysis.metrics.grammar = 0;
    }

    // Calculate weighted score
    analysis.score = Math.round(
      analysis.metrics.length * this.descriptionWeights.length +
      analysis.metrics.uniqueness * this.descriptionWeights.uniqueness +
      analysis.metrics.detail * this.descriptionWeights.detail +
      analysis.metrics.relevance * this.descriptionWeights.relevance +
      analysis.metrics.grammar * this.descriptionWeights.grammar
    );

    // Add flags for poor quality
    if (analysis.score < 30) {
      analysis.flags.push('POOR_DESCRIPTION_QUALITY');
    }

    return analysis;
  }

  /**
   * Validate content for basic requirements
   * @param {Object} locationData - Location data
   * @returns {Object} Validation results
   */
  validateContent(locationData) {
    const validation = {
      passed: true,
      issues: [],
      flags: []
    };

    // Check required fields
    if (!locationData.name || locationData.name.trim().length === 0) {
      validation.issues.push('Location name is required');
      validation.passed = false;
    }

    const descriptionText = locationData.description || locationData.text || '';
    if (!descriptionText || descriptionText.trim().length === 0) {
      validation.issues.push('Location description is required');
      validation.passed = false;
    }

    // Check content length limits
    if (locationData.name && locationData.name.length > 100) {
      validation.issues.push('Location name too long (max 100 characters)');
      validation.passed = false;
    }

    if (descriptionText && descriptionText.length > 1000) {
      validation.issues.push('Description too long (max 1000 characters)');
      validation.passed = false;
    }

    // Check for excessive capitalization
    if (locationData.name && locationData.name.match(/[A-Z]{5,}/)) {
      validation.issues.push('Excessive capitalization in name');
      validation.flags.push('EXCESSIVE_CAPITALIZATION');
    }

    // Check for suspicious patterns
    if (descriptionText) {
      const suspiciousPatterns = [
        /\b[A-Z]{3,}\b/g, // ALL CAPS words
        /!{3,}/g, // Multiple exclamation marks
        /\?{3,}/g, // Multiple question marks
        /\.{3,}/g  // Multiple dots
      ];

      suspiciousPatterns.forEach(pattern => {
        if (pattern.test(descriptionText)) {
          validation.issues.push('Suspicious text patterns detected');
          validation.flags.push('SUSPICIOUS_TEXT_PATTERNS');
        }
      });
    }

    return validation;
  }

  /**
   * Calculate overall quality score
   * @param {Object} analysis - Analysis results
   * @returns {number} Overall score (0-100)
   */
  calculateOverallScore(analysis) {
    let score = 100;

    // Reduce score based on spam detection
    score -= analysis.spamScore * 0.5;

    // Reduce score based on image quality
    score -= (100 - analysis.imageQuality.score) * 0.2;

    // Reduce score based on description quality
    score -= (100 - analysis.descriptionQuality.score) * 0.3;

    // Reduce score for validation issues
    if (!analysis.contentValidation.passed) {
      score -= 30;
    }

    // Reduce score for each flag
    score -= analysis.flags.length * 5;

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Determine risk level based on analysis
   * @param {Object} analysis - Analysis results
   * @returns {string} Risk level
   */
  determineRiskLevel(analysis) {
    if (analysis.overallScore >= 80 && analysis.spamScore < 20) {
      return 'LOW';
    } else if (analysis.overallScore >= 60 && analysis.spamScore < 40) {
      return 'MEDIUM';
    } else if (analysis.overallScore >= 40 && analysis.spamScore < 60) {
      return 'HIGH';
    } else {
      return 'CRITICAL';
    }
  }

  /**
   * Generate recommendations based on analysis
   * @param {Object} analysis - Analysis results
   * @returns {Array} Recommendations
   */
  generateRecommendations(analysis) {
    const recommendations = [];

    if (analysis.spamScore > 30) {
      recommendations.push('Remove spam keywords from content');
    }

    if (analysis.imageQuality.score < 70) {
      recommendations.push('Improve image quality or add better photos');
    }

    if (analysis.descriptionQuality.score < 60) {
      recommendations.push('Enhance location description with more details');
    }

    if (analysis.contentValidation.issues.length > 0) {
      recommendations.push('Fix content validation issues');
    }

    if (analysis.flags.includes('NO_DESCRIPTION')) {
      recommendations.push('Add a detailed description of the location');
    }

    if (analysis.flags.includes('LOW_UNIQUENESS')) {
      recommendations.push('Use more varied and descriptive language');
    }

    if (analysis.overallScore < 50) {
      recommendations.push('Overall content quality needs significant improvement');
    }

    return recommendations;
  }

  /**
   * Get content quality statistics
   * @param {string} timeRange - Time range for stats
   * @returns {Object} Statistics
   */
  async getContentQualityStats(timeRange = '7d') {
    try {
      const timeRanges = {
        '1d': 1,
        '7d': 7,
        '30d': 30,
        '90d': 90
      };

      const days = timeRanges[timeRange] || 7;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const locations = await Location.findAll({
        where: {
          createdAt: {
            [Op.gte]: startDate
          }
        },
        attributes: ['id', 'content', 'createdAt']
      });

      const stats = {
        totalLocations: locations.length,
        averageQualityScore: 0,
        spamDetections: 0,
        qualityIssues: 0,
        riskLevels: {
          LOW: 0,
          MEDIUM: 0,
          HIGH: 0,
          CRITICAL: 0
        }
      };

      // Analyze each location
      for (const location of locations) {
        const content = location.content || {};
        const analysis = await this.analyzeContentQuality({
          name: content.text || '',
          description: content.text || ''
        });

        stats.averageQualityScore += analysis.overallScore;
        
        if (analysis.spamScore > 30) {
          stats.spamDetections++;
        }

        if (analysis.overallScore < 60) {
          stats.qualityIssues++;
        }

        stats.riskLevels[analysis.riskLevel]++;
      }

      if (locations.length > 0) {
        stats.averageQualityScore = Math.round(stats.averageQualityScore / locations.length);
      }

      return stats;

    } catch (error) {
      console.error('❌ Error getting content quality stats:', error);
      throw new Error('Failed to get content quality statistics');
    }
  }

  /**
   * Update content quality thresholds
   * @param {Object} newThresholds - New threshold values
   */
  updateThresholds(newThresholds) {
    if (newThresholds.spamKeywords) {
      this.spamKeywords = [...this.spamKeywords, ...newThresholds.spamKeywords];
    }

    if (newThresholds.imageQuality) {
      Object.assign(this.imageQualityThresholds, newThresholds.imageQuality);
    }

    if (newThresholds.descriptionWeights) {
      Object.assign(this.descriptionWeights, newThresholds.descriptionWeights);
    }

    console.log('⚙️ Content quality thresholds updated');
  }

  /**
   * Get current thresholds
   * @returns {Object} Current threshold values
   */
  getThresholds() {
    return {
      spamKeywords: this.spamKeywords,
      imageQualityThresholds: this.imageQualityThresholds,
      descriptionWeights: this.descriptionWeights,
      qualityIndicators: this.qualityIndicators
    };
  }
}

module.exports = new ContentQualityService(); 