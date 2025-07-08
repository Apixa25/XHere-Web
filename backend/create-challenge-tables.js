const sequelize = require('./config/database');

async function createChallengeTables() {
  try {
    console.log('🔧 Creating challenge tables...\n');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection successful');
    
    // Create challenges table
    console.log('📋 Creating challenges table...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS challenges (
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
        created_by UUID NOT NULL REFERENCES "Users"(id),
        featured BOOLEAN DEFAULT false,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Challenges table created');
    
    // Create challenge_submissions table
    console.log('📋 Creating challenge_submissions table...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS challenge_submissions (
        id SERIAL PRIMARY KEY,
        challenge_id INTEGER NOT NULL REFERENCES challenges(id),
        user_id UUID NOT NULL REFERENCES "Users"(id),
        location_id INTEGER NOT NULL REFERENCES "Locations"(id),
        submission_text TEXT,
        score DECIMAL(10,2) DEFAULT 0,
        vote_count INTEGER DEFAULT 0,
        upvotes INTEGER DEFAULT 0,
        downvotes INTEGER DEFAULT 0,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Challenge submissions table created');
    
    // Create challenge_votes table
    console.log('📋 Creating challenge_votes table...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS challenge_votes (
        id SERIAL PRIMARY KEY,
        submission_id INTEGER NOT NULL REFERENCES challenge_submissions(id),
        user_id UUID NOT NULL REFERENCES "Users"(id),
        vote_type VARCHAR(20) NOT NULL,
        reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(submission_id, user_id)
      )
    `);
    console.log('✅ Challenge votes table created');
    
    // Create challenge_rewards table
    console.log('📋 Creating challenge_rewards table...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS challenge_rewards (
        id SERIAL PRIMARY KEY,
        challenge_id INTEGER NOT NULL REFERENCES challenges(id),
        user_id UUID NOT NULL REFERENCES "Users"(id),
        reward_type VARCHAR(50) NOT NULL,
        reward_amount INTEGER NOT NULL,
        reward_description TEXT,
        distributed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Challenge rewards table created');
    
    // Create indexes
    console.log('📋 Creating indexes...');
    await sequelize.query('CREATE INDEX IF NOT EXISTS idx_challenges_status ON challenges(status)');
    await sequelize.query('CREATE INDEX IF NOT EXISTS idx_challenges_start_date ON challenges(start_date)');
    await sequelize.query('CREATE INDEX IF NOT EXISTS idx_challenges_end_date ON challenges(end_date)');
    await sequelize.query('CREATE INDEX IF NOT EXISTS idx_challenges_type ON challenges(type)');
    await sequelize.query('CREATE INDEX IF NOT EXISTS idx_challenges_featured ON challenges(featured)');
    await sequelize.query('CREATE INDEX IF NOT EXISTS idx_challenge_submissions_challenge_id ON challenge_submissions(challenge_id)');
    await sequelize.query('CREATE INDEX IF NOT EXISTS idx_challenge_submissions_user_id ON challenge_submissions(user_id)');
    await sequelize.query('CREATE INDEX IF NOT EXISTS idx_challenge_submissions_score ON challenge_submissions(score DESC)');
    await sequelize.query('CREATE INDEX IF NOT EXISTS idx_challenge_votes_submission_id ON challenge_votes(submission_id)');
    await sequelize.query('CREATE INDEX IF NOT EXISTS idx_challenge_votes_user_id ON challenge_votes(user_id)');
    console.log('✅ Indexes created');
    
    console.log('\n🎉 All challenge tables created successfully!');
    
    // Test the Challenge model
    try {
      const { Challenge } = require('./models');
      const count = await Challenge.count();
      console.log(`✅ Challenge model works - found ${count} challenges`);
    } catch (error) {
      console.log('⚠️ Challenge model test failed:', error.message);
    }
    
  } catch (error) {
    console.error('💥 Error creating challenge tables:', error.message);
  } finally {
    await sequelize.close();
  }
}

createChallengeTables(); 