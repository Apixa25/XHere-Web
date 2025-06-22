const sequelize = require('./database');
const User = require('../models/User');
const Location = require('../models/Location');
const LocationComment = require('../models/LocationComment');

async function initializeDatabase() {
  try {
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

    // Sync database with new fields
    await sequelize.sync({ alter: true });
    
    console.log('Database synchronized successfully with new gamification fields and comment system');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

module.exports = initializeDatabase; 