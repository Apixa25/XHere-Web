const { User } = require('../models');
const sequelize = require('../config/database');

async function checkUserCredits() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Check the specific user (Terry)
    const user = await User.findOne({
      where: { email: 'terry@gmail.com' }
    });

    if (user) {
      console.log('👤 User found:', {
        id: user.id,
        email: user.email,
        credits: user.credits,
        trustLevel: user.trustLevel,
        reputationScore: user.reputationScore,
        totalDownvotesReceived: user.totalDownvotesReceived
      });
    } else {
      console.log('❌ User not found');
    }

    // Check all users' credits
    const allUsers = await User.findAll({
      attributes: ['id', 'email', 'credits', 'trustLevel', 'reputationScore'],
      order: [['email', 'ASC']]
    });

    console.log('\n📊 All users credit summary:');
    allUsers.forEach(user => {
      console.log(`${user.email}: ${user.credits} credits, ${user.trustLevel} trust level, ${user.reputationScore} reputation`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
  }
}

checkUserCredits(); 