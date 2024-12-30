const sequelize = require('./database');
const User = require('../models/User');
const Location = require('../models/Location');

const initializeDatabase = async () => {
  try {
    // Create PostGIS extension if it doesn't exist
    await sequelize.query('CREATE EXTENSION IF NOT EXISTS postgis;');

    // Sync all models
    await sequelize.sync({ alter: true });
    console.log('Database synchronized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
};

module.exports = initializeDatabase; 