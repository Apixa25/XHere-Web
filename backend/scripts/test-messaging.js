const Message = require('../models/Message');
const User = require('../models/User');
const Location = require('../models/Location');
const sequelize = require('../config/database');

async function testMessaging() {
  try {
    console.log('🧪 Testing messaging system...');
    
    // Get some test users
    const users = await User.findAll({ limit: 2 });
    
    if (users.length < 2) {
      console.log('❌ Need at least 2 users to test messaging');
      return;
    }
    
    const [user1, user2] = users;
    console.log(`👤 User 1: ${user1.email}`);
    console.log(`👤 User 2: ${user2.email}`);
    
    // Get a test location
    const location = await Location.findOne();
    
    // Create a test message
    const testMessage = await Message.create({
      senderId: user1.id,
      recipientId: user2.id,
      subject: 'Test Message',
      content: 'This is a test message from the messaging system!',
      locationId: location?.id || null
    });
    
    console.log('✅ Test message created:', testMessage.id);
    
    // Fetch the message with associations
    const fetchedMessage = await Message.findByPk(testMessage.id, {
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['email', 'profile']
        },
        {
          model: User,
          as: 'recipient',
          attributes: ['email', 'profile']
        },
        {
          model: Location,
          as: 'location',
          attributes: ['id', 'content']
        }
      ]
    });
    
    console.log('📨 Fetched message:', {
      id: fetchedMessage.id,
      subject: fetchedMessage.subject,
      content: fetchedMessage.content,
      sender: fetchedMessage.sender?.email,
      recipient: fetchedMessage.recipient?.email,
      location: fetchedMessage.location?.content?.text?.substring(0, 50) + '...',
      isRead: fetchedMessage.isRead,
      createdAt: fetchedMessage.createdAt
    });
    
    // Test inbox for user2
    const inbox = await Message.findAll({
      where: { recipientId: user2.id },
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['email', 'profile']
        }
      ]
    });
    
    console.log(`📥 User 2 inbox has ${inbox.length} messages`);
    
    // Test sent messages for user1
    const sent = await Message.findAll({
      where: { senderId: user1.id },
      include: [
        {
          model: User,
          as: 'recipient',
          attributes: ['email', 'profile']
        }
      ]
    });
    
    console.log(`📤 User 1 sent ${sent.length} messages`);
    
    // Test unread count
    const unreadCount = await Message.count({
      where: {
        recipientId: user2.id,
        isRead: false
      }
    });
    
    console.log(`📊 User 2 has ${unreadCount} unread messages`);
    
    // Mark message as read
    await fetchedMessage.update({
      isRead: true,
      readAt: new Date()
    });
    
    console.log('✅ Message marked as read');
    
    // Clean up test message
    await testMessage.destroy();
    console.log('🧹 Test message cleaned up');
    
    console.log('🎉 Messaging system test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error testing messaging system:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the test
testMessaging(); 