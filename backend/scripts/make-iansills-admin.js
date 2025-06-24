require('dotenv').config();
const { Sequelize } = require('sequelize');
const User = require('../models/User');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

async function makeIansillsAdmin() {
  try {
    // Ensure database connection
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');

    const email = 'iansills04@gmail.com';
    const name = 'Ian Sills';

    // Find the user by email
    let user = await User.findOne({
      where: { email: email }
    });

    if (!user) {
      console.log(`👤 User ${email} not found. Creating new admin user...`);
      
      // Create a new admin user
      const hashedPassword = await bcrypt.hash('temporaryPassword123', 10);
      
      user = await User.create({
        email: email,
        password: hashedPassword,
        profile: {
          name: name,
          pictureUrl: null
        },
        isAdmin: true,
        credits: 1000, // Give some starting credits
        badges: []
      });

      console.log('✅ Created new admin user:', {
        id: user.id,
        email: user.email,
        name: user.profile?.name,
        isAdmin: user.isAdmin,
        credits: user.credits
      });
      
      console.log('⚠️  IMPORTANT: User was created with temporary password: temporaryPassword123');
      console.log('🔐 Please have the user change their password on first login!');
      
    } else {
      console.log('👤 Found existing user:', {
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
    }
    
    console.log('\n🎉 Success! Ian Sills is now an admin user.');
    console.log('📧 Email: iansills04@gmail.com');
    console.log('👑 Admin Status: Active');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

console.log('🎯 Making Ian Sills (iansills04@gmail.com) an admin...');
makeIansillsAdmin(); 