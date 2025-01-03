const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const Location = require('../models/Location');
const User = require('../models/User');

// Define these constants ONCE at the top
const VERIFICATION_THRESHOLD = 5;
const PENDING_THRESHOLD = 2;

router.post('/:locationId/vote', authenticateToken, async (req, res) => {
  try {
    const { locationId } = req.params;
    const { voteType } = req.body;
    const userId = req.user.userId;

    console.log('Vote attempt:', { locationId, userId, voteType });

    const location = await Location.findByPk(locationId);
    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }

    // Ensure voters array exists
    location.voters = location.voters || [];

    // Log current state
    console.log('Current location state:', {
      upvotes: location.upvotes,
      downvotes: location.downvotes,
      voters: location.voters
    });

    // Check if user has already voted
    const existingVote = location.voters.find(v => v.userId === userId);
    console.log('Existing vote:', existingVote);

    if (existingVote) {
      // If trying to vote the same way, reject
      if (existingVote.voteType === voteType) {
        console.log('Rejecting duplicate vote');
        return res.status(400).json({ 
          error: 'You have already voted this way on this location',
          currentVote: existingVote.voteType
        });
      }

      // If changing vote
      console.log('Changing vote from', existingVote.voteType, 'to', voteType);
      
      // Remove old vote
      location[existingVote.voteType + 's'] = Math.max(0, location[existingVote.voteType + 's'] - 1);
      
      // Add new vote
      location[voteType + 's'] = (location[voteType + 's'] || 0) + 1;
      
      // Update vote type in voters array
      const voterIndex = location.voters.findIndex(v => v.userId === userId);
      location.voters[voterIndex] = { userId, voteType };
    } else {
      // New vote
      console.log('Recording new vote');
      location[voteType + 's'] = (location[voteType + 's'] || 0) + 1;
      location.voters.push({ userId, voteType });
    }

    // Recalculate total points
    location.totalPoints = location.upvotes - location.downvotes;

    // Update verification status
    const netVotes = location.upvotes - location.downvotes;
    if (netVotes >= VERIFICATION_THRESHOLD) {
      location.verificationStatus = 'verified';
    } else if (netVotes >= PENDING_THRESHOLD) {
      location.verificationStatus = 'pending';
    } else {
      location.verificationStatus = 'unverified';
    }

    await location.save();

    console.log('Updated location state:', {
      upvotes: location.upvotes,
      downvotes: location.downvotes,
      voters: location.voters,
      totalPoints: location.totalPoints,
      verificationStatus: location.verificationStatus
    });

    res.json({ 
      message: 'Vote recorded successfully',
      location: {
        id: location.id,
        upvotes: location.upvotes,
        downvotes: location.downvotes,
        verificationStatus: location.verificationStatus,
        totalPoints: location.totalPoints,
        voters: location.voters
      }
    });
  } catch (error) {
    console.error('Error recording vote:', error);
    res.status(500).json({ error: 'Error recording vote' });
  }
});

module.exports = router;