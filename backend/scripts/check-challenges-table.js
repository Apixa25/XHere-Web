const { sequelize } = require('../config/database');

async function checkChallengesTable() {
  try {
    console.log('🔍 Checking challenges table structure...');
    
    // Check if table exists
    const tableExists = await sequelize.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'challenges')",
      { type: sequelize.QueryTypes.SELECT }
    );
    
    if (!tableExists[0].exists) {
      console.log('❌ Challenges table does not exist!');
      return;
    }
    
    // Get table columns
    const columns = await sequelize.query(
      "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'challenges' ORDER BY ordinal_position",
      { type: sequelize.QueryTypes.SELECT }
    );
    
    console.log('📋 Challenges table columns:');
    columns.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`);
    });
    
    // Check indexes
    const indexes = await sequelize.query(
      "SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'challenges'",
      { type: sequelize.QueryTypes.SELECT }
    );
    
    console.log('\n🔗 Indexes:');
    indexes.forEach(idx => {
      console.log(`  - ${idx.indexname}: ${idx.indexdef}`);
    });
    
  } catch (error) {
    console.error('❌ Error checking challenges table:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkChallengesTable(); 