const { Location, User } = require('../models');
const sequelize = require('../config/database');

async function checkVoters() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Check the specific location that's having issues
    const locationId = 'ff01cd5e-1d79-4377-85f3-dbf70deb123a';
    
    const location = await Location.findByPk(locationId);
    if (!location) {
      console.log('❌ Location not found');
      return;
    }

    console.log('📍 Location found:', {
      id: location.id,
      upvotes: location.upvotes,
      downvotes: location.downvotes,
      voters: location.voters,
      votersType: typeof location.voters,
      votersLength: Array.isArray(location.voters) ? location.voters.length : 'Not an array'
    });

    // Check if voters is an array and has valid data
    if (!Array.isArray(location.voters)) {
      console.log('⚠️ Voters is not an array, fixing...');
      location.voters = [];
      await location.save();
      console.log('✅ Fixed voters array');
    } else {
      console.log('✅ Voters is an array with', location.voters.length, 'entries');
      
      // Check each voter entry
      location.voters.forEach((voter, index) => {
        console.log(`Voter ${index}:`, voter);
      });
    }

    // Also check Nicole's user ID
    const nicole = await User.findOne({ where: { email: 'nicole@gmail.com' } });
    if (nicole) {
      console.log('👤 Nicole found:', {
        id: nicole.id,
        email: nicole.email
      });
      
      // Check if Nicole is in the voters array
      const nicoleVote = location.voters.find(v => v.userId === nicole.id);
      if (nicoleVote) {
        console.log('⚠️ Nicole already has a vote:', nicoleVote);
      } else {
        console.log('✅ Nicole has no vote yet');
      }
    } else {
      console.log('❌ Nicole not found');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
  }
}

checkVoters(); 