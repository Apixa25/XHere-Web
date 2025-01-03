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

    const location = await Location.findByPk(locationId);
    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }

    // Check if user has already voted
    const voters = location.voters || [];
    const existingVote = voters.find(v => v.userId === userId);

    if (existingVote) {
      if (existingVote.voteType === voteType) {
        // User is trying to vote the same way twice - remove their vote entirely
        location[voteType + 's'] -= 1;
        location.totalPoints -= (voteType === 'upvote' ? 1 : -1);
        location.voters = voters.filter(v => v.userId !== userId);
      } else {
        // User is switching their vote
        // First remove old vote
        location[existingVote.voteType + 's'] -= 1;
        // Then add new vote
        location[voteType + 's'] += 1;
        // Update total points (switching from up to down = -2, down to up = +2)
        location.totalPoints += (voteType === 'upvote' ? 2 : -2);
        // Update voter's vote type
        location.voters = voters.map(v => 
          v.userId === userId ? { ...v, voteType } : v
        );
      }
    } else {
      // New vote
      location[voteType + 's'] += 1;
      location.totalPoints += (voteType === 'upvote' ? 1 : -1);
      location.voters.push({ userId, voteType });
    }

    // Calculate net votes (upvotes - downvotes)
    const netVotes = location.upvotes - location.downvotes;

    // Update verification status based on net votes
    if (netVotes >= VERIFICATION_THRESHOLD) {
      location.verificationStatus = 'verified';
    } else if (netVotes >= PENDING_THRESHOLD) {
      location.verificationStatus = 'pending';
    } else {
      location.verificationStatus = 'unverified';
    }

    await location.save();

    console.log('Vote update:', {
      locationId,
      userId,
      voteType,
      upvotes: location.upvotes,
      downvotes: location.downvotes,
      netVotes,
      verificationStatus: location.verificationStatus,
      voters: location.voters
    });

    res.json({ 
      message: 'Vote recorded successfully',
      location: {
        id: location.id,
        upvotes: location.upvotes,
        downvotes: location.downvotes,
        verificationStatus: location.verificationStatus,
        totalPoints: location.totalPoints
      }
    });
  } catch (error) {
    console.error('Error recording vote:', error);
    res.status(500).json({ error: 'Error recording vote' });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { locationId, voteType } = req.body;
    const userId = req.user.userId;

    const location = await Location.findByPk(locationId);
    
    // Debug log before update
    console.log(`Before vote - Location ${locationId}: upvotes=${location.upvotes}, downvotes=${location.downvotes}, totalPoints=${location.totalPoints}`);

    // ... voting logic ...

    // After updating votes, calculate total points
    location.totalPoints = location.upvotes - location.downvotes;
    await location.save();

    // Debug log after update
    console.log(`After vote - Location ${locationId}: upvotes=${location.upvotes}, downvotes=${location.downvotes}, totalPoints=${location.totalPoints}`);

    res.json(location);
  } catch (error) {
    console.error('Error processing vote:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;