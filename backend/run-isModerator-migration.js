const { Sequelize } = require('sequelize');
const config = require('./config/config.js');

const sequelize = new Sequelize(config.database, config.username, config.password, {
  host: config.host,
  port: config.port,
  dialect: config.dialect,
  logging: false
});

async function addIsModeratorColumn() {
  try {
    console.log('🔧 Adding isModerator column to Users table...');
    
    await sequelize.query(`
      ALTER TABLE "Users" 
      ADD COLUMN "isModerator" BOOLEAN NOT NULL DEFAULT false;
    `);
    
    console.log('✅ isModerator column added successfully!');
    
    // Also mark the migration as completed in SequelizeMeta
    await sequelize.query(`
      INSERT INTO "SequelizeMeta" (name) 
      VALUES ('20250110050015-add-isModerator-to-users.js') 
      ON CONFLICT DO NOTHING;
    `);
    
    console.log('✅ Migration marked as completed in SequelizeMeta!');
    
  } catch (error) {
    console.error('❌ Error adding isModerator column:', error.message);
    
    // Check if column already exists
    if (error.message.includes('already exists')) {
      console.log('ℹ️ Column already exists, marking migration as completed...');
      
      try {
        await sequelize.query(`
          INSERT INTO "SequelizeMeta" (name) 
          VALUES ('20250110050015-add-isModerator-to-users.js') 
          ON CONFLICT DO NOTHING;
        `);
        console.log('✅ Migration marked as completed!');
      } catch (metaError) {
        console.error('❌ Error marking migration as completed:', metaError.message);
      }
    }
  } finally {
    await sequelize.close();
  }
}

addIsModeratorColumn(); 