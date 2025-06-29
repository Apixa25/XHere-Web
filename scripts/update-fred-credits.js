const { User } = require('../models');
const { sequelize } = require('../config/database');

async function updateFredCredits() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Find Fred by email
    const fred = await User.findOne({
      where: { email: 'fred@gmail.com' }
    });

    if (!fred) {
      console.log('❌ User fred@gmail.com not found');
      return;
    }

    console.log('👤 Found Fred:', {
      id: fred.id,
      email: fred.email,
      name: fred.profile?.name,
      currentCredits: fred.credits
    });

    // Update Fred's credits to 10,000
    await fred.update({ credits: 10000 });

    console.log('💰 Updated Fred\'s credits to 10,000');
    console.log('✅ Fred can now test location purchases!');

    await sequelize.close();
    console.log('🔌 Database connection closed');

  } catch (error) {
    console.error('❌ Error updating Fred\'s credits:', error);
    await sequelize.close();
  }
}

updateFredCredits(); 