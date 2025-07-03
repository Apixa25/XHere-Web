const ReputationService = require('../services/reputationService');
const User = require('../models/User');
const Location = require('../models/Location');
const { Op } = require('sequelize');

async function testNewPostingRules() {
  console.log('🧪 Testing new trust-based posting rules...\n');

  try {
    // Test 1: New user with 0 locations
    console.log('📋 Test 1: New user with 0 locations');
    const newUser = await User.findOne({ where: { trustLevel: 'new' } });
    if (newUser) {
      const result1 = await ReputationService.canUserPostLocation(newUser.id, 'general');
      console.log('General location:', result1);
      
      const result2 = await ReputationService.canUserPostLocation(newUser.id, 'for_sale');
      console.log('Paid location:', result2);
    }

    // Test 2: Find a new user with exactly 2 locations
    console.log('\n📋 Test 2: New user with 2 locations (still in first 3)');
    const users = await User.findAll({ where: { trustLevel: 'new' } });
    let newUserWith2 = null;
    
    for (const user of users) {
      const locationCount = await Location.count({ where: { creatorId: user.id } });
      if (locationCount === 2) {
        newUserWith2 = user;
        break;
      }
    }
    
    if (newUserWith2) {
      const result1 = await ReputationService.canUserPostLocation(newUserWith2.id, 'general');
      console.log('General location:', result1);
      
      const result2 = await ReputationService.canUserPostLocation(newUserWith2.id, 'for_sale');
      console.log('Paid location:', result2);
    } else {
      console.log('No new user with exactly 2 locations found');
    }

    // Test 3: Find a new user with exactly 1 location (still in first 3)
    console.log('\n📋 Test 3: New user with 1 location (still in first 3)');
    let newUserWith1 = null;
    
    for (const user of users) {
      const locationCount = await Location.count({ where: { creatorId: user.id } });
      if (locationCount === 1) {
        newUserWith1 = user;
        break;
      }
    }
    
    if (newUserWith1) {
      const result1 = await ReputationService.canUserPostLocation(newUserWith1.id, 'general');
      console.log('General location:', result1);
      
      const result2 = await ReputationService.canUserPostLocation(newUserWith1.id, 'for_sale');
      console.log('Paid location:', result2);
    } else {
      console.log('No new user with exactly 1 location found');
    }

    // Test 4: Trusted user
    console.log('\n📋 Test 4: Trusted user');
    const trustedUser = await User.findOne({ where: { trustLevel: 'trusted' } });
    if (trustedUser) {
      const result1 = await ReputationService.canUserPostLocation(trustedUser.id, 'general');
      console.log('General location:', result1);
      
      const result2 = await ReputationService.canUserPostLocation(trustedUser.id, 'for_sale');
      console.log('Paid location:', result2);
    }

    // Test 5: Verified user
    console.log('\n📋 Test 5: Verified user');
    const verifiedUser = await User.findOne({ where: { trustLevel: 'verified' } });
    if (verifiedUser) {
      const result1 = await ReputationService.canUserPostLocation(verifiedUser.id, 'general');
      console.log('General location:', result1);
      
      const result2 = await ReputationService.canUserPostLocation(verifiedUser.id, 'for_sale');
      console.log('Paid location:', result2);
    }

    console.log('\n✅ Testing completed!');

  } catch (error) {
    console.error('❌ Error testing posting rules:', error);
  }
}

// Run the test
testNewPostingRules().then(() => {
  console.log('🏁 Test script finished');
  process.exit(0);
}).catch(error => {
  console.error('💥 Test script failed:', error);
  process.exit(1);
}); 