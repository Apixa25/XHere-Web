const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Function to run migration
async function runMigration() {
  return new Promise((resolve, reject) => {
    console.log('🔄 Running challenge migration...');
    
    exec('npx sequelize-cli db:migrate', { cwd: path.join(__dirname, '..') }, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Migration failed:', error);
        reject(error);
        return;
      }
      
      console.log('✅ Migration completed successfully');
      console.log(stdout);
      resolve();
    });
  });
}

// Function to create sample challenge
async function createSampleChallenge() {
  try {
    console.log('🎯 Creating sample challenge...');
    
    const response = await fetch('http://localhost:3000/api/challenges/sample/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ADMIN_TOKEN || 'your-admin-token-here'}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create sample challenge');
    }

    const data = await response.json();
    console.log('✅ Sample challenge created successfully:', data.challenge.title);
    return data.challenge;
  } catch (error) {
    console.error('❌ Error creating sample challenge:', error.message);
    console.log('💡 Make sure the backend server is running and you have admin privileges');
    throw error;
  }
}

// Main setup function
async function setupChallenges() {
  try {
    console.log('🚀 Setting up Community Challenges system...\n');
    
    // Run migration
    await runMigration();
    
    console.log('\n🎯 Challenge system setup complete!');
    console.log('\n📋 Next steps:');
    console.log('1. Start the backend server: npm start');
    console.log('2. Create a sample challenge via API or admin panel');
    console.log('3. Test the challenge submission and voting features');
    console.log('4. Integrate the ChallengeDashboard component into your frontend');
    
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Run setup if this script is executed directly
if (require.main === module) {
  setupChallenges();
}

module.exports = { setupChallenges, runMigration, createSampleChallenge }; 