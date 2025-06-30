const sequelize = require('../config/database');

async function markMigrationComplete() {
  try {
    await sequelize.query(
      'INSERT INTO "SequelizeMeta" (name) VALUES (\'20250110050005-add-location-creation-transaction-type.js\') ON CONFLICT DO NOTHING'
    );
    console.log('✅ Transaction type migration marked as completed');
  } catch (error) {
    console.error('❌ Error marking migration as completed:', error);
  } finally {
    await sequelize.close();
  }
}

markMigrationComplete(); 