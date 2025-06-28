const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const User = require('../models/User');
const Location = require('../models/Location');
const { authenticateToken } = require('../middleware/auth');
const { Op } = require('sequelize');

// Get all messages for the current user (inbox)
router.get('/inbox', authenticateToken, async (req, res) => {
  try {
    const messages = await Message.findAll({
      where: { recipientId: req.user.id },
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'email', 'profile']
        },
        {
          model: Location,
          as: 'location',
          attributes: ['id', 'content']
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    res.json(messages);
  } catch (error) {
    console.error('Error fetching inbox:', error);
    res.status(500).json({ error: 'Error fetching messages' });
  }
});

// Get all messages sent by the current user (sent)
router.get('/sent', authenticateToken, async (req, res) => {
  try {
    const messages = await Message.findAll({
      where: { senderId: req.user.id },
      include: [
        {
          model: User,
          as: 'recipient',
          attributes: ['id', 'email', 'profile']
        },
        {
          model: Location,
          as: 'location',
          attributes: ['id', 'content']
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    res.json(messages);
  } catch (error) {
    console.error('Error fetching sent messages:', error);
    res.status(500).json({ error: 'Error fetching sent messages' });
  }
});

// Send a new message
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { recipientId, subject, content, locationId } = req.body;
    
    // Validate required fields
    if (!recipientId || !content) {
      return res.status(400).json({ error: 'Recipient and content are required' });
    }
    
    // Check if recipient exists
    const recipient = await User.findByPk(recipientId);
    if (!recipient) {
      return res.status(404).json({ error: 'Recipient not found' });
    }
    
    // Prevent sending message to yourself
    if (recipientId === req.user.id) {
      return res.status(400).json({ error: 'Cannot send message to yourself' });
    }
    
    // If locationId is provided, verify it exists
    if (locationId) {
      const location = await Location.findByPk(locationId);
      if (!location) {
        return res.status(404).json({ error: 'Location not found' });
      }
    }
    
    const message = await Message.create({
      senderId: req.user.id,
      recipientId,
      subject: subject || 'New Message',
      content,
      locationId
    });
    
    // Fetch the created message with associations
    const createdMessage = await Message.findByPk(message.id, {
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'email', 'profile']
        },
        {
          model: User,
          as: 'recipient',
          attributes: ['id', 'email', 'profile']
        },
        {
          model: Location,
          as: 'location',
          attributes: ['id', 'content']
        }
      ]
    });
    
    res.status(201).json(createdMessage);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Error sending message' });
  }
});

// Mark message as read
router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    const message = await Message.findByPk(req.params.id);
    
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }
    
    // Only the recipient can mark a message as read
    if (message.recipientId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    await message.update({
      isRead: true,
      readAt: new Date()
    });
    
    res.json({ message: 'Message marked as read' });
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ error: 'Error updating message' });
  }
});

// Delete a message
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const message = await Message.findByPk(req.params.id);
    
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }
    
    // Only the sender or recipient can delete a message
    if (message.senderId !== req.user.id && message.recipientId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    await message.destroy();
    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ error: 'Error deleting message' });
  }
});

// Get unread message count
router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    const count = await Message.count({
      where: {
        recipientId: req.user.id,
        isRead: false
      }
    });
    
    res.json({ count });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ error: 'Error fetching unread count' });
  }
});

// Get conversation between two users
router.get('/conversation/:userId', authenticateToken, async (req, res) => {
  try {
    const otherUserId = req.params.userId;
    
    // Prevent getting conversation with yourself
    if (otherUserId === req.user.id) {
      return res.status(400).json({ error: 'Cannot get conversation with yourself' });
    }

    const messages = await Message.findAll({
      where: {
        [Op.or]: [
          { senderId: req.user.id, recipientId: otherUserId },
          { senderId: otherUserId, recipientId: req.user.id }
        ]
      },
      include: [
        { model: User, as: 'sender', attributes: ['email', 'profile', 'id'] },
        { model: User, as: 'recipient', attributes: ['email', 'profile', 'id'] }
      ],
      order: [['createdAt', 'ASC']]
    });

    res.json(messages);
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({ error: 'Error fetching conversation' });
  }
});

module.exports = router; 