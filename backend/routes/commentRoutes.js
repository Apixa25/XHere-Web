const express = require('express');
const router = express.Router();
const LocationComment = require('../models/LocationComment');
const Location = require('../models/Location');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const { checkAndAwardBadges } = require('../utils/badgeChecker');

// Get comments for a specific location
router.get('/location/:locationId', authenticateToken, async (req, res) => {
  try {
    const { locationId } = req.params;
    const { page = 1, limit = 20, sort = 'newest' } = req.query;
    
    const offset = (page - 1) * limit;
    
    let orderClause;
    switch (sort) {
      case 'oldest':
        orderClause = [['createdAt', 'ASC']];
        break;
      case 'points':
        orderClause = [['totalPoints', 'DESC'], ['createdAt', 'DESC']];
        break;
      case 'newest':
      default:
        orderClause = [['createdAt', 'DESC']];
        break;
    }

    const comments = await LocationComment.findAll({
      where: { locationId },
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['email', 'profile', 'id']
        },
        {
          model: LocationComment,
          as: 'replies',
          include: [{
            model: User,
            as: 'author',
            attributes: ['email', 'profile', 'id']
          }]
        }
      ],
      order: orderClause,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Get total count for pagination
    const totalCount = await LocationComment.count({
      where: { locationId }
    });

    res.json({
      comments,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasMore: offset + comments.length < totalCount
      }
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create a new comment
router.post('/', authenticateToken, upload.array('media'), async (req, res) => {
  try {
    const { 
      locationId, 
      text, 
      parentCommentId, 
      isAnonymous 
    } = req.body;

    // Verify the location exists
    const location = await Location.findByPk(locationId);
    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }

    // Prevent users from commenting on their own locations (optional feature)
    // if (location.creatorId === req.user.userId) {
    //   return res.status(400).json({ error: 'Cannot comment on your own location' });
    // }

    // If this is a reply, verify the parent comment exists
    if (parentCommentId) {
      const parentComment = await LocationComment.findByPk(parentCommentId);
      if (!parentComment) {
        return res.status(404).json({ error: 'Parent comment not found' });
      }
      if (parentComment.locationId !== locationId) {
        return res.status(400).json({ error: 'Parent comment does not belong to this location' });
      }
    }

    const comment = await LocationComment.create({
      text,
      locationId,
      authorId: req.user.userId,
      parentCommentId: parentCommentId || null,
      isAnonymous: isAnonymous === 'true',
      mediaUrls: req.files ? req.files.map(file => file.path) : [],
      mediaTypes: req.files ? req.files.map(file => file.mimetype) : []
    });

    // Fetch the created comment with author info
    const commentWithAuthor = await LocationComment.findByPk(comment.id, {
      include: [{
        model: User,
        as: 'author',
        attributes: ['email', 'profile', 'id']
      }]
    });

    // Check for new badges
    const newBadges = await checkAndAwardBadges(req.user.userId);

    res.status(201).json({ 
      comment: commentWithAuthor,
      newBadges
    });
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update a comment
router.put('/:commentId', authenticateToken, upload.array('media'), async (req, res) => {
  try {
    const { commentId } = req.params;
    const { text } = req.body;

    const comment = await LocationComment.findByPk(commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Only allow the author or admin to edit
    if (!req.user.isAdmin && comment.authorId !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized to edit this comment' });
    }

    const updateData = {
      text,
      isEdited: true,
      editedAt: new Date()
    };

    // Handle media updates if files are provided
    if (req.files && req.files.length > 0) {
      updateData.mediaUrls = [
        ...comment.mediaUrls,
        ...req.files.map(file => file.path)
      ];
      updateData.mediaTypes = [
        ...comment.mediaTypes,
        ...req.files.map(file => file.mimetype)
      ];
    }

    await comment.update(updateData);

    // Fetch updated comment with author info
    const updatedComment = await LocationComment.findByPk(commentId, {
      include: [{
        model: User,
        as: 'author',
        attributes: ['email', 'profile', 'id']
      }]
    });

    res.json(updatedComment);
  } catch (error) {
    console.error('Error updating comment:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete a comment
router.delete('/:commentId', authenticateToken, async (req, res) => {
  try {
    const { commentId } = req.params;

    const comment = await LocationComment.findByPk(commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Only allow the author or admin to delete
    if (!req.user.isAdmin && comment.authorId !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized to delete this comment' });
    }

    await comment.destroy();
    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ error: error.message });
  }
});

// Vote on a comment
router.post('/:commentId/vote', authenticateToken, async (req, res) => {
  try {
    const { commentId } = req.params;
    const { voteType } = req.body;
    const userId = req.user.userId;

    const comment = await LocationComment.findByPk(commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Prevent voting on your own comment
    if (comment.authorId === userId) {
      return res.status(400).json({ error: 'Cannot vote on your own comment' });
    }

    // Check if user has already voted
    const voters = comment.voters || [];
    const existingVote = voters.find(v => v.userId === userId);

    if (existingVote) {
      // Remove existing vote
      const updatedVoters = voters.filter(v => v.userId !== userId);
      
      // Adjust vote counts
      if (existingVote.voteType === 'upvote') {
        comment.upvotes = Math.max(0, comment.upvotes - 1);
      } else if (existingVote.voteType === 'downvote') {
        comment.downvotes = Math.max(0, comment.downvotes - 1);
      }

      // If same vote type, just remove it (toggle off)
      if (existingVote.voteType === voteType) {
        comment.voters = updatedVoters;
        comment.totalPoints = comment.upvotes - comment.downvotes;
        await comment.save();
        
        return res.json({ 
          success: true, 
          comment: await comment.reload() 
        });
      }

      // If different vote type, update to new vote
      comment.voters = [...updatedVoters, { userId, voteType }];
    } else {
      // Add new vote
      comment.voters = [...voters, { userId, voteType }];
    }

    // Update vote counts
    if (voteType === 'upvote') {
      comment.upvotes += 1;
    } else if (voteType === 'downvote') {
      comment.downvotes += 1;
    }

    comment.totalPoints = comment.upvotes - comment.downvotes;
    await comment.save();

    // Check for new badges for the comment author
    const newBadges = await checkAndAwardBadges(comment.authorId);

    res.json({ 
      success: true, 
      newBadges,
      comment: await comment.reload() 
    });
  } catch (error) {
    console.error('Error processing comment vote:', error);
    res.status(500).json({ error: 'Error processing vote' });
  }
});

// Verify a comment (admin only)
router.post('/:commentId/verify', authenticateToken, async (req, res) => {
  try {
    const { commentId } = req.params;
    const { status } = req.body;

    if (!req.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const comment = await LocationComment.findByPk(commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    await comment.update({ verificationStatus: status });

    // Check for new badges for the comment author
    const newBadges = await checkAndAwardBadges(comment.authorId);

    res.json({ 
      success: true, 
      newBadges,
      comment: await comment.reload() 
    });
  } catch (error) {
    console.error('Error verifying comment:', error);
    res.status(500).json({ error: 'Error verifying comment' });
  }
});

module.exports = router; 