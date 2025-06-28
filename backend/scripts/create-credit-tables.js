const sequelize = require('../config/database');
const CreditTransaction = require('../models/CreditTransaction');
const UserCreditStats = require('../models/UserCreditStats');

async function createCreditTables() {
  try {
    console.log('🏗️ Creating credit system tables...\n');

    // Sync the credit transaction table
    console.log('📊 Creating CreditTransactions table...');
    await CreditTransaction.sync({ force: false });
    console.log('✅ CreditTransactions table created/verified\n');

    // Sync the user credit stats table
    console.log('📈 Creating UserCreditStats table...');
    await UserCreditStats.sync({ force: false });
    console.log('✅ UserCreditStats table created/verified\n');

    console.log('🎉 All credit system tables created successfully!');
    
    // Test the tables by checking if they exist
    const [results] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('CreditTransactions', 'UserCreditStats')
      ORDER BY table_name;
    `);
    
    console.log('\n📋 Existing credit tables:');
    results.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });

  } catch (error) {
    console.error('❌ Error creating credit tables:', error);
    console.error('Error details:', error.message);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

// Run the table creation
createCreditTables(); 