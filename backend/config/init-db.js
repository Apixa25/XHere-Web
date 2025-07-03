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

    // No associations here; all are defined in model associate methods

    // Sync database without altering existing schema since fields already exist
    await sequelize.sync({ alter: false, force: false });
    
    console.log('Database synchronized successfully with messaging system');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

module.exports = initializeDatabase; 