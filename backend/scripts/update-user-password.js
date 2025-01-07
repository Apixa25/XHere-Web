require('dotenv').config();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const sequelize = require('../config/database');

async function updatePassword() {
  try {
    await sequelize.authenticate();
    console.log('Database connected');

    const email = 'stevensills2@gmail.com'; // The user's email
    const newPassword = 'your-new-password'; // The new password

    const user = await User.findOne({ where: { email } });
    if (!user) {
      console.log('User not found');
      process.exit(1);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    console.log('Password updated successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

updatePassword(); 