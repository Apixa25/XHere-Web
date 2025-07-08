const challengeService = require('./services/challengeService');
const { Challenge, ChallengeSubmission, ChallengeVote } = require('./models');

async function testChallengeVoting() {
  try {
    console.log('🧪 Testing challenge voting functionality...\n');

    // 1. Get all challenges
    console.log('📋 Fetching challenges...');
    const challenges = await challengeService.getActiveChallenges();
    console.log(`Found ${challenges.length} active challenges`);

    if (challenges.length === 0) {
      console.log('❌ No active challenges found. Please create a challenge first.');
      return;
    }

    // 2. Get the first challenge
    const challenge = challenges[0];
    console.log(`\n🎯 Testing with challenge: "${challenge.title}" (ID: ${challenge.id})`);

    // 3. Create a test submission if none exist
    console.log('\n📝 Creating test submission...');
    const testUserId = '00000000-0000-0000-0000-000000000001'; // Test user ID
    const testLocationId = '00000000-0000-0000-0000-000000000002'; // Test location ID
    
    let submission;
    try {
      submission = await challengeService.submitLocation(
        challenge.id, 
        testUserId, 
        testLocationId, 
        'Test submission for voting'
      );
      console.log('✅ Test submission created:', submission.id);
    } catch (error) {
      if (error.message.includes('already submitted')) {
        console.log('ℹ️ Test submission already exists, using existing one');
        // Find the existing submission
        submission = await ChallengeSubmission.findOne({
          where: {
            challengeId: challenge.id,
            userId: testUserId,
            locationId: testLocationId
          }
        });
      } else {
        throw error;
      }
    }

    // 4. Test voting on the submission
    console.log(`\n🗳️ Testing vote on submission ID: ${submission.id}`);
    console.log(`Submission details: Score=${submission.score}, Votes=${submission.voteCount}`);

    // 5. Test upvoting
    console.log('\n👍 Testing upvote...');
    await challengeService.voteOnSubmission(submission.id, testUserId, 'upvote', 'Test upvote');
    console.log('✅ Upvote successful!');

    // 6. Check updated vote counts
    const updatedSubmission = await ChallengeSubmission.findByPk(submission.id);
    console.log(`Updated submission: Score=${updatedSubmission.score}, Votes=${updatedSubmission.voteCount}, Upvotes=${updatedSubmission.upvotes}, Downvotes=${updatedSubmission.downvotes}`);

    // 7. Test downvoting (should update the existing vote)
    console.log('\n👎 Testing downvote (should update existing vote)...');
    await challengeService.voteOnSubmission(submission.id, testUserId, 'downvote', 'Changed to downvote');
    console.log('✅ Downvote successful!');

    // 8. Check final vote counts
    const finalSubmission = await ChallengeSubmission.findByPk(submission.id);
    console.log(`Final submission: Score=${finalSubmission.score}, Votes=${finalSubmission.voteCount}, Upvotes=${finalSubmission.upvotes}, Downvotes=${finalSubmission.downvotes}`);

    // 9. Check vote record
    const voteRecord = await ChallengeVote.findOne({
      where: {
        submissionId: submission.id,
        userId: testUserId
      }
    });
    console.log(`Vote record: Type=${voteRecord.voteType}, Reason=${voteRecord.reason}`);

    console.log('\n🎉 Challenge voting test completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Challenge: ${challenge.title}`);
    console.log(`- Submission ID: ${submission.id}`);
    console.log(`- Final Score: ${finalSubmission.score}`);
    console.log(`- Total Votes: ${finalSubmission.voteCount}`);
    console.log(`- Upvotes: ${finalSubmission.upvotes}`);
    console.log(`- Downvotes: ${finalSubmission.downvotes}`);

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Error details:', error.message);
  }
}

// Run the test
testChallengeVoting(); 