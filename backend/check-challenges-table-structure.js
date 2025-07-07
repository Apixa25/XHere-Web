const { sequelize } = require('./config/database');

async function checkTableStructure() {
  try {
    console.log('🔍 Checking challenges table structure...');
    
    // Check if table exists
    const tableExists = await sequelize.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'challenges')",
      { type: sequelize.QueryTypes.SELECT }
    );
    
    if (!tableExists[0].exists) {
      console.log('❌ Challenges table does not exist!');
      console.log('💡 You may need to run the migration first.');
      return;
    }
    
    // Get table columns
    const columns = await sequelize.query(
      "SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'challenges' ORDER BY ordinal_position",
      { type: sequelize.QueryTypes.SELECT }
    );
    
    console.log('📋 Challenges table columns:');
    columns.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable}, default: ${col.column_default})`);
    });
    
    // Check if the problematic columns exist
    const hasStartDate = columns.some(col => col.column_name === 'start_date');
    const hasEndDate = columns.some(col => col.column_name === 'end_date');
    const hasVotingEndDate = columns.some(col => col.column_name === 'voting_end_date');
    
    console.log('\n🔍 Column existence check:');
    console.log(`  - start_date: ${hasStartDate ? '✅' : '❌'}`);
    console.log(`  - end_date: ${hasEndDate ? '✅' : '❌'}`);
    console.log(`  - voting_end_date: ${hasVotingEndDate ? '✅' : '❌'}`);
    
    if (!hasStartDate || !hasEndDate) {
      console.log('\n⚠️  Missing required columns! The migration may not have run properly.');
      console.log('💡 Try running: npx sequelize-cli db:migrate');
    }
    
  } catch (error) {
    console.error('❌ Error checking table structure:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkTableStructure(); 