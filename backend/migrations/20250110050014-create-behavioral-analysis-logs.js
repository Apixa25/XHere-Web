const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function up() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Creating behavioral_analysis_logs table...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS behavioral_analysis_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        risk_score INTEGER NOT NULL DEFAULT 0,
        risk_level VARCHAR(20) NOT NULL DEFAULT 'low',
        flags_count INTEGER NOT NULL DEFAULT 0,
        is_suspicious BOOLEAN NOT NULL DEFAULT false,
        analysis_data JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Create indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_behavioral_analysis_user_id 
      ON behavioral_analysis_logs(user_id)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_behavioral_analysis_risk_score 
      ON behavioral_analysis_logs(risk_score DESC)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_behavioral_analysis_is_suspicious 
      ON behavioral_analysis_logs(is_suspicious)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_behavioral_analysis_created_at 
      ON behavioral_analysis_logs(created_at DESC)
    `);

    // Create a function to update the updated_at timestamp
    await client.query(`
      CREATE OR REPLACE FUNCTION update_behavioral_analysis_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);

    // Create trigger to automatically update updated_at
    await client.query(`
      CREATE TRIGGER update_behavioral_analysis_updated_at
        BEFORE UPDATE ON behavioral_analysis_logs
        FOR EACH ROW
        EXECUTE FUNCTION update_behavioral_analysis_updated_at()
    `);

    console.log('✅ behavioral_analysis_logs table created successfully');
    
  } catch (error) {
    console.error('❌ Error creating behavioral_analysis_logs table:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function down() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Dropping behavioral_analysis_logs table...');
    
    // Drop trigger first
    await client.query(`
      DROP TRIGGER IF EXISTS update_behavioral_analysis_updated_at 
      ON behavioral_analysis_logs
    `);
    
    // Drop function
    await client.query(`
      DROP FUNCTION IF EXISTS update_behavioral_analysis_updated_at()
    `);
    
    // Drop indexes
    await client.query(`
      DROP INDEX IF EXISTS idx_behavioral_analysis_user_id
    `);
    
    await client.query(`
      DROP INDEX IF EXISTS idx_behavioral_analysis_risk_score
    `);
    
    await client.query(`
      DROP INDEX IF EXISTS idx_behavioral_analysis_is_suspicious
    `);
    
    await client.query(`
      DROP INDEX IF EXISTS idx_behavioral_analysis_created_at
    `);
    
    // Drop table
    await client.query(`
      DROP TABLE IF EXISTS behavioral_analysis_logs
    `);
    
    console.log('✅ behavioral_analysis_logs table dropped successfully');
    
  } catch (error) {
    console.error('❌ Error dropping behavioral_analysis_logs table:', error);
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { up, down }; 