const sequelize = require('./database');
const User = require('../models/User');
const Location = require('../models/Location');

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

    // Sync database with new fields
    await sequelize.sync({ alter: true });
    
    console.log('Database synchronized successfully with new gamification fields');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

module.exports = initializeDatabase; 