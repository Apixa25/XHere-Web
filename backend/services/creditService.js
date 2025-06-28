const User = require('../models/User');
const CreditTransaction = require('../models/CreditTransaction');
const UserCreditStats = require('../models/UserCreditStats');
const { Op } = require('sequelize');
const transactionService = require('./transactionService');

class CreditService {
  /**
   * Get user's current credit balance
   * @param {string} userId - User ID
   * @returns {Promise<number>} Current credit balance
   */
  async getBalance(userId) {
    try {
      console.log('🔍 CreditService.getBalance - Looking for user ID:', userId);
      const user = await User.findByPk(userId);
      console.log('🔍 CreditService.getBalance - User found:', user ? 'Yes' : 'No');
      if (user) {
        console.log('🔍 CreditService.getBalance - User credits:', user.credits);
      }
      if (!user) {
        throw new Error('User not found');
      }
      return user.credits;
    } catch (error) {
      console.error('Error getting credit balance:', error);
      throw error;
    }
  }

  /**
   * Add credits to user account (purchase, bonus, refund, etc.)
   * @param {string} userId - User ID
   * @param {number} amount - Amount of credits to add
   * @param {string} transactionType - Type of transaction
   * @param {string} description - Transaction description
   * @param {Object} metadata - Additional transaction data
   * @returns {Promise<Object>} Updated user and transaction
   */
  async addCredits(userId, amount, transactionType, description = null, metadata = {}) {
    const transaction = await User.sequelize.transaction();
    
    try {
      // Validate amount
      if (amount <= 0) {
        throw new Error('Amount must be positive');
      }

      // Get user with lock to prevent race conditions
      const user = await User.findByPk(userId, { 
        lock: true, 
        transaction 
      });
      
      if (!user) {
        throw new Error('User not found');
      }

      // Update user credits
      const newBalance = user.credits + amount;
      await user.update({ credits: newBalance }, { transaction });

      // Use TransactionService to log transaction
      const creditTransaction = await transactionService.logTransaction({
        userId,
        transactionType,
        amount,
        description,
        status: 'completed',
        metadata
      }, { transaction });

      // Update user credit stats
      await this.updateUserCreditStats(userId, amount, transactionType, transaction);

      await transaction.commit();

      return {
        user: await User.findByPk(userId),
        transaction: creditTransaction
      };
    } catch (error) {
      await transaction.rollback();
      console.error('Error adding credits:', error);
      throw error;
    }
  }

  /**
   * Spend credits from user account
   * @param {string} userId - User ID
   * @param {number} amount - Amount of credits to spend
   * @param {string} description - Transaction description
   * @param {Object} metadata - Additional transaction data
   * @returns {Promise<Object>} Updated user and transaction
   */
  async spendCredits(userId, amount, description = null, metadata = {}) {
    const transaction = await User.sequelize.transaction();
    
    try {
      // Validate amount
      if (amount <= 0) {
        throw new Error('Amount must be positive');
      }

      // Get user with lock to prevent race conditions
      const user = await User.findByPk(userId, { 
        lock: true, 
        transaction 
      });
      
      if (!user) {
        throw new Error('User not found');
      }

      // Check if user has enough credits
      if (user.credits < amount) {
        throw new Error('Insufficient credits');
      }

      // Update user credits
      const newBalance = user.credits - amount;
      await user.update({ credits: newBalance }, { transaction });

      // Use TransactionService to log transaction
      const creditTransaction = await transactionService.logTransaction({
        userId,
        transactionType: 'spend',
        amount: -amount,
        description,
        status: 'completed',
        metadata
      }, { transaction });

      // Update user credit stats
      await this.updateUserCreditStats(userId, amount, 'spend', transaction);

      await transaction.commit();

      return {
        user: await User.findByPk(userId),
        transaction: creditTransaction
      };
    } catch (error) {
      await transaction.rollback();
      console.error('Error spending credits:', error);
      throw error;
    }
  }

  /**
   * Get user's transaction history
   * @param {string} userId - User ID
   * @param {Object} options - Query options (limit, offset, type)
   * @returns {Promise<Array>} Transaction history
   */
  async getTransactionHistory(userId, options = {}) {
    try {
      // Use TransactionService to get user transactions
      return await transactionService.getUserTransactions(userId, options);
    } catch (error) {
      console.error('Error getting transaction history:', error);
      throw error;
    }
  }

  /**
   * Get user's credit statistics
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Credit statistics
   */
  async getCreditStats(userId) {
    try {
      let stats = await UserCreditStats.findOne({ where: { userId } });
      
      if (!stats) {
        // Create stats record if it doesn't exist
        stats = await UserCreditStats.create({
          userId,
          totalCreditsPurchased: 0,
          totalCreditsSpent: 0,
          totalAmountSpent: 0
        });
      }

      return stats;
    } catch (error) {
      console.error('Error getting credit stats:', error);
      throw error;
    }
  }

  /**
   * Update user credit statistics
   * @param {string} userId - User ID
   * @param {number} amount - Amount involved in transaction
   * @param {string} transactionType - Type of transaction
   * @param {Object} transaction - Database transaction object
   * @returns {Promise<void>}
   */
  async updateUserCreditStats(userId, amount, transactionType, transaction) {
    try {
      let stats = await UserCreditStats.findOne({ 
        where: { userId },
        transaction 
      });

      if (!stats) {
        stats = await UserCreditStats.create({
          userId,
          totalCreditsPurchased: 0,
          totalCreditsSpent: 0,
          totalAmountSpent: 0
        }, { transaction });
      }

      const updateData = {};

      if (transactionType === 'purchase') {
        updateData.totalCreditsPurchased = stats.totalCreditsPurchased + amount;
        updateData.lastPurchaseDate = new Date();
        if (!stats.firstPurchaseDate) {
          updateData.firstPurchaseDate = new Date();
        }
      } else if (transactionType === 'spend') {
        updateData.totalCreditsSpent = stats.totalCreditsSpent + amount;
      }

      await stats.update(updateData, { transaction });
    } catch (error) {
      console.error('Error updating credit stats:', error);
      throw error;
    }
  }

  /**
   * Validate if user has sufficient credits
   * @param {string} userId - User ID
   * @param {number} amount - Required amount
   * @returns {Promise<boolean>} True if user has sufficient credits
   */
  async hasSufficientCredits(userId, amount) {
    try {
      const balance = await this.getBalance(userId);
      return balance >= amount;
    } catch (error) {
      console.error('Error checking credit sufficiency:', error);
      return false;
    }
  }

  /**
   * Get credit purchase options (for frontend display)
   * @returns {Array} Available credit packages
   */
  getCreditPackages() {
    return [
      { credits: 10, price: 1000, description: 'Starter Pack' }, // $10 for 10 credits
      { credits: 25, price: 2000, description: 'Popular Pack' }, // $20 for 25 credits
      { credits: 50, price: 3500, description: 'Value Pack' },   // $35 for 50 credits
      { credits: 100, price: 6000, description: 'Premium Pack' } // $60 for 100 credits
    ];
  }
}

module.exports = new CreditService(); 