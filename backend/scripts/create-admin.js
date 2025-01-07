require('dotenv').config();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const sequelize = require('../config/database');

async function createAdmin() {
  try {
    await sequelize.authenticate();
    console.log('Database connected');

    const adminData = {
      email: 'stevensills2@gmail.com',
      password: await bcrypt.hash('1234', 10), // Replace with desired password
      isAdmin: true,
      profile: {
        name: 'Steven Sills II'
      },
      credits: 100, // or whatever starting credits you want
      reputation: 0,
      badges: []
    };

    const newAdmin = await User.create(adminData);
    
    console.log('Admin user created successfully:', {
      id: newAdmin.id,
      email: newAdmin.email,
      isAdmin: newAdmin.isAdmin
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createAdmin(); 