const { sequelize } = require('./config/database');

async function createChallengesTable() {
  try {
    console.log('🔧 Creating challenges table...');
    
    // Drop the table if it exists (for testing)
    await sequelize.query('DROP TABLE IF EXISTS challenges CASCADE');
    console.log('✅ Dropped existing challenges table');
    
    // Create the table with the correct structure
    await sequelize.query(`
      CREATE TABLE challenges (
        id SERIAL PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        description TEXT NOT NULL,
        type VARCHAR(20) DEFAULT 'weekly',
        status VARCHAR(20) DEFAULT 'draft',
        start_date TIMESTAMP NOT NULL,
        end_date TIMESTAMP NOT NULL,
        voting_end_date TIMESTAMP,
        criteria JSONB NOT NULL,
        rewards JSONB NOT NULL,
        max_submissions INTEGER DEFAULT 1000,
        min_votes_required INTEGER DEFAULT 5,
        created_by UUID NOT NULL REFERENCES users(id),
        featured BOOLEAN DEFAULT false,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Created challenges table');
    
    // Create indexes
    await sequelize.query('CREATE INDEX challenges_status ON challenges (status)');
    await sequelize.query('CREATE INDEX challenges_start_date ON challenges (start_date)');
    await sequelize.query('CREATE INDEX challenges_end_date ON challenges (end_date)');
    await sequelize.query('CREATE INDEX challenges_type ON challenges (type)');
    await sequelize.query('CREATE INDEX challenges_featured ON challenges (featured)');
    console.log('✅ Created indexes');
    
    // Verify the table structure
    const columns = await sequelize.query(
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'challenges' ORDER BY ordinal_position",
      { type: sequelize.QueryTypes.SELECT }
    );
    
    console.log('📋 Verified table structure:');
    columns.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type})`);
    });
    
    console.log('🎉 Challenges table created successfully!');
    
  } catch (error) {
    console.error('❌ Error creating challenges table:', error.message);
    console.error(error.stack);
  } finally {
    await sequelize.close();
  }
}

createChallengesTable(); 