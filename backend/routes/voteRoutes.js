const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const Location = require('../models/Location');
const User = require('../models/User');

// Vote on a location
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
        return res.status(400).json({ error: 'You have already voted' });
      }
      // Remove old vote
      location[existingVote.voteType + 's'] -= 1;
      // Adjust points
      location.totalPoints -= (existingVote.voteType === 'upvote' ? 5 : -2);
    }

    // Add new vote
    location[voteType + 's'] += 1;
    
    // Update points
    location.totalPoints += (voteType === 'upvote' ? 5 : -2);
    
    // Update voters array
    const updatedVoters = voters.filter(v => v.userId !== userId);
    updatedVoters.push({ userId, voteType });
    location.voters = updatedVoters;

    await location.save();

    console.log("Updated location points:", location.totalPoints);

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