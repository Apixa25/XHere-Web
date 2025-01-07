require('dotenv').config();
const User = require('../models/User');
const sequelize = require('../config/database');

async function listUsers() {
  try {
    await sequelize.authenticate();
    console.log('Database connected');

    const users = await User.findAll({
      attributes: ['id', 'email', 'createdAt']
    });

    console.log('\nExisting users:');
    users.forEach(user => {
      console.log(`- ${user.email} (ID: ${user.id}, Created: ${user.createdAt})`);
    });

    if (users.length === 0) {
      console.log('No users found in database');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

listUsers(); 