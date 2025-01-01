require('dotenv').config();
const { Sequelize } = require('sequelize');
const User = require('../models/User');
const sequelize = require('../config/database');

async function makeAdmin() {
  try {
    // Ensure database connection
    await sequelize.authenticate();
    console.log('Database connected successfully');

    // Find the user
    const user = await User.findOne({
      where: {
        email: 'stevensills2@gmail.com'
      }
    });

    if (!user) {
      console.log('User not found');
      process.exit(1);
    }

    // Update to admin
    user.isAdmin = true;
    await user.save();

    console.log('Successfully made user admin');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

makeAdmin(); 