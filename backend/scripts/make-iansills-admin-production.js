require('dotenv').config();
const { Sequelize } = require('sequelize');
const User = require('../models/User');
const sequelize = require('../config/database');

async function makeIansillsAdminProduction() {
  try {
    // Ensure database connection
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');

    const email = 'iansills04@gmail.com';

    // Find the user by email
    const user = await User.findOne({
      where: { email: email }
    });

    if (!user) {
      console.log(`❌ User ${email} not found in the database`);
      console.log('💡 Make sure you are connected to the correct database environment');
      process.exit(1);
    }

    console.log('👤 Found user:', {
      id: user.id,
      email: user.email,
      name: user.profile?.name,
      currentIsAdmin: user.isAdmin,
      credits: user.credits
    });

    // Update to admin if not already
    if (!user.isAdmin) {
      user.isAdmin = true;
      await user.save();
      console.log('✅ Successfully made user admin!');
    } else {
      console.log('ℹ️  User is already an admin');
    }

    console.log('📊 Updated user info:', {
      id: user.id,
      email: user.email,
      name: user.profile?.name,
      isAdmin: user.isAdmin,
      credits: user.credits
    });
    
    console.log('\n🎉 Success! Ian Sills is now an admin user.');
    console.log('📧 Email: iansills04@gmail.com');
    console.log('👑 Admin Status: Active');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

console.log('🎯 Making Ian Sills (iansills04@gmail.com) an admin on production...');
makeIansillsAdminProduction(); 