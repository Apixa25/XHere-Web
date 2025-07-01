const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const Location = require('../models/Location');
const User = require('../models/User');
const locationStatusService = require('../services/locationStatusService');
const badgeService = require('../services/badgeService');

// Define these constants ONCE at the top
const VERIFICATION_THRESHOLD = 5;
const PENDING_THRESHOLD = 2;

router.post('/:locationId/vote', authenticateToken, async (req, res) => {
  const transaction = await Location.sequelize.transaction();
  
  try {
    const { locationId } = req.params;
    const { voteType } = req.body;
    const userId = req.user.id;

    console.log('🔍 === VOTE DEBUG START ===');
    console.log('🔍 Vote attempt:', { locationId, userId, voteType });
    console.log('🔍 User from JWT:', req.user);
    console.log('🔍 Request body:', req.body);

    const location = await Location.findByPk(locationId, { transaction });
    if (!location) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Location not found' });
    }

    // Ensure voters is an array
    if (!Array.isArray(location.voters)) {
      location.voters = [];
    }

    console.log('🔍 Current voters array:', location.voters);
    console.log('🔍 Voters array type:', typeof location.voters);
    console.log('🔍 Voters array length:', location.voters.length);

    // Check if user has already voted
    console.log('🔍 Looking for user ID in voters array:', userId);
    console.log('🔍 User ID type:', typeof userId);
    
    const existingVoteIndex = location.voters.findIndex(v => {
      console.log('🔍 Comparing:', { 
        voterUserId: v.userId, 
        voterUserIdType: typeof v.userId,
        currentUserId: userId, 
        currentUserIdType: typeof userId,
        isMatch: v.userId === userId 
      });
      return v.userId === userId;
    });
    
    console.log('🔍 Existing vote index:', existingVoteIndex);

    if (existingVoteIndex !== -1) {
      const existingVote = location.voters[existingVoteIndex];
      console.log('🔍 Existing vote found:', existingVote);
      console.log('🔍 Existing vote type:', existingVote.voteType);
      console.log('🔍 New vote type:', voteType);
      console.log('🔍 Vote types match?', existingVote.voteType === voteType);

      // If trying to vote the same way, reject
      if (existingVote.voteType === voteType) {
        await transaction.rollback();
        console.log('🔍 Rejecting duplicate vote');
        console.log('🔍 === VOTE DEBUG END (DUPLICATE) ===');
        return res.status(400).json({ 
          error: 'You have already voted this way on this location',
          currentVote: existingVote.voteType
        });
      }

      // If changing vote
      console.log('🔍 Changing vote from', existingVote.voteType, 'to', voteType);
      
      // Remove old vote
      if (existingVote.voteType === 'upvote') {
        location.upvotes = Math.max(0, location.upvotes - 1);
      } else {
        location.downvotes = Math.max(0, location.downvotes - 1);
      }
      
      // Add new vote
      if (voteType === 'upvote') {
        location.upvotes += 1;
      } else {
        location.downvotes += 1;
      }
      
      // Update vote in voters array
      location.voters[existingVoteIndex] = { userId, voteType };
    } else {
      // New vote
      console.log('🔍 Recording new vote (no existing vote found)');
      if (voteType === 'upvote') {
        location.upvotes = (location.upvotes || 0) + 1;
      } else {
        location.downvotes = (location.downvotes || 0) + 1;
      }
      location.voters.push({ userId, voteType });
    }

    // Force the voters array to be marked as changed
    location.changed('voters', true);

    // Recalculate total points
    location.totalPoints = location.upvotes - location.downvotes;

    // Update verification status (legacy system)
    const netVotes = location.upvotes - location.downvotes;
    if (netVotes >= VERIFICATION_THRESHOLD) {
      location.verificationStatus = 'verified';
    } else if (netVotes >= PENDING_THRESHOLD) {
      location.verificationStatus = 'pending';
    } else {
      location.verificationStatus = 'unverified';
    }

    console.log('🔍 Saving location with voters:', location.voters);
    await location.save({ transaction });

    // Update location status based on new ratings
    const statusUpdate = await locationStatusService.updateLocationStatus(locationId, { transaction });

    // Check and award badges after successful vote
    const newBadges = await badgeService.checkBadges(location.creatorId, { transaction });

    // Get creator information for the response
    const creator = await User.findByPk(location.creatorId, {
      attributes: ['id', 'email', 'profile'],
      transaction
    });

    await transaction.commit();

    console.log('🔍 Updated location state:', {
      upvotes: location.upvotes,
      downvotes: location.downvotes,
      voters: location.voters,
      totalPoints: location.totalPoints,
      verificationStatus: location.verificationStatus,
      locationStatus: statusUpdate.location.locationStatus,
      statusChanged: statusUpdate.statusChanged,
      newBadges
    });
    console.log('🔍 === VOTE DEBUG END (SUCCESS) ===');

    res.json({ 
      message: 'Vote recorded successfully',
      location: {
        id: location.id,
        location: location.location,
        content: location.content,
        keywords: location.keywords,
        locationType: location.locationType,
        creatorId: location.creatorId,
        creator: creator,
        upvotes: location.upvotes,
        downvotes: location.downvotes,
        verificationStatus: location.verificationStatus,
        locationStatus: statusUpdate.location.locationStatus,
        statusUpdatedAt: location.statusUpdatedAt,
        statusReason: location.statusReason,
        voters: location.voters,
        totalPoints: location.totalPoints,
        pointsHistory: location.pointsHistory,
        autoDelete: location.autoDelete,
        deleteAt: location.deleteAt,
        credits: location.credits,
        isOfficial: location.isOfficial,
        officialBoundary: location.officialBoundary,
        officialOwnerId: location.officialOwnerId,
        officializedAt: location.officializedAt,
        createdAt: location.createdAt,
        updatedAt: location.updatedAt
      },
      statusUpdate: {
        changed: statusUpdate.statusChanged,
        previousStatus: statusUpdate.previousStatus,
        newStatus: statusUpdate.newStatus,
        reason: statusUpdate.reason
      },
      newBadges,
      creator
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error recording vote:', error);
    res.status(500).json({ error: 'Error recording vote' });
  }
});

module.exports = router;