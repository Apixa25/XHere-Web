console.log('🚀 Testing server startup...');

try {
  // Test basic imports
  const express = require('express');
  console.log('✅ Express loaded');
  
  const { sequelize } = require('./config/database');
  console.log('✅ Database config loaded');
  
  // Test model loading
  const User = require('./models/User');
  console.log('✅ User model loaded');
  
  const Location = require('./models/Location');
  console.log('✅ Location model loaded');
  
  // Test challenge models (simplified)
  const Challenge = require('./models/Challenge');
  console.log('✅ Challenge model loaded');
  
  const ChallengeSubmission = require('./models/ChallengeSubmission');
  console.log('✅ ChallengeSubmission model loaded');
  
  const ChallengeVote = require('./models/ChallengeVote');
  console.log('✅ ChallengeVote model loaded');
  
  const ChallengeReward = require('./models/ChallengeReward');
  console.log('✅ ChallengeReward model loaded');
  
  // Test database connection
  sequelize.authenticate()
    .then(async () => {
      console.log('✅ Database connection successful');
      
      // Test model sync (without force)
      try {
        await sequelize.sync({ alter: false });
        console.log('✅ Model sync successful');
        console.log('🎉 Server should start successfully!');
      } catch (syncError) {
        console.error('❌ Model sync failed:', syncError.message);
        console.error(syncError.stack);
      }
      
      await sequelize.close();
      process.exit(0);
    })
    .catch(err => {
      console.error('❌ Database connection failed:', err.message);
      process.exit(1);
    });
    
} catch (error) {
  console.error('❌ Error in server test:', error.message);
  console.error(error.stack);
  process.exit(1);
} 