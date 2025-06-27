const sequelize = require('../config/database');

async function addKeywordsColumn() {
  try {
    console.log('🔧 Adding keywords column to Locations table...');
    
    // Check if column already exists
    const [existingColumns] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Locations' AND column_name = 'keywords'
    `);
    
    if (existingColumns.length > 0) {
      console.log('✅ Keywords column already exists!');
      return;
    }
    
    // Add the keywords column
    await sequelize.query(`
      ALTER TABLE "Locations" 
      ADD COLUMN "keywords" JSONB DEFAULT '[]'::jsonb NOT NULL
    `);
    
    console.log('✅ Keywords column added successfully!');
    
  } catch (error) {
    console.error('❌ Error adding keywords column:', error);
  } finally {
    await sequelize.close();
  }
}

addKeywordsColumn(); 