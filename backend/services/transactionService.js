const CreditTransaction = require('../models/CreditTransaction');

class TransactionService {
  /**
   * Log a new credit transaction
   * @param {Object} data - Transaction data
   * @param {Object} [options] - Sequelize options (e.g., transaction)
   * @returns {Promise<CreditTransaction>} The created transaction
   */
  async logTransaction(data, options = {}) {
    return await CreditTransaction.create(data, options);
  }

  /**
   * Get transactions for a user
   * @param {string} userId - User ID
   * @param {Object} options - Query options (limit, offset, type)
   * @returns {Promise<Array>} Transaction history
   */
  async getUserTransactions(userId, options = {}) {
    const { limit = 50, offset = 0, type = null } = options;
    const whereClause = { userId };
    if (type) whereClause.transactionType = type;
    return await CreditTransaction.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });
  }

  /**
   * Get a transaction by ID
   * @param {number} id - Transaction ID
   * @returns {Promise<CreditTransaction|null>}
   */
  async getTransactionById(id) {
    return await CreditTransaction.findByPk(id);
  }

  /**
   * Update a transaction
   * @param {number} id - Transaction ID
   * @param {Object} updates - Fields to update
   * @param {Object} [options] - Sequelize options
   * @returns {Promise<CreditTransaction|null>}
   */
  async updateTransaction(id, updates, options = {}) {
    const tx = await CreditTransaction.findByPk(id);
    if (!tx) return null;
    return await tx.update(updates, options);
  }
}

module.exports = new TransactionService(); 