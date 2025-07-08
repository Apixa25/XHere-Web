const moment = require('moment');
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const models = require('../models');
const Location = models.Location;
const User = models.User;

class BehavioralAnalysisService {
  constructor() {
    
    // Behavioral thresholds
    this.thresholds = {
      rapidPosting: {
        maxPostsPerHour: 5,
        maxPostsPerDay: 20,
        minTimeBetweenPosts: 300000 // 5 minutes in milliseconds
      },
      suspiciousPatterns: {
        maxSimilarTextRatio: 0.8,
        maxCoordinateClustering: 0.7,
        maxAnonymousRatio: 0.5
      },
      behaviorScoring: {
        lowRiskThreshold: 30,
        mediumRiskThreshold: 60,
        highRiskThreshold: 80
      }
    };
  }

  /**
   * Analyze user behavior patterns for spam detection
   */
  async analyzeUserBehavior(userId, locationData = null) {
    console.log('🔍 Starting behavioral analysis for user:', userId);
    
    // Check if userId is valid
    if (!userId || userId === 'undefined' || userId === undefined) {
      console.log('🔍 No valid userId provided, returning safe default analysis');
      return {
        userId: userId || 'unknown',
        timestamp: new Date(),
        riskScore: 0,
        riskLevel: 'low',
        flags: [],
        patterns: {},
        recommendations: [],
        isSuspicious: false
      };
    }
    
    try {
      const analysis = {
        userId,
        timestamp: new Date(),
        riskScore: 0,
        riskLevel: 'low',
        flags: [],
        patterns: {},
        recommendations: [],
        isSuspicious: false
      };

      // 1. Analyze posting patterns and timing
      const postingPatterns = await this.analyzePostingPatterns(userId);
      analysis.patterns.posting = postingPatterns;
      
      // 2. Detect suspicious activity
      const suspiciousActivity = await this.detectSuspiciousActivity(userId, locationData);
      analysis.flags.push(...suspiciousActivity.flags);
      
      // 3. Calculate behavior score
      const behaviorScore = await this.calculateBehaviorScore(userId, analysis);
      analysis.riskScore = behaviorScore.score;
      analysis.riskLevel = behaviorScore.level;
      
      // 4. Generate recommendations
      analysis.recommendations = this.generateBehaviorRecommendations(analysis);
      
      // 5. Determine if user is suspicious
      analysis.isSuspicious = analysis.riskScore >= this.thresholds.behaviorScoring.highRiskThreshold;
      
      // 6. Log behavioral analysis
      await this.logBehavioralAnalysis(analysis);
      
      console.log('✅ Behavioral analysis completed:', {
        userId,
        riskScore: analysis.riskScore,
        riskLevel: analysis.riskLevel,
        flags: analysis.flags.length,
        isSuspicious: analysis.isSuspicious
      });
      
      return analysis;
      
    } catch (error) {
      console.error('❌ Error in behavioral analysis:', error);
      throw error;
    }
  }

  /**
   * Analyze user posting patterns and timing
   */
  async analyzePostingPatterns(userId) {
    const patterns = {
      totalPosts: 0,
      postsToday: 0,
      postsThisHour: 0,
      postsThisWeek: 0,
      averageTimeBetweenPosts: 0,
      postingFrequency: 'normal',
      timeDistribution: {},
      locationDistribution: {},
      contentPatterns: {}
    };

    try {
      // Get user's posting history using Sequelize
      const posts = await Location.findAll({
        where: {
          creatorId: userId
        },
        order: [['createdAt', 'DESC']],
        limit: 100,
        include: [{
          model: User,
          as: 'creator',
          attributes: ['id', 'email', 'profile']
        }]
      });
      
      if (posts.length === 0) {
        return patterns;
      }

      patterns.totalPosts = posts.length;
      
      // Calculate time-based patterns
      const now = moment();
      const oneHourAgo = moment().subtract(1, 'hour');
      const oneDayAgo = moment().subtract(1, 'day');
      const oneWeekAgo = moment().subtract(1, 'week');
      
      // Count posts in different time periods
      patterns.postsToday = posts.filter(post => 
        moment(post.createdAt).isAfter(oneDayAgo)
      ).length;
      
      patterns.postsThisHour = posts.filter(post => 
        moment(post.createdAt).isAfter(oneHourAgo)
      ).length;
      
      patterns.postsThisWeek = posts.filter(post => 
        moment(post.createdAt).isAfter(oneWeekAgo)
      ).length;

      // Calculate average time between posts
      if (posts.length > 1) {
        const timeDifferences = [];
        for (let i = 0; i < posts.length - 1; i++) {
          const timeDiff = moment(posts[i].createdAt).diff(moment(posts[i + 1].createdAt));
          timeDifferences.push(timeDiff);
        }
        patterns.averageTimeBetweenPosts = timeDifferences.reduce((sum, diff) => sum + diff, 0) / timeDifferences.length;
      }

      // Analyze posting frequency
      patterns.postingFrequency = this.calculatePostingFrequency(patterns);
      
      // Analyze time distribution (hour of day)
      patterns.timeDistribution = this.analyzeTimeDistribution(posts);
      
      // Analyze location distribution
      patterns.locationDistribution = this.analyzeLocationDistribution(posts);
      
      // Analyze content patterns
      patterns.contentPatterns = this.analyzeContentPatterns(posts);

      return patterns;
      
    } catch (error) {
      console.error('Error analyzing posting patterns:', error);
      return patterns;
    }
  }

  /**
   * Detect suspicious activity patterns
   */
  async detectSuspiciousActivity(userId, locationData = null) {
    const suspiciousActivity = {
      flags: [],
      patterns: {},
      riskFactors: []
    };

    try {
      // 1. Check for rapid posting
      const rapidPostingFlags = await this.checkRapidPosting(userId);
      suspiciousActivity.flags.push(...rapidPostingFlags);
      
      // 2. Check for coordinate clustering
      const clusteringFlags = await this.checkCoordinateClustering(userId);
      suspiciousActivity.flags.push(...clusteringFlags);
      
      // 3. Check for content similarity
      const contentFlags = await this.checkContentSimilarity(userId);
      suspiciousActivity.flags.push(...contentFlags);
      
      // 4. Check for anonymous posting patterns
      const anonymousFlags = await this.checkAnonymousPostingPatterns(userId);
      suspiciousActivity.flags.push(...anonymousFlags);
      
      // 5. Check for location type patterns
      const typeFlags = await this.checkLocationTypePatterns(userId);
      suspiciousActivity.flags.push(...typeFlags);
      
      // 6. Check for timing patterns
      const timingFlags = await this.checkTimingPatterns(userId);
      suspiciousActivity.flags.push(...timingFlags);
      
      // 7. Check for account age patterns
      const accountFlags = await this.checkAccountAgePatterns(userId);
      suspiciousActivity.flags.push(...accountFlags);

      return suspiciousActivity;
      
    } catch (error) {
      console.error('Error detecting suspicious activity:', error);
      return suspiciousActivity;
    }
  }

  /**
   * Check for rapid posting behavior
   */
  async checkRapidPosting(userId) {
    const flags = [];
    
    try {
      // Use Sequelize instead of direct PostgreSQL queries
      const recentPosts = await Location.findAll({
        where: {
          creatorId: userId,
          createdAt: {
            [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        },
        order: [['createdAt', 'DESC']],
        attributes: ['createdAt']
      });
      
      if (recentPosts.length === 0) {
        return flags;
      }

      // Check hourly posting rate
      const hourlyPosts = recentPosts.filter(post => 
        moment(post.createdAt).isAfter(moment().subtract(1, 'hour'))
      ).length;
      
      if (hourlyPosts > this.thresholds.rapidPosting.maxPostsPerHour) {
        flags.push({
          type: 'rapid_posting_hourly',
          severity: 'high',
          description: `User posted ${hourlyPosts} times in the last hour (limit: ${this.thresholds.rapidPosting.maxPostsPerHour})`,
          value: hourlyPosts,
          threshold: this.thresholds.rapidPosting.maxPostsPerHour
        });
      }

      // Check daily posting rate
      const dailyPosts = recentPosts.length;
      if (dailyPosts > this.thresholds.rapidPosting.maxPostsPerDay) {
        flags.push({
          type: 'rapid_posting_daily',
          severity: 'medium',
          description: `User posted ${dailyPosts} times in the last 24 hours (limit: ${this.thresholds.rapidPosting.maxPostsPerDay})`,
          value: dailyPosts,
          threshold: this.thresholds.rapidPosting.maxPostsPerDay
        });
      }

      // Check time between posts
      for (let i = 0; i < recentPosts.length - 1; i++) {
        const timeDiff = moment(recentPosts[i].createdAt).diff(moment(recentPosts[i + 1].createdAt));
        if (timeDiff < this.thresholds.rapidPosting.minTimeBetweenPosts) {
          flags.push({
            type: 'rapid_posting_timing',
            severity: 'medium',
            description: `Posts made too quickly (${Math.round(timeDiff / 1000)}s apart, minimum: ${this.thresholds.rapidPosting.minTimeBetweenPosts / 1000}s)`,
            value: timeDiff,
            threshold: this.thresholds.rapidPosting.minTimeBetweenPosts
          });
        }
      }

      return flags;
      
    } catch (error) {
      console.error('Error checking rapid posting:', error);
      return flags;
    }
  }

  /**
   * Check for coordinate clustering patterns
   */
  async checkCoordinateClustering(userId) {
    const flags = [];
    
    try {
      // Use Sequelize instead of direct PostgreSQL queries
      const locations = await Location.findAll({
        where: {
          creatorId: userId,
          createdAt: {
            [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        },
        attributes: ['location']
      });
      
      if (locations.length < 3) {
        return flags;
      }

      // Calculate clustering score
      const clusteringScore = this.calculateCoordinateClustering(locations);
      
      if (clusteringScore > this.thresholds.suspiciousPatterns.maxCoordinateClustering) {
        flags.push({
          type: 'coordinate_clustering',
          severity: 'medium',
          description: `High coordinate clustering detected (score: ${clusteringScore.toFixed(2)})`,
          value: clusteringScore,
          threshold: this.thresholds.suspiciousPatterns.maxCoordinateClustering
        });
      }

      return flags;
      
    } catch (error) {
      console.error('Error checking coordinate clustering:', error);
      return flags;
    }
  }

  /**
   * Check for content similarity patterns
   */
  async checkContentSimilarity(userId) {
    const flags = [];
    
    try {
      // Use Sequelize instead of direct PostgreSQL queries
      const contents = await Location.findAll({
        where: {
          creatorId: userId,
          createdAt: {
            [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        },
        order: [['createdAt', 'DESC']],
        limit: 20,
        attributes: ['content']
      });
      
      if (contents.length < 2) {
        return flags;
      }

      // Calculate text similarity between recent posts
      let similarTextCount = 0;
      let totalComparisons = 0;
      
      for (let i = 0; i < contents.length; i++) {
        for (let j = i + 1; j < contents.length; j++) {
          const similarity = this.calculateTextSimilarity(
            contents[i].content.text,
            contents[j].content.text
          );
          
          if (similarity > this.thresholds.suspiciousPatterns.maxSimilarTextRatio) {
            similarTextCount++;
          }
          totalComparisons++;
        }
      }
      
      const similarityRatio = totalComparisons > 0 ? similarTextCount / totalComparisons : 0;
      
      if (similarityRatio > 0.3) { // If more than 30% of comparisons are similar
        flags.push({
          type: 'content_similarity',
          severity: 'medium',
          description: `High content similarity detected (${(similarityRatio * 100).toFixed(1)}% similar posts)`,
          value: similarityRatio,
          threshold: 0.3
        });
      }

      return flags;
      
    } catch (error) {
      console.error('Error checking content similarity:', error);
      return flags;
    }
  }

  /**
   * Check for anonymous posting patterns
   */
  async checkAnonymousPostingPatterns(userId) {
    const flags = [];
    
    try {
      // Use Sequelize instead of direct PostgreSQL queries
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      const totalPosts = await Location.count({
        where: {
          creatorId: userId,
          createdAt: {
            [Op.gte]: thirtyDaysAgo
          }
        }
      });
      
      // Check if isAnonymous column exists, if not, use content->>'isAnonymous'
      const anonymousPosts = await Location.count({
        where: {
          creatorId: userId,
          createdAt: {
            [Op.gte]: thirtyDaysAgo
          },
          content: sequelize.literal(`content->>'isAnonymous' = 'true'`)
        }
      });
      
      const stats = {
        total_posts: totalPosts,
        anonymous_posts: anonymousPosts
      };
      
      if (stats.total_posts > 0) {
        const anonymousRatio = stats.anonymous_posts / stats.total_posts;
        
        if (anonymousRatio > this.thresholds.suspiciousPatterns.maxAnonymousRatio) {
          flags.push({
            type: 'high_anonymous_posting',
            severity: 'medium',
            description: `High ratio of anonymous posts (${(anonymousRatio * 100).toFixed(1)}%)`,
            value: anonymousRatio,
            threshold: this.thresholds.suspiciousPatterns.maxAnonymousRatio
          });
        }
      }

      return flags;
      
    } catch (error) {
      console.error('Error checking anonymous posting patterns:', error);
      return flags;
    }
  }

  /**
   * Check for location type patterns
   */
  async checkLocationTypePatterns(userId) {
    const flags = [];
    
    try {
      // Use Sequelize instead of direct PostgreSQL queries
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      const typeStats = await Location.findAll({
        where: {
          creatorId: userId,
          createdAt: {
            [Op.gte]: thirtyDaysAgo
          }
        },
        attributes: [
          'locationType',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['locationType'],
        order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']]
      });
      
      if (typeStats.length > 0) {
        const totalPosts = typeStats.reduce((sum, stat) => sum + parseInt(stat.dataValues.count), 0);
        const mostCommonType = typeStats[0];
        const typeRatio = mostCommonType.dataValues.count / totalPosts;
        
        if (typeRatio > 0.8) { // If more than 80% of posts are the same type
          flags.push({
            type: 'location_type_monotony',
            severity: 'low',
            description: `User posts mostly ${mostCommonType.dataValues.locationType} locations (${(typeRatio * 100).toFixed(1)}%)`,
            value: typeRatio,
            threshold: 0.8
          });
        }
      }

      return flags;
      
    } catch (error) {
      console.error('Error checking location type patterns:', error);
      return flags;
    }
  }

  /**
   * Check for suspicious timing patterns
   */
  async checkTimingPatterns(userId) {
    const flags = [];
    
    try {
      // Use Sequelize instead of direct PostgreSQL queries
      const posts = await Location.findAll({
        where: {
          creatorId: userId,
          createdAt: {
            [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        },
        order: [['createdAt', 'ASC']],
        attributes: ['createdAt']
      });
      
      if (posts.length < 3) {
        return flags;
      }

      // Check for regular intervals (bot-like behavior)
      const intervals = [];
      for (let i = 1; i < posts.length; i++) {
        const interval = moment(posts[i].createdAt).diff(moment(posts[i - 1].createdAt));
        intervals.push(interval);
      }
      
      // Check if intervals are too regular (within 10% of each other)
      if (intervals.length > 2) {
        const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
        const regularIntervals = intervals.filter(interval => 
          Math.abs(interval - avgInterval) / avgInterval < 0.1
        );
        
        if (regularIntervals.length / intervals.length > 0.7) {
          flags.push({
            type: 'regular_posting_intervals',
            severity: 'medium',
            description: 'Posts made at suspiciously regular intervals (possible automated behavior)',
            value: regularIntervals.length / intervals.length,
            threshold: 0.7
          });
        }
      }

      return flags;
      
    } catch (error) {
      console.error('Error checking timing patterns:', error);
      return flags;
    }
  }

  /**
   * Check for account age patterns
   */
  async checkAccountAgePatterns(userId) {
    const flags = [];
    
    try {
      // Use Sequelize instead of direct PostgreSQL queries
      const user = await User.findByPk(userId, {
        attributes: ['createdAt']
      });
      
      if (!user) {
        return flags;
      }
      
      const totalPosts = await Location.count({
        where: {
          creatorId: userId
        }
      });
      
      const userStats = {
        account_created: user.createdAt,
        total_posts: totalPosts
      };
      
      if (userStats) {
        const accountAge = moment().diff(moment(userStats.account_created), 'days');
        const postsPerDay = userStats.total_posts / Math.max(accountAge, 1);
        
        if (accountAge < 7 && postsPerDay > 5) {
          flags.push({
            type: 'new_account_high_activity',
            severity: 'medium',
            description: `New account (${accountAge} days) with high posting activity (${postsPerDay.toFixed(1)} posts/day)`,
            value: postsPerDay,
            threshold: 5
          });
        }
      }

      return flags;
      
    } catch (error) {
      console.error('Error checking account age patterns:', error);
      return flags;
    }
  }

  /**
   * Calculate comprehensive behavior score
   */
  async calculateBehaviorScore(userId, analysis) {
    let score = 0;
    let riskFactors = [];
    
    try {
      // Base score from flags
      analysis.flags.forEach(flag => {
        let flagScore = 0;
        
        switch (flag.severity) {
          case 'high':
            flagScore = 25;
            break;
          case 'medium':
            flagScore = 15;
            break;
          case 'low':
            flagScore = 5;
            break;
        }
        
        score += flagScore;
        riskFactors.push({
          type: flag.type,
          severity: flag.severity,
          score: flagScore,
          description: flag.description
        });
      });

      // Additional scoring based on patterns
      if (analysis.patterns.posting) {
        const patterns = analysis.patterns.posting;
        
        // Rapid posting penalty
        if (patterns.postsThisHour > this.thresholds.rapidPosting.maxPostsPerHour) {
          score += 20;
          riskFactors.push({
            type: 'rapid_posting',
            severity: 'high',
            score: 20,
            description: `High hourly posting rate: ${patterns.postsThisHour} posts/hour`
          });
        }
        
        // Daily posting penalty
        if (patterns.postsToday > this.thresholds.rapidPosting.maxPostsPerDay) {
          score += 15;
          riskFactors.push({
            type: 'high_daily_posts',
            severity: 'medium',
            score: 15,
            description: `High daily posting rate: ${patterns.postsToday} posts/day`
          });
        }
        
        // Anonymous posting penalty
        if (patterns.contentPatterns.anonymousRatio > this.thresholds.suspiciousPatterns.maxAnonymousRatio) {
          score += 10;
          riskFactors.push({
            type: 'high_anonymous_ratio',
            severity: 'medium',
            score: 10,
            description: `High anonymous posting ratio: ${(patterns.contentPatterns.anonymousRatio * 100).toFixed(1)}%`
          });
        }
      }

      // Determine risk level
      let level = 'low';
      if (score >= this.thresholds.behaviorScoring.highRiskThreshold) {
        level = 'high';
      } else if (score >= this.thresholds.behaviorScoring.mediumRiskThreshold) {
        level = 'medium';
      }

      return {
        score: Math.min(score, 100),
        level,
        riskFactors
      };
      
    } catch (error) {
      console.error('Error calculating behavior score:', error);
      return {
        score: 0,
        level: 'low',
        riskFactors: []
      };
    }
  }

  /**
   * Generate behavioral recommendations
   */
  generateBehaviorRecommendations(analysis) {
    const recommendations = [];
    
    if (analysis.riskScore >= this.thresholds.behaviorScoring.highRiskThreshold) {
      recommendations.push({
        type: 'high_risk_user',
        priority: 'high',
        message: 'User shows multiple suspicious behavior patterns. Consider temporary suspension.',
        actions: ['monitor_closely', 'consider_suspension', 'manual_review']
      });
    } else if (analysis.riskScore >= this.thresholds.behaviorScoring.mediumRiskThreshold) {
      recommendations.push({
        type: 'medium_risk_user',
        priority: 'medium',
        message: 'User shows some suspicious behavior patterns. Monitor activity.',
        actions: ['monitor_activity', 'flag_for_review']
      });
    }

    // Specific recommendations based on flags
    analysis.flags.forEach(flag => {
      switch (flag.type) {
        case 'rapid_posting_hourly':
          recommendations.push({
            type: 'rate_limiting',
            priority: 'medium',
            message: 'Consider implementing rate limiting for this user.',
            actions: ['implement_rate_limit', 'warn_user']
          });
          break;
          
        case 'coordinate_clustering':
          recommendations.push({
            type: 'location_verification',
            priority: 'medium',
            message: 'Verify user is physically visiting these locations.',
            actions: ['require_gps_verification', 'manual_location_check']
          });
          break;
          
        case 'content_similarity':
          recommendations.push({
            type: 'content_quality',
            priority: 'low',
            message: 'Encourage more diverse and detailed content.',
            actions: ['content_guidelines', 'quality_tips']
          });
          break;
      }
    });

    return recommendations;
  }

  /**
   * Log behavioral analysis for monitoring
   */
  async logBehavioralAnalysis(analysis) {
    try {
      // Temporarily disabled - behavioral_analysis_logs table doesn't exist yet
      console.log('📊 Behavioral analysis logged (logging disabled):', {
        userId: analysis.userId,
        riskScore: analysis.riskScore,
        riskLevel: analysis.riskLevel,
        flagsCount: analysis.flags.length,
        isSuspicious: analysis.isSuspicious
      });
      
    } catch (error) {
      console.error('Error logging behavioral analysis:', error);
    }
  }

  /**
   * Get behavioral statistics for monitoring dashboard
   */
  async getBehavioralStats(timeRange = '7d') {
    try {
      // Temporarily disabled - behavioral_analysis_logs table doesn't exist yet
      console.log('📊 Getting behavioral stats (disabled):', timeRange);
      return {
        total_analyses: 0,
        avg_risk_score: 0,
        suspicious_users: 0,
        high_risk_users: 0,
        medium_risk_users: 0,
        low_risk_users: 0
      };
      
    } catch (error) {
      console.error('Error getting behavioral stats:', error);
      return null;
    }
  }

  /**
   * Get suspicious users for monitoring
   */
  async getSuspiciousUsers(limit = 20) {
    try {
      // Temporarily disabled - behavioral_analysis_logs table doesn't exist yet
      console.log('🚨 Getting suspicious users (disabled):', limit);
      return [];
      
    } catch (error) {
      console.error('Error getting suspicious users:', error);
      return [];
    }
  }

  // Helper methods
  calculatePostingFrequency(patterns) {
    if (patterns.postsThisHour > this.thresholds.rapidPosting.maxPostsPerHour) {
      return 'very_high';
    } else if (patterns.postsToday > this.thresholds.rapidPosting.maxPostsPerDay) {
      return 'high';
    } else if (patterns.postsToday > 10) {
      return 'moderate';
    } else {
      return 'normal';
    }
  }

  analyzeTimeDistribution(posts) {
    const hourCounts = {};
    posts.forEach(post => {
      const hour = moment(post.createdAt).hour();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    return hourCounts;
  }

  analyzeLocationDistribution(posts) {
    const locationCounts = {};
    posts.forEach(post => {
      const locationType = post.locationType || 'unknown';
      locationCounts[locationType] = (locationCounts[locationType] || 0) + 1;
    });
    return locationCounts;
  }

  analyzeContentPatterns(posts) {
    const patterns = {
      totalPosts: posts.length,
      anonymousPosts: posts.filter(post => post.content?.isAnonymous).length,
      anonymousRatio: 0,
      averageTextLength: 0
    };
    
    if (patterns.totalPosts > 0) {
      patterns.anonymousRatio = patterns.anonymousPosts / patterns.totalPosts;
      patterns.averageTextLength = posts.reduce((sum, post) => 
        sum + (post.content?.text?.length || 0), 0) / patterns.totalPosts;
    }
    
    return patterns;
  }

  calculateCoordinateClustering(locations) {
    if (locations.length < 3) return 0;
    
    // Calculate average distance between all location pairs
    let totalDistance = 0;
    let pairCount = 0;
    
    for (let i = 0; i < locations.length; i++) {
      for (let j = i + 1; j < locations.length; j++) {
        const distance = this.calculateDistance(
          locations[i].location.coordinates[1],
          locations[i].location.coordinates[0],
          locations[j].location.coordinates[1],
          locations[j].location.coordinates[0]
        );
        totalDistance += distance;
        pairCount++;
      }
    }
    
    const avgDistance = totalDistance / pairCount;
    // Lower average distance = higher clustering
    return Math.max(0, 1 - (avgDistance / 10000)); // Normalize to 0-1
  }

  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  calculateTextSimilarity(text1, text2) {
    if (!text1 || !text2) return 0;
    
    // Simple similarity calculation (could be enhanced with more sophisticated algorithms)
    const words1 = text1.toLowerCase().split(/\s+/);
    const words2 = text2.toLowerCase().split(/\s+/);
    
    const commonWords = words1.filter(word => words2.includes(word));
    const totalWords = new Set([...words1, ...words2]).size;
    
    return totalWords > 0 ? commonWords.length / totalWords : 0;
  }
}

module.exports = new BehavioralAnalysisService(); 