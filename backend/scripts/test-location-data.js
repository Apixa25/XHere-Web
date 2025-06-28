const { Location, User } = require('../models');

async function testLocationData() {
  try {
    console.log('🔍 Testing location data structure...');
    
    const locations = await Location.findAll({
      include: [{
        model: User,
        as: 'creator',
        attributes: ['email', 'profile', 'id']
      }, {
        model: User,
        as: 'officialOwner',
        attributes: ['email', 'profile', 'id']
      }],
      limit: 5
    });
    
    console.log(`Found ${locations.length} locations:`);
    locations.forEach(location => {
      console.log(`- ID: ${location.id}`);
      console.log(`  Text: ${location.content?.text}`);
      console.log(`  isOfficial: ${location.isOfficial}`);
      console.log(`  Creator: ${location.creator?.email}`);
      console.log(`  Official Owner: ${location.officialOwner?.email || 'None'}`);
      console.log(`  Officialized At: ${location.officializedAt || 'Not official'}`);
      console.log('---');
    });
    
  } catch (error) {
    console.error('Error testing location data:', error);
  }
}

testLocationData(); 