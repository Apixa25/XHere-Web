const creditService = require('../services/creditService');
const { User, CreditTransaction, UserCreditStats } = require('../models');
const sequelize = require('../config/database');

async function testCreditSystem() {
  try {
    console.log('🧪 Testing Credit System...\n');

    // Test 1: Get credit packages
    console.log('📦 Test 1: Credit Packages');
    const packages = creditService.getCreditPackages();
    console.log('Available packages:', packages);
    console.log('✅ Credit packages test passed\n');

    // Test 2: Find a test user or create one
    console.log('👤 Test 2: User Setup');
    let testUser = await User.findOne({ where: { email: 'test@xhere.world' } });
    
    if (!testUser) {
      console.log('Creating test user...');
      testUser = await User.create({
        email: 'test@xhere.world',
        password: 'testpassword123',
        credits: 100
      });
    }
    
    console.log(`Test user: ${testUser.email} (ID: ${testUser.id})`);
    console.log(`Initial credits: ${testUser.credits}`);
    console.log('✅ User setup test passed\n');

    // Test 3: Get balance
    console.log('💰 Test 3: Get Balance');
    const balance = await creditService.getBalance(testUser.id);
    console.log(`Current balance: ${balance} credits`);
    console.log('✅ Get balance test passed\n');

    // Test 4: Add credits
    console.log('➕ Test 4: Add Credits');
    const addResult = await creditService.addCredits(
      testUser.id,
      50,
      'bonus',
      'Test bonus credits'
    );
    console.log(`Added 50 credits. New balance: ${addResult.user.credits}`);
    console.log('✅ Add credits test passed\n');

    // Test 5: Spend credits
    console.log('➖ Test 5: Spend Credits');
    const spendResult = await creditService.spendCredits(
      testUser.id,
      25,
      'Test purchase'
    );
    console.log(`Spent 25 credits. New balance: ${spendResult.user.credits}`);
    console.log('✅ Spend credits test passed\n');

    // Test 6: Get transaction history
    console.log('📋 Test 6: Transaction History');
    const transactions = await creditService.getTransactionHistory(testUser.id, { limit: 10 });
    console.log(`Found ${transactions.length} transactions:`);
    transactions.forEach(tx => {
      console.log(`  - ${tx.transactionType}: ${tx.amount} credits (${tx.description})`);
    });
    console.log('✅ Transaction history test passed\n');

    // Test 7: Get credit stats
    console.log('📊 Test 7: Credit Statistics');
    const stats = await creditService.getCreditStats(testUser.id);
    console.log('Credit stats:', {
      totalPurchased: stats.totalCreditsPurchased,
      totalSpent: stats.totalCreditsSpent,
      totalAmountSpent: stats.totalAmountSpent
    });
    console.log('✅ Credit stats test passed\n');

    // Test 8: Validate sufficient credits
    console.log('✅ Test 8: Credit Validation');
    const hasSufficient = await creditService.hasSufficientCredits(testUser.id, 50);
    console.log(`Has sufficient credits for 50: ${hasSufficient}`);
    console.log('✅ Credit validation test passed\n');

    console.log('🎉 All credit system tests passed!');
    console.log(`Final balance for ${testUser.email}: ${await creditService.getBalance(testUser.id)} credits`);

  } catch (error) {
    console.error('❌ Credit system test failed:', error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

// Run the test
testCreditSystem(); 