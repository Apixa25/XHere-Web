require('dotenv').config();
const { Sequelize } = require('sequelize');
const Location = require('../models/Location');
const User = require('../models/User');

async function createTestLocation() {
  try {
    const sequelize = new Sequelize('location_app', process.env.DB_USER, process.env.DB_PASSWORD, {
      host: process.env.DB_HOST || 'localhost',
      dialect: 'postgres'
    });

    console.log('Connected to database');

    // Find admin user
    const admin = await User.findOne({
      where: {
        email: 'stevensills2@gmail.com'
      }
    });

    if (!admin) {
      console.log('Admin user not found');
      return;
    }

    // Create test location
    const testLocation = await Location.create({
      location: { type: 'Point', coordinates: [-122.4194, 37.7749] }, // San Francisco coordinates
      content: {
        text: 'Test location in San Francisco',
        mediaUrls: [],
        mediaTypes: [],
        isAnonymous: false
      },
      creatorId: admin.id,
      upvotes: 0,
      downvotes: 0,
      verificationStatus: 'unverified',
      voters: [],
      totalPoints: 0,
      pointsHistory: [],
      autoDelete: false,
      credits: 0
    });

    console.log('\nTest location created successfully:');
    console.log(JSON.stringify(testLocation, null, 2));

    // Verify location was created
    const locations = await Location.findAll({
      where: {
        creatorId: admin.id
      }
    });

    console.log('\nAll locations for admin:');
    console.log(JSON.stringify(locations, null, 2));

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createTestLocation(); 