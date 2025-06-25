const sequelize = require('./database');
const User = require('../models/User');
const Location = require('../models/Location');
const LocationComment = require('../models/LocationComment');
const Message = require('../models/Message');

async function initializeDatabase() {
  try {
    // Check connection
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');

    // Enable PostGIS extension for GEOMETRY support
    await sequelize.query('CREATE EXTENSION IF NOT EXISTS postgis;');
    console.log('PostGIS extension enabled.');

    // Define associations
    Location.belongsTo(User, {
      foreignKey: 'creatorId',
      as: 'creator'
    });
    
    User.hasMany(Location, {
      foreignKey: 'creatorId',
      as: 'locations'
    });

    // LocationComment associations
    LocationComment.belongsTo(Location, {
      foreignKey: 'locationId',
      as: 'location'
    });

    LocationComment.belongsTo(User, {
      foreignKey: 'authorId',
      as: 'author'
    });

    LocationComment.belongsTo(LocationComment, {
      foreignKey: 'parentCommentId',
      as: 'parentComment'
    });

    LocationComment.hasMany(LocationComment, {
      foreignKey: 'parentCommentId',
      as: 'replies'
    });

    Location.hasMany(LocationComment, {
      foreignKey: 'locationId',
      as: 'comments'
    });

    User.hasMany(LocationComment, {
      foreignKey: 'authorId',
      as: 'comments'
    });

    // Message associations
    Message.belongsTo(User, {
      foreignKey: 'senderId',
      as: 'sender'
    });

    Message.belongsTo(User, {
      foreignKey: 'recipientId',
      as: 'recipient'
    });

    Message.belongsTo(Location, {
      foreignKey: 'locationId',
      as: 'location'
    });

    User.hasMany(Message, {
      foreignKey: 'senderId',
      as: 'sentMessages'
    });

    User.hasMany(Message, {
      foreignKey: 'recipientId',
      as: 'receivedMessages'
    });

    Location.hasMany(Message, {
      foreignKey: 'locationId',
      as: 'messages'
    });

    // Sync database with new fields
    await sequelize.sync({ alter: true });
    
    console.log('Database synchronized successfully with messaging system');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

module.exports = initializeDatabase; 