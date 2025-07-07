const sequelize = require('../config/database');

async function testConnection() {
  try {
    console.log('🔍 Testing database connection...');
    await sequelize.authenticate();
    console.log('✅ Database connection successful!');
    
    // Test a simple query
    const result = await sequelize.query('SELECT COUNT(*) as count FROM "Locations"');
    console.log(`📊 Total locations in database: ${result[0][0].count}`);
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  } finally {
    await sequelize.close();
  }
}

testConnection(); 