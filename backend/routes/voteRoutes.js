const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const Location = require('../models/Location');
const User = require('../models/User');

// Vote on a location
router.post('/:locationId/vote', authenticateToken, async (req, res) => {
  try {
    const { locationId } = req.params;
    const { voteType } = req.body; // 'upvote' or 'downvote'
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
        return res.status(400).json({ error: 'You have already voted' });
      }
      // Remove old vote
      location[existingVote.voteType + 's'] -= 1;
    }

    // Add new vote
    location[voteType + 's'] += 1;
    
    // Update voters array
    const updatedVoters = voters.filter(v => v.userId !== userId);
    updatedVoters.push({ userId, voteType });
    location.voters = updatedVoters;

    // Check for verification status
    const netVotes = location.upvotes - location.downvotes;
    if (netVotes >= 10 && location.verificationStatus !== 'verified') {
      location.verificationStatus = 'verified';
      
      // Award points to location creator
      const creator = await User.findByPk(location.creatorId);
      if (creator) {
        creator.points += 50; // Points for getting location verified
        creator.reputation += 10;
        await creator.save();
      }
    }

    await location.save();

    // Award points to the voter
    const voter = await User.findByPk(userId);
    if (voter) {
      voter.points += 1; // Point for voting
      await voter.save();
    }

    res.json({ 
      message: 'Vote recorded successfully',
      location: {
        upvotes: location.upvotes,
        downvotes: location.downvotes,
        verificationStatus: location.verificationStatus
      }
    });
  } catch (error) {
    console.error('Error recording vote:', error);
    res.status(500).json({ error: 'Error recording vote' });
  }
});

module.exports = router;