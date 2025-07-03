const User = require('../models/User');
const Location = require('../models/Location');
const sequelize = require('../config/database');

async function populateDownvoteStats() {
  const transaction = await sequelize.transaction();
  
  try {
    console.log('🔄 Starting downvote statistics population...');
    
    // Get all users
    const users = await User.findAll({ transaction });
    console.log(`📊 Found ${users.length} users to process`);
    
    let updatedCount = 0;
    
    for (const user of users) {
      // Get all locations for this user
      const locations = await Location.findAll({
        where: { creatorId: user.id },
        transaction
      });
      
      // Calculate downvote statistics
      let totalDownvotes = 0;
      let downvotedLocations = 0;
      let lastDownvoteDate = null;
      
      for (const location of locations) {
        const downvotes = location.downvotes || 0;
        totalDownvotes += downvotes;
        
        if (downvotes > 0) {
          downvotedLocations++;
          
          // Track the most recent downvote date
          if (location.updatedAt && (!lastDownvoteDate || location.updatedAt > lastDownvoteDate)) {
            lastDownvoteDate = location.updatedAt;
          }
        }
      }
      
      // Update user with calculated statistics
      await user.update({
        totalDownvotesReceived: totalDownvotes,
        downvotedLocationsCount: downvotedLocations,
        lastDownvoteDate: lastDownvoteDate
      }, { transaction });
      
      updatedCount++;
      
      if (updatedCount % 10 === 0) {
        console.log(`✅ Processed ${updatedCount}/${users.length} users`);
      }
    }
    
    await transaction.commit();
    console.log(`🎉 Successfully updated ${updatedCount} users with downvote statistics`);
    
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error populating downvote stats:', error);
    throw error;
  }
}

// Run the script if called directly
if (require.main === module) {
  populateDownvoteStats()
    .then(() => {
      console.log('✅ Downvote statistics population completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Failed to populate downvote statistics:', error);
      process.exit(1);
    });
}

module.exports = populateDownvoteStats; 