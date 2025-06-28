const sequelize = require('../config/database');

async function addCreditsColumn() {
  try {
    console.log('🔧 Adding credits column to Users table...');
    
    // Check if credits column already exists
    const [results] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Users' AND column_name = 'credits'
    `);
    
    if (results.length > 0) {
      console.log('✅ Credits column already exists');
    } else {
      // Add credits column
      await sequelize.query(`
        ALTER TABLE "Users" 
        ADD COLUMN credits INTEGER DEFAULT 100 NOT NULL
      `);
      console.log('✅ Credits column added successfully');
    }
    
    // Update existing users to have 100 credits if they don't have any
    const [updateResults] = await sequelize.query(`
      UPDATE "Users" 
      SET credits = 100 
      WHERE credits IS NULL
    `);
    console.log(`✅ Updated ${updateResults.rowCount} users with default credits`);
    
  } catch (error) {
    console.error('❌ Error adding credits column:', error.message);
  } finally {
    await sequelize.close();
  }
}

addCreditsColumn(); 