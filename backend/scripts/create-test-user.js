const User = require('../models/User');
const sequelize = require('../config/database');

async function createTestUser() {
  try {
    console.log('👤 Creating test user...\n');

    // Check if test user already exists
    const existingUser = await User.findOne({ 
      where: { email: 'test@example.com' } 
    });

    if (existingUser) {
      console.log('✅ Test user already exists:');
      console.log(`   Email: ${existingUser.email}`);
      console.log(`   ID: ${existingUser.id}`);
      console.log(`   Credits: ${existingUser.credits}`);
      return existingUser;
    }

    // Create new test user
    const testUser = await User.create({
      email: 'test@example.com',
      password: 'testpassword123',
      profile: {
        name: 'Test User',
        bio: 'Test user for location status system'
      },
      credits: 1000,
      isAdmin: false
    });

    console.log('✅ Test user created successfully:');
    console.log(`   Email: ${testUser.email}`);
    console.log(`   ID: ${testUser.id}`);
    console.log(`   Credits: ${testUser.credits}`);
    console.log(`   Profile: ${testUser.profile.name}`);

    return testUser;

  } catch (error) {
    console.error('❌ Error creating test user:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run the script
createTestUser(); 