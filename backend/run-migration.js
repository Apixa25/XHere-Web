const { sequelize } = require('./config/database');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    console.log('🔍 Running challenge tables migration...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'migrations', '20250110050013-create-challenge-tables.js');
    const migration = require(migrationPath);
    
    console.log('✅ Migration file loaded');
    
    // Run the migration
    await migration.up(sequelize.getQueryInterface(), sequelize.Sequelize);
    
    console.log('✅ Migration completed successfully');
    
    // Verify tables were created
    const tables = await sequelize.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'challenge%'",
      { type: sequelize.QueryTypes.SELECT }
    );
    
    console.log('📋 Challenge tables found:', tables.map(t => t.table_name));
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error.stack);
  } finally {
    await sequelize.close();
  }
}

runMigration(); 