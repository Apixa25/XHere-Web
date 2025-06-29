const { User } = require('../models');
const sequelize = require('../config/database');

async function updateFredCredits() {
  try {
    console.log('💰 Updating Fred\'s credits to 10000...');
    
    // Find Fred by email
    const fred = await User.findOne({
      where: { email: 'fred@gmail.com' }
    });

    if (!fred) {
      console.error('❌ User fred@gmail.com not found');
      return;
    }

    console.log(`👤 Found user: ${fred.email} (${fred.profile?.name || 'No name'})`);
    console.log(`💰 Current credits: ${fred.credits}`);

    // Update credits to 10000
    await fred.update({ credits: 10000 });

    // Reload to confirm the update
    await fred.reload();

    console.log(`✅ Successfully updated credits to: ${fred.credits}`);
    console.log(`🎉 Fred now has ${fred.credits} credits for testing!`);

  } catch (error) {
    console.error('❌ Error updating Fred\'s credits:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the script
updateFredCredits(); 