const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const challengeService = require('../services/challengeService');

// Get all active challenges
router.get('/', authenticateToken, async (req, res) => {
  try {
    const challenges = await challengeService.getActiveChallenges();
    res.json(challenges);
  } catch (error) {
    console.error('❌ Error fetching challenges:', error);
    res.status(500).json({ error: 'Failed to fetch challenges' });
  }
});

// Get challenge by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const includeSubmissions = req.query.includeSubmissions === 'true';
    
    const challenge = await challengeService.getChallengeById(id, includeSubmissions);
    res.json(challenge);
  } catch (error) {
    console.error('❌ Error fetching challenge:', error);
    if (error.message === 'Challenge not found') {
      res.status(404).json({ error: 'Challenge not found' });
    } else {
      res.status(500).json({ error: 'Failed to fetch challenge' });
    }
  }
});

// Create new challenge (admin only)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const challengeData = req.body;
    const challenge = await challengeService.createChallenge(challengeData, req.user.id);
    res.status(201).json(challenge);
  } catch (error) {
    console.error('❌ Error creating challenge:', error);
    res.status(500).json({ error: 'Failed to create challenge' });
  }
});

// Submit location for challenge
router.post('/:id/submit', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { locationId, submissionText } = req.body;
    
    if (!locationId) {
      return res.status(400).json({ error: 'Location ID is required' });
    }
    
    const submission = await challengeService.submitLocation(id, req.user.id, locationId, submissionText);
    res.status(201).json(submission);
  } catch (error) {
    console.error('❌ Error submitting location:', error);
    res.status(400).json({ error: error.message });
  }
});

// Vote on submission
router.post('/submissions/:submissionId/vote', authenticateToken, async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { voteType, reason } = req.body;
    
    if (!voteType || !['upvote', 'downvote'].includes(voteType)) {
      return res.status(400).json({ error: 'Valid vote type is required' });
    }
    
    await challengeService.voteOnSubmission(submissionId, req.user.id, voteType, reason);
    res.json({ success: true, message: 'Vote recorded successfully' });
  } catch (error) {
    console.error('❌ Error voting on submission:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get challenge leaderboard
router.get('/:id/leaderboard', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const leaderboard = await challengeService.getChallengeLeaderboard(id);
    res.json(leaderboard);
  } catch (error) {
    console.error('❌ Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// Get user's submissions
router.get('/user/submissions', authenticateToken, async (req, res) => {
  try {
    const { challengeId } = req.query;
    const submissions = await challengeService.getUserSubmissions(req.user.id, challengeId);
    res.json(submissions);
  } catch (error) {
    console.error('❌ Error fetching user submissions:', error);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

// End challenge and distribute rewards (admin only)
router.post('/:id/end', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const results = await challengeService.endChallenge(id);
    res.json({ 
      success: true, 
      message: 'Challenge ended successfully',
      results 
    });
  } catch (error) {
    console.error('❌ Error ending challenge:', error);
    res.status(400).json({ error: error.message });
  }
});

// Update challenge status (admin only)
router.patch('/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['draft', 'active', 'voting', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const challenge = await challengeService.getChallengeById(id);
    await challenge.update({ status });
    
    res.json({ success: true, challenge });
  } catch (error) {
    console.error('❌ Error updating challenge status:', error);
    res.status(500).json({ error: 'Failed to update challenge status' });
  }
});

// Delete challenge (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🗑️ Deleting challenge:', id);
    
    const challenge = await challengeService.getChallengeById(id);
    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }
    
    // Delete related data first (submissions, votes, rewards)
    const { ChallengeSubmission, ChallengeVote, ChallengeReward } = require('../models');
    
    // Delete submissions
    const submissionCount = await ChallengeSubmission.destroy({
      where: { challengeId: id }
    });
    console.log('🗑️ Deleted submissions:', submissionCount);
    
    // Delete votes
    const voteCount = await ChallengeVote.destroy({
      where: { submissionId: null } // This will delete votes for submissions that were just deleted
    });
    console.log('🗑️ Deleted votes:', voteCount);
    
    // Delete rewards
    const rewardCount = await ChallengeReward.destroy({
      where: { challengeId: id }
    });
    console.log('🗑️ Deleted rewards:', rewardCount);
    
    // Delete the challenge
    await challenge.destroy();
    console.log('🗑️ Deleted challenge:', id);
    
    res.json({ 
      success: true, 
      message: 'Challenge deleted successfully',
      deleted: {
        challenge: true,
        submissions: submissionCount,
        votes: voteCount,
        rewards: rewardCount
      }
    });
  } catch (error) {
    console.error('❌ Error deleting challenge:', error);
    res.status(500).json({ error: 'Failed to delete challenge' });
  }
});

// Create sample challenge (admin only)
router.post('/sample/create', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const challenge = await challengeService.createSampleChallenge(req.user.id);
    res.status(201).json({
      success: true,
      message: 'Sample challenge created successfully',
      challenge
    });
  } catch (error) {
    console.error('❌ Error creating sample challenge:', error);
    res.status(500).json({ error: 'Failed to create sample challenge' });
  }
});

// Get challenge statistics
router.get('/:id/stats', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const challenge = await challengeService.getChallengeById(id, true);
    
    const stats = {
      totalSubmissions: challenge.submissions?.length || 0,
      totalVotes: challenge.submissions?.reduce((sum, sub) => sum + sub.voteCount, 0) || 0,
      averageScore: challenge.submissions?.length > 0 
        ? challenge.submissions.reduce((sum, sub) => sum + sub.score, 0) / challenge.submissions.length 
        : 0,
      topSubmission: challenge.submissions?.[0] || null,
      daysRemaining: Math.ceil((new Date(challenge.endDate) - new Date()) / (1000 * 60 * 60 * 24))
    };
    
    res.json(stats);
  } catch (error) {
    console.error('❌ Error fetching challenge stats:', error);
    res.status(500).json({ error: 'Failed to fetch challenge statistics' });
  }
});

// Get featured challenges
router.get('/featured/list', authenticateToken, async (req, res) => {
  try {
    const { Challenge } = require('../models');
    const featuredChallenges = await Challenge.findAll({
      where: { featured: true },
      include: [
        {
          model: require('../models').User,
          as: 'creator',
          attributes: ['email', 'profile']
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    res.json(featuredChallenges);
  } catch (error) {
    console.error('❌ Error fetching featured challenges:', error);
    res.status(500).json({ error: 'Failed to fetch featured challenges' });
  }
});

module.exports = router; 