require('dotenv').config();
const { Sequelize } = require('sequelize');
const User = require('../models/User');
const sequelize = require('../config/database');

async function makeUserAdmin(email) {
  try {
    // Ensure database connection
    await sequelize.authenticate();
    console.log('Database connected successfully');

    // Find the user by email
    const user = await User.findOne({
      where: { email: email }
    });

    if (!user) {
      console.log(`User with email ${email} not found`);
      process.exit(1);
    }

    console.log('Found user:', {
      id: user.id,
      email: user.email,
      name: user.profile?.name,
      currentIsAdmin: user.isAdmin
    });

    // Update to admin
    user.isAdmin = true;
    await user.save();

    console.log('✅ Successfully made user admin!');
    console.log('Updated user:', {
      id: user.id,
      email: user.email,
      name: user.profile?.name,
      isAdmin: user.isAdmin
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Get email from command line argument or use default
const email = process.argv[2] || 'adam@gmail.com';
console.log(`🎯 Making user admin: ${email}`);

makeUserAdmin(email); 