const { User } = require('../models');
const sequelize = require('../config/database');

async function updateNicoleCredits() {
  try {
    console.log('💰 Updating Nicole\'s credits to 10000...');
    
    // Find Nicole by email
    const nicole = await User.findOne({
      where: { email: 'nicole@gmail.com' }
    });

    if (!nicole) {
      console.error('❌ User nicole@gmail.com not found');
      return;
    }

    console.log(`👤 Found user: ${nicole.email} (${nicole.profile?.name || 'No name'})`);
    console.log(`💰 Current credits: ${nicole.credits}`);

    // Update credits to 10000
    await nicole.update({ credits: 10000 });

    // Reload to confirm the update
    await nicole.reload();

    console.log(`✅ Successfully updated credits to: ${nicole.credits}`);
    console.log(`🎉 Nicole now has ${nicole.credits} credits for testing!`);

  } catch (error) {
    console.error('❌ Error updating Nicole\'s credits:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the script
updateNicoleCredits(); 