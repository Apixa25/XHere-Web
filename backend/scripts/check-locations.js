require('dotenv').config();
const Location = require('../models/Location');
const sequelize = require('../config/database');

async function checkLocations() {
  try {
    await sequelize.authenticate();
    console.log('Database connected');

    // Simple query to get all locations
    const locations = await Location.findAll();

    console.log('\nExisting Locations:', locations.length);
    if (locations.length === 0) {
      console.log('No locations found in database');
    } else {
      locations.forEach(location => {
        console.log('\n------------------------');
        console.log(`ID: ${location.id}`);
        console.log(`Creator ID: ${location.creatorId}`);
        console.log(`Created at: ${location.createdAt}`);
        if (location.coordinates) {
          console.log(`Coordinates: ${JSON.stringify(location.coordinates)}`);
        }
        if (location.content) {
          console.log(`Content: ${JSON.stringify(location.content, null, 2)}`);
        }
      });
    }

    // Show database connection info
    console.log('\nDatabase Connection Info:');
    console.log('Database name:', sequelize.config.database);
    console.log('Host:', sequelize.config.host);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkLocations(); 