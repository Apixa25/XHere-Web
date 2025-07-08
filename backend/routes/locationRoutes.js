const express = require('express');
const router = express.Router();
const Location = require('../models/Location');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');
const multer = require('multer');
const { checkAndAwardBadges } = require('../utils/badgeChecker');
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const officialLocationService = require('../services/officialLocationService');
const { validateLocationPostingCredits } = require('../middleware/credit');
const { 
  validateTrustBasedPosting, 
  checkApprovalRequirement, 
  validateDailyPostingLimit, 
  handleLocationApproval 
} = require('../middleware/trustBasedPosting');
const creditService = require('../services/creditService');
const badgeService = require('../services/badgeService');
const nominationService = require('../services/nominationService');
const duplicateDetectionService = require('../services/duplicateDetectionService');
const behavioralAnalysisService = require('../services/behavioralAnalysisService');
const contentQualityService = require('../services/contentQualityService');

// Configure multer for file uploads with better error handling
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Max 5 files
  },
  fileFilter: function (req, file, cb) {
    // Accept images and videos
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed'), false);
    }
  }
});

// Updated GET endpoint to handle both admin and user-specific queries
router.get('/', authenticateToken, async (req, res) => {
  try {
    const query = {
      include: [{
        model: User,
        as: 'creator',
        attributes: ['email', 'profile', 'id']
      }, {
        model: User,
        as: 'officialOwner',
        attributes: ['email', 'profile', 'id']
      }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(req.query.limit) || 25 // Use provided limit or default to 25
    };

    // For profile page requests, filter based on user type and userId
    if (req.query.profile === 'true') {
      if (!req.user.isAdmin) {
        query.where = { creatorId: req.user.id };
      }
      // Admin users will see all locations in their profile
      // Remove limit for profile page to show all user's locations
      delete query.limit;
    }

    // Filter by location type if specified
    if (req.query.locationType && req.query.locationType !== 'all') {
      if (!query.where) query.where = {};
      query.where.locationType = req.query.locationType;
    }

    // Filter by location status if specified
    if (req.query.status) {
      if (req.query.status !== 'all') {
        if (!query.where) query.where = {};
        query.where.locationStatus = req.query.status;
        console.log(`🔍 Filtering by status: ${req.query.status}`);
      } else {
        console.log('🌍 Showing all locations (no status filter)');
      }
    } else {
      // For map view (non-profile), only show verified locations by default
      // This prevents pending/flagged/removed locations from showing up on the map
      if (req.query.profile !== 'true') {
        if (!query.where) query.where = {};
        query.where.locationStatus = {
          [Op.in]: ['verified']
        };
        console.log('🛡️ Filtering to show only verified locations on map');
      }
    }

    // Filter by keywords if specified
    if (req.query.keywords) {
      const searchKeywords = req.query.keywords.toLowerCase().split(',').map(k => k.trim()).filter(k => k.length > 0);
      
      console.log('🔍 Keyword search requested:', searchKeywords);
      
      if (searchKeywords.length > 0) {
        if (!query.where) query.where = {};
        
        // Use a simple text search approach
        const keywordConditions = searchKeywords.map(keyword => ({
          keywords: sequelize.literal(`keywords::text ILIKE '%${keyword}%'`)
        }));
        
        query.where = {
          ...query.where,
          [Op.or]: keywordConditions
        };
        
        console.log('🔍 Keyword search query added');
      }
    }

    // Filter by user email or username if specified
    if (req.query.user) {
      const userSearch = req.query.user.trim().toLowerCase();
      
      console.log('🔍 User search requested:', userSearch);
      
      // Ensure User model is included for the search
      if (!query.include) query.include = [];
      const hasCreator = query.include.some(
        inc => inc.model === User && inc.as === 'creator'
      );
      const hasOfficialOwner = query.include.some(
        inc => inc.model === User && inc.as === 'officialOwner'
      );
      
      if (!hasCreator) {
        query.include.push({
          model: User,
          as: 'creator',
          attributes: ['email', 'profile', 'id']
        });
      }
      
      if (!hasOfficialOwner) {
        query.include.push({
          model: User,
          as: 'officialOwner',
          attributes: ['email', 'profile', 'id']
        });
      }
      
      // Add user search conditions
      if (!query.where) query.where = {};
      
      const userConditions = [
        sequelize.where(
          sequelize.fn('LOWER', sequelize.col('creator.email')),
          { [Op.like]: `%${userSearch}%` }
        ),
        sequelize.where(
          sequelize.fn('LOWER', sequelize.cast(sequelize.col('creator.profile'), 'TEXT')),
          { [Op.like]: `%${userSearch}%` }
        )
      ];
      
      // When searching by user, exclude anonymous locations to preserve anonymity
      const userSearchConditions = [
        { [Op.or]: userConditions },
        sequelize.literal(`NOT (content->>'isAnonymous')::boolean`)
      ];
      
      // If we already have conditions, combine them with AND
      if (query.where[Op.or] || query.where[Op.and]) {
        const existingConditions = query.where[Op.or] || query.where[Op.and] || [query.where];
        query.where = {
          [Op.and]: [
            { [Op.or]: existingConditions },
            { [Op.and]: userSearchConditions }
          ]
        };
      } else {
        query.where = {
          ...query.where,
          [Op.and]: userSearchConditions
        };
      }
      
      console.log('🔍 User search added (excluding anonymous locations)');
    }

    // Viewport-based filtering for map view (like Zillow)
    if (req.query.profile !== 'true' && req.query.north && req.query.south && req.query.east && req.query.west) {
      const north = parseFloat(req.query.north);
      const south = parseFloat(req.query.south);
      const east = parseFloat(req.query.east);
      const west = parseFloat(req.query.west);
      
      console.log('🗺️ Viewport filtering:', { north, south, east, west });
      
      if (!query.where) query.where = {};
      
      // Add viewport bounds filtering using PostGIS
      const viewportConditions = {
        location: {
          [Op.and]: [
            // Latitude bounds
            sequelize.literal(`ST_Y(location::geometry) BETWEEN ${south} AND ${north}`),
            // Longitude bounds  
            sequelize.literal(`ST_X(location::geometry) BETWEEN ${west} AND ${east}`)
          ]
        }
      };
      
      // Combine with existing conditions
      if (query.where[Op.and] || query.where[Op.or]) {
        const existingConditions = query.where[Op.and] || query.where[Op.or] || [query.where];
        query.where = {
          [Op.and]: [
            { [Op.or]: existingConditions },
            viewportConditions
          ]
        };
      } else {
        query.where = {
          ...query.where,
          ...viewportConditions
        };
      }
      
      // Calculate center of viewport for distance ordering
      const centerLat = (north + south) / 2;
      const centerLng = (east + west) / 2;
      
      // Add distance calculation for ordering by proximity to viewport center
      query.attributes = {
        include: [
          [
            sequelize.literal(`ST_Distance(location::geometry, ST_SetSRID(ST_MakePoint(${centerLng}, ${centerLat}), 4326))`),
            'distance'
          ]
        ]
      };
      
      // Order by distance first, then by creation date
      query.order = [
        ['distance', 'ASC'],
        ['createdAt', 'DESC']
      ];
      
      console.log('🗺️ Viewport-based query applied');
    }

    console.log('🔍 Final query structure:', JSON.stringify({
      include: query.include ? query.include.length : 0,
      where: query.where ? 'present' : 'none',
      order: query.order,
      limit: query.limit,
      attributes: query.attributes ? 'present' : 'none'
    }, null, 2));

    const locations = await Location.findAll(query);
    
    // Debug logs
    console.log(`Fetched ${locations.length} locations within radius`);
    console.log("Location points check:");
    locations.forEach(location => {
      console.log(`Location ${location.id}: upvotes=${location.upvotes}, downvotes=${location.downvotes}, totalPoints=${location.totalPoints}`);
    });

    res.json(locations);
  } catch (error) {
    console.error('❌ Error fetching locations:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error details:', {
      message: error.message,
      name: error.name,
      code: error.code
    });
    res.status(500).json({ error: error.message });
  }
});

// Add POST endpoint
router.post('/', 
  authenticateToken, 
  upload.array('media'), 
  validateTrustBasedPosting,
  validateDailyPostingLimit,
  checkApprovalRequirement,
  handleLocationApproval,
  async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    console.log('🔍 Route handler - Raw request body:', req.body);
    console.log('🔍 Route handler - Files received:', req.files);
    console.log('🔍 Route handler - All request properties:', Object.keys(req));
    
    const { 
      latitude, 
      longitude, 
      text, 
      isAnonymous, 
      autoDelete, 
      deleteTime, 
      deleteUnit,
      locationType,
      keywords,
      initialCredits
    } = req.body;

    console.log('🔍 Route handler - Extracted locationType:', locationType);
    console.log('🔍 Route handler - Extracted latitude:', latitude);
    console.log('🔍 Route handler - Extracted longitude:', longitude);
    console.log('🔍 Route handler - Extracted text:', text);

    // 🛡️ DUPLICATE DETECTION - Check for duplicates before creating location
    console.log('🛡️ Running duplicate detection for new location...');
    const locationData = {
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      text: text.trim(),
      locationType: locationType || 'general'
    };
    
    const duplicateAnalysis = await duplicateDetectionService.detectDuplicates(locationData, req.user.id);
    console.log(`🛡️ Duplicate detection result: ${duplicateAnalysis.duplicateStatus} (Risk: ${duplicateAnalysis.totalRiskScore})`);
    
    // Handle high-risk duplicates
    if (duplicateAnalysis.duplicateStatus === 'high_risk') {
      await transaction.rollback();
      return res.status(400).json({
        error: 'Duplicate location detected',
        message: 'This location appears to be a duplicate of an existing location. Please review and modify your submission.',
        analysis: duplicateAnalysis,
        recommendations: duplicateAnalysis.recommendations
      });
    }
    
    // Flag medium-risk locations for review
    if (duplicateAnalysis.duplicateStatus === 'medium_risk') {
      console.log('⚠️ Medium risk duplicate detected - location will be flagged for review');
      // Continue with creation but flag for review
    }

    // 🧠 BEHAVIORAL ANALYSIS - Analyze user behavior patterns
    console.log('🧠 Running behavioral analysis for user:', req.user.id);
    const behavioralAnalysis = await behavioralAnalysisService.analyzeUserBehavior(req.user.id, locationData);
    console.log(`🧠 Behavioral analysis result: Risk Level ${behavioralAnalysis.riskLevel} (Score: ${behavioralAnalysis.riskScore})`);
    
    // Handle high-risk behavioral patterns
    if (behavioralAnalysis.isSuspicious) {
      console.log('🚨 Suspicious user behavior detected - location will be flagged for review');
      // Continue with creation but flag for review and log suspicious activity
    }

    // 📝 CONTENT QUALITY ANALYSIS - Analyze content for spam and quality
    console.log('📝 Running content quality analysis...');
    const contentData = {
      name: text.trim(),
      description: text.trim(),
      keywords: parsedKeywords.join(' '),
      images: req.files ? req.files.map(file => ({
        filename: file.filename,
        size: file.size,
        mimetype: file.mimetype
      })) : []
    };
    
    const contentQualityAnalysis = await contentQualityService.analyzeContentQuality(contentData, {
      userId: req.user.id,
      trustLevel: req.user.trustLevel
    });
    console.log(`📝 Content quality analysis result: Score ${contentQualityAnalysis.overallScore} (Risk: ${contentQualityAnalysis.riskLevel})`);
    
    // Handle critical content quality issues
    if (contentQualityAnalysis.riskLevel === 'CRITICAL' || contentQualityAnalysis.spamScore > 70) {
      console.log('🚨 Critical content quality issues detected - location will be blocked');
      await transaction.rollback();
      return res.status(400).json({
        error: 'Content quality issues detected',
        message: 'This location has been blocked due to content quality issues. Please improve your content and try again.',
        analysis: contentQualityAnalysis,
        recommendations: contentQualityAnalysis.recommendations
      });
    }
    
    // Flag high-risk content for review
    if (contentQualityAnalysis.riskLevel === 'HIGH') {
      console.log('⚠️ High-risk content quality detected - location will be flagged for review');
      // Continue with creation but flag for review
    }
    
    // Combine all analysis results for comprehensive risk assessment
    const combinedRiskScore = (
      duplicateAnalysis.totalRiskScore + 
      behavioralAnalysis.riskScore + 
      (100 - contentQualityAnalysis.overallScore)
    ) / 3;
    const isHighRisk = duplicateAnalysis.duplicateStatus === 'high_risk' || 
                       behavioralAnalysis.isSuspicious || 
                       contentQualityAnalysis.riskLevel === 'CRITICAL';
    
    if (isHighRisk) {
      await transaction.rollback();
      return res.status(400).json({
        error: 'Location creation blocked',
        message: 'This location has been blocked due to suspicious activity, duplicate detection, or content quality issues.',
        duplicateAnalysis: duplicateAnalysis,
        behavioralAnalysis: behavioralAnalysis,
        contentQualityAnalysis: contentQualityAnalysis,
        combinedRiskScore: combinedRiskScore,
        recommendations: [
          ...duplicateAnalysis.recommendations || [],
          ...behavioralAnalysis.recommendations || [],
          ...contentQualityAnalysis.recommendations || []
        ]
      });
    }

    // Get validation info from middleware
    const postingValidation = req.postingValidation;
    const approvalInfo = req.approvalInfo;
    const dailyLimitInfo = req.dailyLimitInfo;
    
    const finalLocationType = locationType || 'general';
    const requiredCredits = postingValidation.restrictions.creditCost;
    
    // Parse initial credits if provided
    const parsedInitialCredits = initialCredits ? parseInt(initialCredits) : 0;
    const totalCreditsToSpend = requiredCredits + parsedInitialCredits;

    // Deduct credits if required (location type + initial credits)
    if (finalLocationType !== 'general' && totalCreditsToSpend > 0) {
      await creditService.spendCredits(
        req.user.id,
        totalCreditsToSpend,
        'location_creation',
        {
          description: `Created ${finalLocationType} location: "${text}"${parsedInitialCredits > 0 ? ` with ${parsedInitialCredits} initial credits` : ''}`,
          locationType: finalLocationType,
          initialCredits: parsedInitialCredits,
          action: 'create_location',
          trustLevel: req.user.trustLevel,
          requiresApproval: approvalInfo.requiresApproval
        },
        { transaction }
      );
    } else if (finalLocationType === 'general' && parsedInitialCredits > 0) {
      await creditService.spendCredits(
        req.user.id,
        parsedInitialCredits,
        'location_creation',
        {
          description: `Placed ${parsedInitialCredits} credits on general location: "${text}"`,
          locationType: finalLocationType,
          initialCredits: parsedInitialCredits,
          action: 'create_location',
          trustLevel: req.user.trustLevel,
          requiresApproval: approvalInfo.requiresApproval
        },
        { transaction }
      );
    }

    console.log('Received location data:', req.body);
    console.log('Received files:', req.files);
    
    // Calculate deleteAt time
    let deleteAt = null;
    
    if (autoDelete === 'true') {
      // Use user-specified auto-delete for any location type
      deleteAt = new Date();
      const time = parseInt(deleteTime);
      
      switch(deleteUnit) {
        case 'minutes':
          deleteAt.setMinutes(deleteAt.getMinutes() + time);
          break;
        case 'hours':
          deleteAt.setHours(deleteAt.getHours() + time);
          break;
        case 'days':
          deleteAt.setDate(deleteAt.getDate() + time);
          break;
      }
    } else if (finalLocationType === 'general') {
      // For general locations without custom timer, set 7-day auto-delete
      deleteAt = new Date();
      deleteAt.setDate(deleteAt.getDate() + 7);
    }

    // Parse keywords from string to array if provided
    let parsedKeywords = [];
    if (keywords) {
      try {
        parsedKeywords = typeof keywords === 'string' ? JSON.parse(keywords) : keywords;
        // Ensure it's an array and clean the keywords
        parsedKeywords = Array.isArray(parsedKeywords) 
          ? parsedKeywords.filter(k => k && k.trim()).map(k => k.trim().toLowerCase())
          : [];
      } catch (error) {
        console.warn('Invalid keywords format:', keywords);
        parsedKeywords = [];
      }
    }

    // Create the content object with media information
    const content = {
      text: text || '',
      mediaUrls: req.files ? req.files.map(file => file.path) : [],
      mediaTypes: req.files ? req.files.map(file => file.mimetype) : [],
      isAnonymous: isAnonymous === 'true'
    };

    const location = await Location.create({
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)]
      },
      content,
      keywords: parsedKeywords,
      locationType: finalLocationType,
      creatorId: req.user.id,
      autoDelete: finalLocationType === 'general' || autoDelete === 'true',
      deleteAt,
      credits: parsedInitialCredits,
      locationStatus: req.body.locationStatus || 'pending',
      requiresApproval: approvalInfo.requiresApproval,
      statusUpdatedAt: new Date(),
      statusReason: approvalInfo.requiresApproval ? 
        `Requires approval (${req.user.trustLevel} trust level)` : 
        'Auto-approved (trusted user)'
    }, { transaction });

    // Check for new badges
    const newBadges = await badgeService.checkBadges(req.user.id, { transaction });

    await transaction.commit();

    console.log('Created location:', location);

    // Build response message based on approval status and trust level
    let message = `${finalLocationType} location created successfully!`;
    
    if (parsedInitialCredits > 0) {
      message += ` ${parsedInitialCredits} credits placed on location.`;
    }
    
    if (approvalInfo.requiresApproval) {
      message += ` Your location is pending approval (${req.user.trustLevel} trust level).`;
    } else {
      message += ` Your location was auto-approved (${req.user.trustLevel} trust level).`;
    }
    
    if (finalLocationType === 'general') {
      message += ` It will be automatically deleted in ${autoDelete === 'true' ? `${deleteTime} ${deleteUnit}` : '7 days'} unless it receives 2+ positive ratings.`;
    }
    
    message += ` Daily limit: ${dailyLimitInfo.remaining} locations remaining.`;

    res.status(201).json({ 
      location,
      newBadges,
      creditsSpent: totalCreditsToSpend,
      message,
      postingInfo: {
        trustLevel: req.user.trustLevel,
        requiresApproval: approvalInfo.requiresApproval,
        dailyLimit: dailyLimitInfo,
        restrictions: postingValidation.restrictions
      }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error creating location:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete endpoint
router.delete('/:id', authenticateToken, async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const location = await Location.findByPk(req.params.id);
    
    if (!location) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Location not found' });
    }

    // Allow deletion if user is admin OR is the creator OR is the current owner
    const LocationOwnership = require('../models/LocationOwnership');
    const ownership = await LocationOwnership.findOne({ where: { locationId: req.params.id } });
    
    const isOwner = ownership && ownership.ownerId === req.user.id;
    
    if (!req.user.isAdmin && location.creatorId !== req.user.id && !isOwner) {
      await transaction.rollback();
      return res.status(403).json({ error: 'Unauthorized to delete this location' });
    }

    console.log('🗑️ Deleting location and related records:', req.params.id);

    // Import required models
    const LocationOwnershipHistory = require('../models/LocationOwnershipHistory');
    const LocationNomination = require('../models/LocationNomination');
    const NominationVote = require('../models/NominationVote');
    const LocationComment = require('../models/LocationComment');

    // Delete related records in the correct order (child tables first)
    
    // 1. Delete nomination votes (child of nominations)
    await NominationVote.destroy({
      where: {
        nominationId: {
          [Op.in]: sequelize.literal(`(SELECT id FROM "LocationNominations" WHERE "locationId" = '${req.params.id}')`)
        }
      },
      transaction
    });

    // 2. Delete location nominations
    await LocationNomination.destroy({
      where: { locationId: req.params.id },
      transaction
    });

    // 3. Delete location ownership history
    await LocationOwnershipHistory.destroy({
      where: { locationId: req.params.id },
      transaction
    });

    // 4. Delete location ownership
    await LocationOwnership.destroy({
      where: { locationId: req.params.id },
      transaction
    });

    // 5. Delete location comments
    await LocationComment.destroy({
      where: { locationId: req.params.id },
      transaction
    });

    // 6. Finally delete the location itself
    await location.destroy({ transaction });

    await transaction.commit();
    
    console.log('✅ Location deleted successfully');
    res.json({ message: 'Location deleted successfully' });
    
  } catch (error) {
    await transaction.rollback();
    console.error('Error deleting location:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update location
router.put('/:id', authenticateToken, upload.array('media'), async (req, res) => {
  try {
    const location = await Location.findByPk(req.params.id);
    
    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }

    if (!req.user.isAdmin && location.creatorId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized to update this location' });
    }

    const updatedContent = {
      ...location.content,
      text: req.body.text || location.content.text,
      isAnonymous: req.body.isAnonymous === 'true'
    };

    if (req.files && req.files.length > 0) {
      updatedContent.mediaUrls = [
        ...location.content.mediaUrls,
        ...req.files.map(file => file.path)
      ];
      updatedContent.mediaTypes = [
        ...location.content.mediaTypes,
        ...req.files.map(file => file.mimetype)
      ];
    }

    if (req.body.deleteMediaIndexes) {
      const deleteIndexes = JSON.parse(req.body.deleteMediaIndexes);
      updatedContent.mediaUrls = updatedContent.mediaUrls.filter((_, index) => 
        !deleteIndexes.includes(index)
      );
      updatedContent.mediaTypes = updatedContent.mediaTypes.filter((_, index) => 
        !deleteIndexes.includes(index)
      );
    }

    // Preserve existing location coordinates if new ones aren't provided
    const locationData = {
      type: 'Point',
      coordinates: [
        req.body.longitude ? parseFloat(req.body.longitude) : location.location.coordinates[0],
        req.body.latitude ? parseFloat(req.body.latitude) : location.location.coordinates[1]
      ]
    };

    await location.update({
      location: locationData,
      content: updatedContent
    });

    // Fetch updated location with creator info
    const updatedLocationWithCreator = await Location.findByPk(location.id, {
      include: [{
        model: User,
        as: 'creator',
        attributes: ['email', 'profile', 'id']
      }]
    });

    res.json(updatedLocationWithCreator);
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/:locationId/vote', authenticateToken, async (req, res) => {
  try {
    const { voteType } = req.body;
    const userId = req.user.id;
    const locationId = req.params.locationId;

    // Update location votes
    const location = await Location.findByPk(locationId);
    if (voteType === 'upvote') {
      await location.increment('upvotes');
    } else if (voteType === 'downvote') {
      await location.increment('downvotes');
    }

    // Update user's votesGiven count
    await User.increment('votesGiven', {
      where: { id: userId }
    });

    // Automatically update location status based on new ratings
    const locationStatusService = require('../services/locationStatusService');
    const statusUpdate = await locationStatusService.updateLocationStatus(locationId);

    // Check for new badges
    const newBadges = await checkAndAwardBadges(userId);

    res.json({ 
      success: true, 
      newBadges,
      location: await location.reload(),
      statusUpdate: statusUpdate.statusChanged ? {
        previousStatus: statusUpdate.previousStatus,
        newStatus: statusUpdate.newStatus,
        reason: statusUpdate.reason
      } : null
    });
  } catch (error) {
    console.error('Error processing vote:', error);
    res.status(500).json({ error: 'Error processing vote' });
  }
});

router.post('/:locationId/verify', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    const locationId = req.params.locationId;
    
    const location = await Location.findByPk(locationId);
    await location.update({ verificationStatus: status });

    // Check for new badges for the location creator
    const newBadges = await checkAndAwardBadges(location.creatorId);

    res.json({ 
      success: true, 
      newBadges,
      location: await location.reload() 
    });
  } catch (error) {
    console.error('Error verifying location:', error);
    res.status(500).json({ error: 'Error verifying location' });
  }
});

// Official Location System Routes

// Make a location official
router.post('/:id/make-official', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    console.log('🔵 Making location official:', { locationId: id, userId });

    const result = await officialLocationService.makeLocationOfficial(id, userId);

    res.json({
      success: true,
      message: result.message,
      location: result.location,
      creditsSpent: result.creditsSpent
    });

  } catch (error) {
    console.error('Error making location official:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Check if location can be made official
router.get('/:id/can-make-official', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await officialLocationService.canMakeOfficial(id, userId);

    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Error checking if can make official:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Get all official locations
router.get('/official/all', authenticateToken, async (req, res) => {
  try {
    const { limit, offset } = req.query;
    const options = {};
    
    if (limit) options.limit = parseInt(limit);
    if (offset) options.offset = parseInt(offset);

    const officialLocations = await officialLocationService.getOfficialLocations(options);

    res.json({
      success: true,
      locations: officialLocations
    });

  } catch (error) {
    console.error('Error getting official locations:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Get user's official locations
router.get('/official/user/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Only allow users to see their own official locations or admins to see any
    if (req.user.id !== userId && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to view other users\' official locations'
      });
    }

    const officialLocations = await officialLocationService.getOfficialLocationsByUser(userId);

    res.json({
      success: true,
      locations: officialLocations
    });

  } catch (error) {
    console.error('Error getting user official locations:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Get official location statistics
router.get('/official/stats', authenticateToken, async (req, res) => {
  try {
    const stats = await officialLocationService.getOfficialLocationStats();

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Error getting official location stats:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Get location status statistics
router.get('/status/stats', authenticateToken, async (req, res) => {
  try {
    const locationStatusService = require('../services/locationStatusService');
    const stats = await locationStatusService.getStatusStats();

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Error getting location status stats:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Get locations by status
router.get('/status/:status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.params;
    const { limit, offset } = req.query;
    
    const locationStatusService = require('../services/locationStatusService');
    const options = {};
    
    if (limit) options.limit = parseInt(limit);
    if (offset) options.offset = parseInt(offset);

    const locations = await locationStatusService.getLocationsByStatus(status, options);

    res.json({
      success: true,
      locations
    });

  } catch (error) {
    console.error('Error getting locations by status:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Manually update location status (admin only)
router.put('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    // Only admins can manually update status
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can manually update location status'
      });
    }

    const locationStatusService = require('../services/locationStatusService');
    const result = await locationStatusService.manuallyUpdateStatus(id, status, reason);

    res.json({
      success: true,
      location: result.location,
      previousStatus: result.previousStatus,
      newStatus: result.newStatus,
      reason: result.reason
    });

  } catch (error) {
    console.error('Error manually updating location status:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Get nominations for a specific location
router.get('/:locationId/nominations', authenticateToken, async (req, res) => {
  try {
    const { locationId } = req.params;
    
    // Import nomination service here to avoid circular dependencies
    const nominationService = require('../services/nominationService');
    
    const nominations = await nominationService.getNominationsByLocation(locationId);

    res.json({
      success: true,
      nominations: nominations
    });

  } catch (error) {
    console.error('Error getting location nominations:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router; 