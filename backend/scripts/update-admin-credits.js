const { User } = require('../models');
const sequelize = require('../config/database');

async function updateAdminCredits() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    // Find the admin user by email
    const adminUser = await User.findOne({
      where: { email: 'stevensills2@gmail.com' }
    });

    if (!adminUser) {
      console.log('❌ Admin user not found with email: stevensills2@gmail.com');
      return;
    }

    console.log(`👤 Found admin user: ${adminUser.profile?.name || adminUser.email}`);
    console.log(`💰 Current credits: ${adminUser.credits}`);

    // Update credits to 1,500
    await adminUser.update({ credits: 1500 });

    // Reload the user to get updated data
    await adminUser.reload();

    console.log(`✅ Credits updated successfully!`);
    console.log(`💰 New credit balance: ${adminUser.credits}`);
    console.log(`👤 User: ${adminUser.profile?.name || adminUser.email}`);
    console.log(`📧 Email: ${adminUser.email}`);

  } catch (error) {
    console.error('❌ Error updating admin credits:', error);
  } finally {
    if (sequelize) {
      await sequelize.close();
      console.log('🔌 Database connection closed.');
    }
  }
}

// Run the script
updateAdminCredits(); 