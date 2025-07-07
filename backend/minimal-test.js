console.log('🔍 Starting minimal server test...');

try {
  // Test basic imports
  const express = require('express');
  console.log('✅ Express loaded');
  
  const { sequelize } = require('./config/database');
  console.log('✅ Database config loaded');
  
  // Test basic models
  const User = require('./models/User');
  console.log('✅ User model loaded');
  
  const Location = require('./models/Location');
  console.log('✅ Location model loaded');
  
  // Test challenge models
  console.log('🔍 Testing challenge models...');
  const Challenge = require('./models/Challenge');
  console.log('✅ Challenge model loaded');
  
  const ChallengeSubmission = require('./models/ChallengeSubmission');
  console.log('✅ ChallengeSubmission model loaded');
  
  const ChallengeVote = require('./models/ChallengeVote');
  console.log('✅ ChallengeVote model loaded');
  
  const ChallengeReward = require('./models/ChallengeReward');
  console.log('✅ ChallengeReward model loaded');
  
  console.log('🎉 All models loaded successfully!');
  
  // Test database connection
  sequelize.authenticate()
    .then(() => {
      console.log('✅ Database connection successful');
      process.exit(0);
    })
    .catch(err => {
      console.error('❌ Database connection failed:', err.message);
      process.exit(1);
    });
    
} catch (error) {
  console.error('❌ Error in minimal test:', error.message);
  console.error(error.stack);
  process.exit(1);
} 