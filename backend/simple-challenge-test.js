const express = require('express');
const app = express();

// Simple test endpoint
app.get('/test', (req, res) => {
  res.json({ message: 'Challenge test endpoint working!' });
});

app.listen(3001, () => {
  console.log('🧪 Test server running on port 3001');
});

// Test the challenge service directly
setTimeout(async () => {
  try {
    console.log('🔍 Testing challenge service...');
    const challengeService = require('./services/challengeService');
    
    console.log('1️⃣ Testing getActiveChallenges...');
    const challenges = await challengeService.getActiveChallenges();
    console.log('✅ getActiveChallenges successful');
    console.log('📊 Challenges found:', challenges.length);
    
    console.log('2️⃣ Testing getUserSubmissions...');
    // Use a real UUID format
    const submissions = await challengeService.getUserSubmissions('b146ad83-8f84-47fd-8549-6fc766d71d5e');
    console.log('✅ getUserSubmissions successful');
    console.log('📊 Submissions found:', submissions.length);
    
  } catch (error) {
    console.log('❌ Challenge service test failed:', error.message);
    console.log('📋 Full error:', error);
  }
}, 1000); 