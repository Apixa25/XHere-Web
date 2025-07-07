const { sequelize } = require('./config/database');

async function testFinalFix() {
  try {
    console.log('🎯 Testing final fix for challenge models...');
    
    // Test loading all challenge models
    const Challenge = require('./models/Challenge');
    console.log('✅ Challenge model loaded');
    
    const ChallengeSubmission = require('./models/ChallengeSubmission');
    console.log('✅ ChallengeSubmission model loaded');
    
    const ChallengeVote = require('./models/ChallengeVote');
    console.log('✅ ChallengeVote model loaded');
    
    const ChallengeReward = require('./models/ChallengeReward');
    console.log('✅ ChallengeReward model loaded');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection successful');
    
    // Test model sync (this should work now)
    await sequelize.sync({ alter: false });
    console.log('✅ Model sync successful');
    
    // Check if tables exist
    const tables = await sequelize.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'challenge%'",
      { type: sequelize.QueryTypes.SELECT }
    );
    
    console.log('📋 Challenge tables found:');
    tables.forEach(table => {
      console.log(`  - ${table.table_name}`);
    });
    
    console.log('🎉 All challenge models working correctly!');
    console.log('🚀 Backend should start successfully now!');
    
  } catch (error) {
    console.error('❌ Error in final test:', error.message);
    console.error(error.stack);
  } finally {
    await sequelize.close();
  }
}

testFinalFix(); 