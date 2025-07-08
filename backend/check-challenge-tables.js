const sequelize = require('./config/database');

async function checkChallengeTables() {
  try {
    console.log('🔍 Checking challenge tables in database...\n');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection successful');
    
    // Check if tables exist
    const tables = await sequelize.showAllSchemas();
    console.log('📋 Available schemas:', tables.map(t => t.name));
    
    // Check specific challenge tables
    const challengeTables = ['challenges', 'challenge_submissions', 'challenge_votes', 'challenge_rewards'];
    
    for (const tableName of challengeTables) {
      try {
        const [results] = await sequelize.query(`SELECT COUNT(*) FROM ${tableName}`);
        console.log(`✅ Table '${tableName}' exists with ${results[0].count} rows`);
      } catch (error) {
        console.log(`❌ Table '${tableName}' does not exist:`, error.message);
      }
    }
    
    // Check if we can query the Challenge model
    try {
      const { Challenge } = require('./models');
      const count = await Challenge.count();
      console.log(`✅ Challenge model works - found ${count} challenges`);
    } catch (error) {
      console.log('❌ Challenge model error:', error.message);
    }
    
  } catch (error) {
    console.error('💥 Database check failed:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkChallengeTables(); 