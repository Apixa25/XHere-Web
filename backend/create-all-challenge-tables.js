const { sequelize } = require('./config/database');

async function createAllChallengeTables() {
  try {
    console.log('🔧 Creating all challenge tables...');
    
    // Drop existing tables if they exist
    await sequelize.query('DROP TABLE IF EXISTS challenge_rewards CASCADE');
    await sequelize.query('DROP TABLE IF EXISTS challenge_votes CASCADE');
    await sequelize.query('DROP TABLE IF EXISTS challenge_submissions CASCADE');
    await sequelize.query('DROP TABLE IF EXISTS challenges CASCADE');
    console.log('✅ Dropped existing challenge tables');
    
    // Create challenges table
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
    
    // Create challenge_submissions table
    await sequelize.query(`
      CREATE TABLE challenge_submissions (
        id SERIAL PRIMARY KEY,
        challenge_id INTEGER NOT NULL REFERENCES challenges(id),
        user_id UUID NOT NULL REFERENCES users(id),
        location_id UUID NOT NULL REFERENCES locations(id),
        submission_text TEXT,
        status VARCHAR(20) DEFAULT 'pending',
        admin_notes TEXT,
        vote_count INTEGER DEFAULT 0,
        upvotes INTEGER DEFAULT 0,
        downvotes INTEGER DEFAULT 0,
        score DECIMAL(10,2) DEFAULT 0.00,
        rank INTEGER,
        reward_amount INTEGER DEFAULT 0,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(challenge_id, user_id, location_id)
      )
    `);
    console.log('✅ Created challenge_submissions table');
    
    // Create challenge_votes table
    await sequelize.query(`
      CREATE TABLE challenge_votes (
        id SERIAL PRIMARY KEY,
        submission_id INTEGER NOT NULL REFERENCES challenge_submissions(id),
        user_id UUID NOT NULL REFERENCES users(id),
        vote_type VARCHAR(20) NOT NULL,
        vote_weight INTEGER DEFAULT 1,
        reason TEXT,
        is_valid BOOLEAN DEFAULT true,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(submission_id, user_id)
      )
    `);
    console.log('✅ Created challenge_votes table');
    
    // Create challenge_rewards table
    await sequelize.query(`
      CREATE TABLE challenge_rewards (
        id SERIAL PRIMARY KEY,
        challenge_id INTEGER NOT NULL REFERENCES challenges(id),
        submission_id INTEGER REFERENCES challenge_submissions(id),
        user_id UUID NOT NULL REFERENCES users(id),
        reward_type VARCHAR(20) NOT NULL,
        credit_amount INTEGER NOT NULL,
        badge_id INTEGER REFERENCES badges(id),
        rank INTEGER,
        status VARCHAR(20) DEFAULT 'pending',
        awarded_at TIMESTAMP,
        transaction_id INTEGER REFERENCES credit_transactions(id),
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Created challenge_rewards table');
    
    // Create indexes
    console.log('🔗 Creating indexes...');
    
    // Challenges indexes
    await sequelize.query('CREATE INDEX challenges_status ON challenges (status)');
    await sequelize.query('CREATE INDEX challenges_start_date ON challenges (start_date)');
    await sequelize.query('CREATE INDEX challenges_end_date ON challenges (end_date)');
    await sequelize.query('CREATE INDEX challenges_type ON challenges (type)');
    await sequelize.query('CREATE INDEX challenges_featured ON challenges (featured)');
    
    // Challenge submissions indexes
    await sequelize.query('CREATE INDEX challenge_submissions_challenge_id ON challenge_submissions (challenge_id)');
    await sequelize.query('CREATE INDEX challenge_submissions_user_id ON challenge_submissions (user_id)');
    await sequelize.query('CREATE INDEX challenge_submissions_location_id ON challenge_submissions (location_id)');
    await sequelize.query('CREATE INDEX challenge_submissions_status ON challenge_submissions (status)');
    await sequelize.query('CREATE INDEX challenge_submissions_score ON challenge_submissions (score)');
    await sequelize.query('CREATE INDEX challenge_submissions_rank ON challenge_submissions (rank)');
    
    // Challenge votes indexes
    await sequelize.query('CREATE INDEX challenge_votes_submission_id ON challenge_votes (submission_id)');
    await sequelize.query('CREATE INDEX challenge_votes_user_id ON challenge_votes (user_id)');
    await sequelize.query('CREATE INDEX challenge_votes_vote_type ON challenge_votes (vote_type)');
    await sequelize.query('CREATE INDEX challenge_votes_is_valid ON challenge_votes (is_valid)');
    
    // Challenge rewards indexes
    await sequelize.query('CREATE INDEX challenge_rewards_challenge_id ON challenge_rewards (challenge_id)');
    await sequelize.query('CREATE INDEX challenge_rewards_user_id ON challenge_rewards (user_id)');
    await sequelize.query('CREATE INDEX challenge_rewards_reward_type ON challenge_rewards (reward_type)');
    await sequelize.query('CREATE INDEX challenge_rewards_status ON challenge_rewards (status)');
    await sequelize.query('CREATE INDEX challenge_rewards_rank ON challenge_rewards (rank)');
    
    console.log('✅ Created all indexes');
    
    // Verify all tables were created
    const tables = await sequelize.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'challenge%'",
      { type: sequelize.QueryTypes.SELECT }
    );
    
    console.log('📋 Created challenge tables:');
    tables.forEach(table => {
      console.log(`  - ${table.table_name}`);
    });
    
    console.log('🎉 All challenge tables created successfully!');
    
  } catch (error) {
    console.error('❌ Error creating challenge tables:', error.message);
    console.error(error.stack);
  } finally {
    await sequelize.close();
  }
}

createAllChallengeTables(); 