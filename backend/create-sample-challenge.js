const sequelize = require('./config/database');

async function createSampleChallenge() {
  try {
    console.log('🎯 Creating sample challenge...\n');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection successful');
    
    // Get a user ID (you can replace this with a real user ID)
    const [users] = await sequelize.query('SELECT id FROM "Users" LIMIT 1');
    if (users.length === 0) {
      console.log('❌ No users found in database');
      return;
    }
    
    const userId = users[0].id;
    console.log('👤 Using user ID:', userId);
    
    // Create sample challenge
    const [challenge] = await sequelize.query(`
      INSERT INTO challenges (
        title, 
        description, 
        type, 
        status, 
        start_date, 
        end_date, 
        criteria, 
        rewards, 
        created_by,
        created_at,
        updated_at
      ) VALUES (
        'Hidden Gems Discovery',
        'Find and share the most amazing hidden locations in your area! This challenge encourages users to discover and share unique places that others might not know about.',
        'weekly',
        'active',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP + INTERVAL '7 days',
        '{"locationTypes": ["restaurant", "park", "landmark", "shop"], "keywords": ["hidden", "secret", "local", "unique"], "minRating": 4.0}',
        '{"credits": 100, "badges": ["Explorer"], "description": "100 credits + Explorer badge for the best submission"}',
        ?,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      ) RETURNING *
    `, { replacements: [userId] });
    
    console.log('✅ Sample challenge created:', challenge[0].title);
    
    // Create another challenge
    const [challenge2] = await sequelize.query(`
      INSERT INTO challenges (
        title, 
        description, 
        type, 
        status, 
        start_date, 
        end_date, 
        criteria, 
        rewards, 
        created_by,
        created_at,
        updated_at
      ) VALUES (
        'Best Coffee Shops',
        'Share your favorite coffee shops and cafes! Find the most cozy, unique, or delicious coffee spots in your area.',
        'monthly',
        'active',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP + INTERVAL '30 days',
        '{"locationTypes": ["restaurant", "cafe"], "keywords": ["coffee", "cafe", "brew", "latte"], "minRating": 3.5}',
        '{"credits": 200, "badges": ["Coffee Connoisseur"], "description": "200 credits + Coffee Connoisseur badge for the best submission"}',
        ?,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      ) RETURNING *
    `, { replacements: [userId] });
    
    console.log('✅ Second sample challenge created:', challenge2[0].title);
    
    // Check total challenges
    const [count] = await sequelize.query('SELECT COUNT(*) as count FROM challenges');
    console.log(`📊 Total challenges in database: ${count[0].count}`);
    
    console.log('\n🎉 Sample challenges created successfully!');
    console.log('You can now test the Challenge Dashboard at http://localhost:3001/challenges');
    
  } catch (error) {
    console.error('💥 Error creating sample challenge:', error.message);
  } finally {
    await sequelize.close();
  }
}

createSampleChallenge(); 